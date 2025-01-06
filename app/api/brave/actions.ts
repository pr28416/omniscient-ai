"use server";

import { BraveImageSearchResponse, BraveWebSearchResponse } from "./schemas";

/**
 * Performs web searches using Brave's Search API
 * @param query The search query string
 * @param count Number of results to return (default: 5)
 * @returns Promise containing web search results from Brave API
 * @throws Error if API key is missing or API request fails
 */
export async function braveWebSearch(
  query: string,
  count: number = 5 // Default to 5 results if not specified
): Promise<BraveWebSearchResponse> {
  // Verify API key exists in environment variables
  if (!process.env.BRAVE_API_KEY) {
    throw new Error("BRAVE_API_KEY is not set");
  }

  // Construct query parameters
  const requestQuery = {
    q: query,
    count: count.toString(),
  };

  // Make API request to Brave's web search endpoint
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

  // Handle API errors
  if (!response.ok) {
    throw new Error(
      `Brave Search API error: ${response.status} ${response.statusText}`
    );
  }

  // Parse and return the response data
  const data = await response.json();
  return data;
}

/**
 * Performs image searches using Brave's Search API
 * @param query The search query string
 * @param count Number of results to return (default: 5)
 * @returns Promise containing image search results from Brave API
 * @throws Error if API key is missing or API request fails
 */
export async function braveImageSearch(
  query: string,
  count: number = 5 // Default to 5 results if not specified
): Promise<BraveImageSearchResponse> {
  // Verify API key exists in environment variables
  if (!process.env.BRAVE_API_KEY) {
    throw new Error("BRAVE_API_KEY is not set");
  }

  // Construct query parameters
  const requestQuery = {
    q: query,
    count: count.toString(),
  };

  // Make API request to Brave's image search endpoint
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

  // Handle API errors
  if (!response.ok) {
    throw new Error(
      `Brave Image Search API error: ${response.status} ${response.statusText}`
    );
  }

  // Parse and return the response data
  const data = await response.json();
  return data;
}
