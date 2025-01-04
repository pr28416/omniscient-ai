import { z } from "zod";

export interface SearchRequest {
  query: string;
}

export interface SearchResponse {
  queries: string[];
}

export const ZSearchResponse = z.object({
  queries: z.array(z.string()),
});

export interface BraveWebSearchResponse {
  web: {
    results: Array<{
      title: string;
      url: string;
      description: string;
      profile: {
        name: string;
        img: string;
      };
    }>;
  };
}

export interface BraveImageSearchResponse {
  results: Array<{
    title: string;
    url: string;
    properties: {
      url: string;
    };
  }>;
}

export interface WebSource {
  sourceNumber: number;
  url: string;
  title: string;
  summary?: string;
  favicon: string;
}

export interface StreamedFinalAnswerRequest {
  query: string;
  sources: WebSource[];
}

export interface ScrapeStatus {
  scrapeStatus: "not-started" | "in-progress" | "success" | "error";
  source: WebSource;
  error?: string;
}

export const ZFollowUpSearchQueriesResponse = z.object({
  queries: z.array(z.string()),
});

export type FollowUpSearchQueriesResponse = z.infer<
  typeof ZFollowUpSearchQueriesResponse
>;
