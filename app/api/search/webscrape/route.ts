import { NextRequest } from "next/server";

import { NextResponse } from "next/server";
import { webscrape } from "../actions";

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  const scrapeResponse = await webscrape(url);
  return NextResponse.json({ scrapeResponse });
}
