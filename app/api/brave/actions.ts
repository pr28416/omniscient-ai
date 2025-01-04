"use server";

import { BraveImageSearchResponse, BraveWebSearchResponse } from "./schemas";

export async function braveWebSearch(
  query: string,
  count: number = 5
): Promise<BraveWebSearchResponse> {
  if (!process.env.BRAVE_API_KEY) {
    throw new Error("BRAVE_API_KEY is not set");
  }

  const requestQuery = {
    q: query,
    count: count.toString(),
  };

  const response = await fetch(
    `https://api.search.brave.com/res/v1/web/search?${new URLSearchParams(
      requestQuery
    )}`,
    {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": process.env.BRAVE_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Brave Search API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data;
}

export async function braveImageSearch(
  query: string,
  count: number = 5
): Promise<BraveImageSearchResponse> {
  if (!process.env.BRAVE_API_KEY) {
    throw new Error("BRAVE_API_KEY is not set");
  }

  const requestQuery = {
    q: query,
    count: count.toString(),
  };

  const response = await fetch(
    `https://api.search.brave.com/res/v1/images/search?${new URLSearchParams(
      requestQuery
    )}`,
    {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": process.env.BRAVE_API_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Brave Image Search API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data;
}
