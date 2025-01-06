import { NextRequest, NextResponse } from "next/server";
import { describeImage } from "../actions";

/**
 * POST endpoint for generating image descriptions
 * 1. Takes an image title and URL from request body
 * 2. Calls describeImage to generate a description
 * 3. Returns the generated description as JSON
 */
export async function POST(req: NextRequest) {
  // Extract title and imageUrl from request body
  const { title, imageUrl } = await req.json();

  // Generate description for the image
  const imageDescription = await describeImage(title, imageUrl);

  // Return description as JSON response
  return NextResponse.json({ imageDescription });
}
