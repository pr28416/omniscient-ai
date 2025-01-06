import { NextRequest } from "next/server";

import { NextResponse } from "next/server";
import { webscrape } from "../actions";

/**
 * POST endpoint for scraping webpage content
 * 1. Takes a URL from request body
 * 2. Scrapes the webpage content using webscrape function
 * 3. Returns the scraped content as JSON response
 */
export async function POST(req: NextRequest) {
  // Extract URL from request body
  const { url } = await req.json();

  // Scrape content from the webpage
  const scrapeResponse = await webscrape(url);

  // Return scraped content as JSON response
  return NextResponse.json({ scrapeResponse });
}
