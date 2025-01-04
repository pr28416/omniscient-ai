import { BraveWebSearchResponse } from "@/app/api/brave/schemas";
import { ScrapeStatus } from "@/app/api/search/schemas";

export interface UserMessage {
  content: string;
}

export interface AssistantMessage {
  // Search queries
  searchQueries?: string[];
  isDoneGeneratingSearchQueries?: boolean;

  // Perform search
  isDonePerformingSearch?: boolean;
  searchResults?: BraveWebSearchResponse;

  // Process search results
  isDoneProcessingSearchResults?: boolean;
  processedSearchResults?: ScrapeStatus[];

  // Final answer
  finalAnswer?: string;
  isDoneGeneratingFinalAnswer?: boolean;

  // Follow-up search queries
  followUpSearchQueries?: string[];
}
