import { NextResponse } from "next/server";

export async function POST() {
  const delay = Math.floor(Math.random() * 201) + 900; // Random delay between 900 and 1100 ms
  await new Promise((resolve) => setTimeout(resolve, delay));
  return NextResponse.json({ message: "Hello, world!" });
}
