import { NextResponse } from "next/server";
import {
  webscrape,
  optimizeRawSearchQuery,
  detailedWebsiteSummary,
  getStreamedFinalAnswer,
} from "./actions";
import { SearchRequest, WebSource } from "./schemas";
import { braveWebSearch } from "../brave/actions";

export async function POST(req: Request) {
  const { query } = (await req.json()) as SearchRequest;

  // Optimize query first
  const response = await optimizeRawSearchQuery(query);
  if (!response) {
    return NextResponse.json(
      { error: "Failed to optimize query" },
      { status: 500 }
    );
  }

  // Search
  const braveResponse = await braveWebSearch(response.queries[0]);

  // Process multiple results
  const results = await Promise.all(
    braveResponse.web.results
      .slice(0, 3)
      .map(async (result, idx): Promise<WebSource | null> => {
        try {
          const scrapeResponse = await webscrape(result.url);
          const summaryResponse = await detailedWebsiteSummary(
            query,
            scrapeResponse || ""
          );

          return {
            url: result.url,
            title: result.title,
            favicon: result.profile.img,
            sourceNumber: idx + 1,
            summary: summaryResponse || "",
          };
        } catch (error) {
          console.error(`Error processing ${result.url}:`, error);
          return null;
        }
      })
  );

  // Filter out any failed results
  const validResults = results.filter((result) => result !== null);

  // Replace the direct return with a streaming response
  const stream = await getStreamedFinalAnswer({
    query,
    sources: validResults,
  });

  // return NextResponse.json({ streamedFinalAnswer: stream });

  // Return a streaming response
  return new NextResponse(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk) controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    }
  );
}
