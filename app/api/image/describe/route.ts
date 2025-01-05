import { NextRequest, NextResponse } from "next/server";
import { describeImage } from "../actions";

export async function POST(req: NextRequest) {
  const { title, imageUrl } = await req.json();
  const imageDescription = await describeImage(title, imageUrl);
  return NextResponse.json({ imageDescription });
}
