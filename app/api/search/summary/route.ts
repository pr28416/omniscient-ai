import { NextRequest, NextResponse } from "next/server";
import { detailedWebsiteSummary } from "../actions";

/**
 * POST endpoint for generating detailed website summaries
 * 1. Takes a search query and scraped website content
 * 2. Generates a detailed summary of the content focused on the query
 * 3. Returns the summary as JSON response
 */
export async function POST(req: NextRequest) {
  // Extract query and scraped content from request body
  const { query, scrapeResponse } = await req.json();

  // Generate detailed summary of the content focused on query
  const summaryResponse = await detailedWebsiteSummary(query, scrapeResponse);

  // Return summary as JSON response
  return NextResponse.json({ summaryResponse });
}
