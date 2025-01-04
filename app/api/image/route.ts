import { NextRequest, NextResponse } from "next/server";
import {
  braveImageSearch,
  describeImage,
  optimizeRawImageSearchQuery,
} from "../search/services";

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  const response = await optimizeRawImageSearchQuery(query);
  if (!response) {
    return NextResponse.json(
      { error: "Failed to optimize query" },
      { status: 500 }
    );
  }
  const { queries } = response;
  const braveImageSearchResponse = await braveImageSearch(queries[0]);
  const descriptions = await Promise.all(
    braveImageSearchResponse.results.map((result) =>
      describeImage(result.title, result.properties.url)
    )
  );
  return NextResponse.json({ descriptions });
}
