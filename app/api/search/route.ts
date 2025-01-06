import { NextResponse } from "next/server";
import {
  webscrape,
  optimizeRawSearchQuery,
  detailedWebsiteSummary,
  getStreamedFinalAnswer,
} from "./actions";
import { SearchRequest, WebSource } from "./schemas";
import { braveWebSearch } from "../brave/actions";

/**
 * POST endpoint for search functionality
 * 1. Takes a search query and optimizes it
 * 2. Searches web via Brave API
 * 3. Scrapes and summarizes top results
 * 4. Streams back a final synthesized answer
 */
export async function POST(req: Request) {
  // Extract search query from request body
  const { query } = (await req.json()) as SearchRequest;

  // Optimize the raw query into refined search queries
  const response = await optimizeRawSearchQuery(query);
  if (!response) {
    return NextResponse.json(
      { error: "Failed to optimize query" },
      { status: 500 }
    );
  }

  // Search web using first optimized query
  const braveResponse = await braveWebSearch(response.queries[0]);

  // Process top 3 search results in parallel
  const results = await Promise.all(
    braveResponse.web.results
      .slice(0, 3)
      .map(async (result, idx): Promise<WebSource | null> => {
        try {
          // Scrape webpage content
          const scrapeResponse = await webscrape(result.url);
          // Generate detailed summary of content
          const summaryResponse = await detailedWebsiteSummary(
            query,
            scrapeResponse || ""
          );

          // Return structured source info
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

  // Remove any results that failed processing
  const validResults = results.filter((result) => result !== null);

  // Generate streaming response using processed sources
  const stream = await getStreamedFinalAnswer({
    query,
    sources: validResults,
    imageSources: [],
  });

  // Set up streaming response with appropriate headers
  return new NextResponse(
    new ReadableStream({
      async start(controller) {
        // Stream each chunk of the answer as it's generated
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
