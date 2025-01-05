import { NextRequest, NextResponse } from "next/server";
import { optimizeRawImageSearchQuery } from "../actions";

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  const optimizedQueryResponse = await optimizeRawImageSearchQuery(query);
  return NextResponse.json({ optimizedQueryResponse });
}
