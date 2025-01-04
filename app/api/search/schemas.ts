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

export interface BraveSearchResponse {
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
  videos?: {
    results: Array<{
      title: string;
      url: string;
      description: string;
      meta_url: {
        favicon: string;
      };
    }>;
  };
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

// export interface GenerationStatus {
//   // Search queries
//   searchQueries?: string[];
//   isDoneGeneratingSearchQueries?: boolean;

//   // Final answer
//   finalAnswer?: string;
//   isDoneGeneratingFinalAnswer?: boolean;
// }

export interface ScrapeStatus {
  scrapeStatus: "not-started" | "in-progress" | "success" | "error";
  source: WebSource;
  error?: string;
}
