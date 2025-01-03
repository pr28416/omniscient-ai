import { NextResponse } from "next/server";
import {
  braveSearch,
  firecrawlWebScrape,
  generateExtendedQuery,
  optimizeRawSearchQuery,
} from "./services";
import { SearchRequest } from "./schemas";

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
  const braveResponse = await braveSearch(response.queries[0]);

  if (!braveResponse.web.results[0].url) {
    return NextResponse.json(
      { error: "Failed to find a URL to scrape" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    url: braveResponse.web.results[0].url,
  });

  // // Scrape
  // const scrapeResponse = await firecrawlWebScrape(
  //   braveResponse.web.results[0].url
  // );

  // return NextResponse.json({
  //   scrapeResponse,
  // });
}
