import { NextRequest, NextResponse } from "next/server";
import { describeImage } from "./actions";
import { braveImageSearch } from "../brave/actions";
import { optimizeRawImageSearchQuery } from "./actions";

/**
 * POST endpoint for image search and description
 * 1. Takes a search query and optimizes it for image search
 * 2. Uses optimized query to search for images via Brave API
 * 3. Generates descriptions for found images
 */
export async function POST(req: NextRequest) {
  // Extract search query from request body
  const { query } = await req.json();

  // Optimize the raw query for image search
  const response = await optimizeRawImageSearchQuery(query);
  if (!response) {
    return NextResponse.json(
      { error: "Failed to optimize query" },
      { status: 500 }
    );
  }

  // Extract optimized queries and use first one for image search
  const { queries } = response;
  const braveImageSearchResponse = await braveImageSearch(queries[0]);

  // Generate descriptions for all found images in parallel
  const descriptions = await Promise.all(
    braveImageSearchResponse.results.map((result) =>
      describeImage(result.title, result.properties.url)
    )
  );

  // Return array of image descriptions
  return NextResponse.json({ descriptions });
}
