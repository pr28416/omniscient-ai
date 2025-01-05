import {
  BraveImageSearchResponse,
  BraveWebSearchResponse,
} from "@/app/api/brave/schemas";
import { ImageScrapeStatus } from "@/app/api/image/schemas";
import { WebScrapeStatus } from "@/app/api/search/schemas";

export interface UserMessage {
  content: string;
}

export interface AssistantMessage {
  // Search queries
  searchQueries?: string[];
  isDoneGeneratingSearchQueries?: boolean;

  // Web search
  isDonePerformingSearch?: boolean;
  searchResults?: BraveWebSearchResponse;

  // Process web search results
  isDoneProcessingSearchResults?: boolean;
  processedSearchResults?: WebScrapeStatus[];

  // Image search queries
  imageSearchQueries?: string[];

  // Image search
  isDonePerformingImageSearch?: boolean;
  imageSearchResults?: BraveImageSearchResponse;

  // Process image search results
  isDoneProcessingImageSearchResults?: boolean;
  processedImageSearchResults?: ImageScrapeStatus[];

  // Final answer
  finalAnswer?: string;
  isDoneGeneratingFinalAnswer?: boolean;

  // Follow-up search queries
  followUpSearchQueries?: string[];
}

export interface AiWebSearchResponse {
  optimizedQueries: string[];
  processedSearchResults: WebScrapeStatus[];
}

export interface AiImageSearchResponse {
  optimizedQueries: string[];
  processedImageSearchResults: ImageScrapeStatus[];
}

export interface Message {
  userMessage: UserMessage;
  assistantMessage: AssistantMessage;
}

export interface Session {
  id: string;
  messages: Message[];
  title: string;
  hasTitleBeenSet: boolean;
}
