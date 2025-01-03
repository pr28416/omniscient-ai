import { cerebras, firecrawl, openai } from "@/lib/ai";
import { ChatCompletion } from "openai/resources/index.mjs";
import {
  BraveSearchResponse,
  SearchResponse,
  ZSearchResponse,
} from "./schemas";
import { zodResponseFormat } from "openai/helpers/zod.mjs";

export async function optimizeRawSearchQuery(
  query: string
): Promise<SearchResponse | null> {
  if (!process.env.CEREBRAS_API_KEY) {
    throw new Error("CEREBRAS_API_KEY is not set");
  }

  try {
    const response = await cerebras.chat.completions.create({
      model: "llama-3.3-70b",
      messages: [
        {
          role: "system",
          content:
            "Given a user search query, return the most optimized Google or Bing search queries for this. Your response should be a JSON object with the following schema: {queries: string[]}",
        },
        { role: "user", content: query },
      ],
      response_format: { type: "json_object" },
    });

    const searchResponse = JSON.parse(
      (response.choices as ChatCompletion.Choice[])[0].message.content!
    ) as SearchResponse;
    searchResponse.queries = searchResponse.queries.map((query) =>
      query.trim()
    );
    return searchResponse;
  } catch (error) {
    console.error(error);

    const response = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: query }],
      response_format: zodResponseFormat(ZSearchResponse, "search_response"),
    });

    return response.choices[0].message.parsed;
  }
}

export async function braveSearch(query: string): Promise<BraveSearchResponse> {
  if (!process.env.BRAVE_API_KEY) {
    throw new Error("BRAVE_API_KEY is not set");
  }

  const requestQuery = {
    q: query,
  };

  const response = await fetch(
    `https://api.search.brave.com/res/v1/web/search?${new URLSearchParams(
      requestQuery
    )}`,
    {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": process.env.BRAVE_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Brave Search API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data;
}

export async function firecrawlWebScrape(url: string): Promise<string> {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error("FIRECRAWL_API_KEY is not set");
  }

  const scrapeResponse = await firecrawl.scrapeUrl(url, {
    formats: ["markdown"],
  });

  console.log(scrapeResponse);

  if (!scrapeResponse.success || !scrapeResponse.markdown) {
    throw new Error(scrapeResponse.error);
  }

  return scrapeResponse.markdown;
}
