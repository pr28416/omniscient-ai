import { z } from "zod";
import { Status } from "../utils/schemas";
import { ImageSource } from "../image/schemas";

export interface SearchRequest {
  query: string;
}

export interface SearchResponse {
  queries: string[];
}

export const ZSearchResponse = z.object({
  queries: z.array(z.string()),
});

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
  imageSources: ImageSource[];
}

export interface WebScrapeStatus {
  scrapeStatus: Status;
  source: WebSource;
  error?: string;
}

export const ZFollowUpSearchQueriesResponse = z.object({
  queries: z.array(z.string()),
});

export type FollowUpSearchQueriesResponse = z.infer<
  typeof ZFollowUpSearchQueriesResponse
>;
