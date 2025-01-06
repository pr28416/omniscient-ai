import { NextRequest, NextResponse } from "next/server";
import { optimizeRawImageSearchQuery } from "../actions";

/**
 * POST endpoint for optimizing image search queries
 * 1. Takes a raw search query from request body
 * 2. Optimizes it for image search using optimizeRawImageSearchQuery
 * 3. Returns the optimized query response as JSON
 */
export async function POST(req: NextRequest) {
  // Extract search query from request body
  const { query } = await req.json();

  // Optimize the raw query for image search
  const optimizedQueryResponse = await optimizeRawImageSearchQuery(query);

  // Return optimized query response as JSON
  return NextResponse.json({ optimizedQueryResponse });
}
