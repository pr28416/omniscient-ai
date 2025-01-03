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
  videos: {
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
