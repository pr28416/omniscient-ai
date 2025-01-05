import { NextRequest, NextResponse } from "next/server";
import { detailedWebsiteSummary } from "../actions";

export async function POST(req: NextRequest) {
  const { query, scrapeResponse } = await req.json();
  const summaryResponse = await detailedWebsiteSummary(query, scrapeResponse);
  return NextResponse.json({ summaryResponse });
}
