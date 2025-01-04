import { BraveSearchResponse, ScrapeStatus } from "@/app/api/search/schemas";

export interface UserMessage {
  content: string;
}

export interface AssistantMessage {
  // Search queries
  searchQueries?: string[];
  isDoneGeneratingSearchQueries?: boolean;

  // Perform search
  isDonePerformingSearch?: boolean;
  searchResults?: BraveSearchResponse;

  // Process search results
  isDoneProcessingSearchResults?: boolean;
  processedSearchResults?: ScrapeStatus[];

  // Final answer
  finalAnswer?: string;
  isDoneGeneratingFinalAnswer?: boolean;
}
