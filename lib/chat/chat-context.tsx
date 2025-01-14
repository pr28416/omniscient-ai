"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  Dispatch,
  SetStateAction,
  useEffect,
} from "react";
import {
  AiImageSearchResponse,
  AiWebSearchResponse,
  Message,
  Session,
} from "./schemas";
import { AssistantMessage } from "./schemas";
import {
  optimizeRawSearchQuery,
  getStreamedFinalAnswer,
  generateFollowUpSearchQueries,
} from "@/app/api/search/actions";
import { SearchResponse, WebScrapeStatus } from "@/app/api/search/schemas";
import {
  BraveImageSearchResponse,
  BraveWebSearchResponse,
} from "@/app/api/brave/schemas";
import { braveImageSearch, braveWebSearch } from "@/app/api/brave/actions";
import { createSessionTitle, decision } from "@/app/api/utils/actions";
import { ImageScrapeStatus } from "@/app/api/image/schemas";
import { v4 as uuidv4 } from "uuid";

// Define the shape of our Chat Context including all required methods and state
interface ChatContextType {
  sessions: Session[];
  setSessions: Dispatch<SetStateAction<Session[]>>;
  currentSessionId: string;
  setCurrentSessionId: Dispatch<SetStateAction<string>>;
  currentSessionTitle: string;
  setCurrentSessionTitle: Dispatch<SetStateAction<string>>;
  currentMessages: Message[];
  setCurrentMessages: Dispatch<SetStateAction<Message[]>>;
  createNewSession: (setAsCurrentSession: boolean) => void;
  addUserMessage: (content: string) => void;
  updateLatestAssistantMessage: (newAssistantMessage: AssistantMessage) => void;
  clearMessages: () => void;
  generateAssistantResponse: (
    query: string,
    signal: AbortSignal
  ) => Promise<void>;
}

// Create the context with undefined default value
const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  // Core state management for chat sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [currentSessionTitle, setCurrentSessionTitle] = useState<string>("");
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);

  // Helper function to create a new chat session
  const createNewSession = (setAsCurrentSession: boolean = true) => {
    const newSession: Session = {
      id: uuidv4(),
      messages: [],
      title: "New session",
      hasTitleBeenSet: false,
    };
    setSessions((prev) => [...prev, newSession]);
    if (setAsCurrentSession) {
      setCurrentSessionId(newSession.id);
    }
  };

  // Initialize with a new session ID on component mount
  useEffect(() => {
    setCurrentSessionId(uuidv4());
  }, []);

  // Sync current session data when session ID changes
  useEffect(() => {
    if (currentSessionId) {
      const session = sessions.find(
        (session) => session.id === currentSessionId
      );
      if (session) {
        setCurrentSessionTitle(session.title);
        setCurrentMessages(session.messages);
      } else {
        createNewSession(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId]);

  // Update sessions array when messages or title changes
  useEffect(() => {
    setSessions((prev) => {
      const newSessions: Session[] = [];

      for (const session of prev) {
        if (session.id === currentSessionId) {
          newSessions.push({
            id: currentSessionId,
            messages: currentMessages,
            title: currentSessionTitle,
            hasTitleBeenSet: currentMessages.length > 0,
          });
        } else {
          newSessions.push(session);
        }
      }

      return newSessions;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMessages, currentSessionTitle]);

  // Add a new user message to the current session
  const addUserMessage = async (content: string) => {
    const newMessage: Message = {
      userMessage: { content },
      assistantMessage: {
        isDoneGeneratingSearchQueries: false,
      },
    };
    setCurrentMessages((prev) => [...prev, newMessage]);
    if (currentMessages.length === 0) {
      setCurrentSessionTitle(await createSessionTitle(content));
    }
  };

  // Update the most recent assistant message with new content
  const updateLatestAssistantMessage = (
    newAssistantMessage: AssistantMessage
  ) => {
    setCurrentMessages((prev) => {
      const newMessages = [...prev];
      const lastMessage = { ...newMessages[newMessages.length - 1] };
      lastMessage.assistantMessage = {
        ...lastMessage.assistantMessage,
        ...newAssistantMessage,
      };
      newMessages[newMessages.length - 1] = lastMessage;
      return newMessages;
    });
  };

  const clearMessages = () => {
    setCurrentMessages([]);
  };

  // Web search functionality
  const aiWebSearch = async (
    query: string,
    signal: AbortSignal
  ): Promise<AiWebSearchResponse> => {
    // 1. Optimize the search query
    // 2. Perform web searches
    // 3. Process and scrape search results
    // 4. Update UI state throughout the process
    const optimizedQueryResponse = await optimizeRawSearchQuery(query);
    if (signal.aborted) throw new Error("Generation cancelled");

    if (!optimizedQueryResponse) {
      updateLatestAssistantMessage({
        isDoneGeneratingSearchQueries: true,
      });
      return {
        optimizedQueries: [],
        processedSearchResults: [],
      };
    }

    const { queries: optimizedQueries } = optimizedQueryResponse;
    updateLatestAssistantMessage({
      isDoneGeneratingSearchQueries: true,
      searchQueries: optimizedQueries,
    });

    const allSearchResults: BraveWebSearchResponse = {
      web: { results: [] },
    };

    for (const query of optimizedQueries) {
      if (signal.aborted) throw new Error("Generation cancelled");

      const singleChunkSearchResults = await braveWebSearch(query);

      for (const result of singleChunkSearchResults.web.results) {
        if (allSearchResults.web.results.length >= 7) break;
        if (!allSearchResults.web.results.some((r) => r.url === result.url)) {
          allSearchResults.web.results.push(result);
        }
      }

      updateLatestAssistantMessage({
        isDonePerformingSearch: true,
        searchResults: allSearchResults,
      });
    }

    if (signal.aborted) throw new Error("Generation cancelled");

    const processedSearchResults: WebScrapeStatus[] =
      allSearchResults.web.results.map((result, idx) => ({
        scrapeStatus: "not-started",
        source: {
          url: result.url,
          title: result.title,
          favicon: result.profile.img,
          sourceNumber: idx + 1,
        },
      }));

    const processPromises = processedSearchResults.map(async (result, idx) => {
      if (signal.aborted) throw new Error("Generation cancelled");
      if (signal.aborted) throw new Error("Generation cancelled");

      try {
        processedSearchResults[idx].scrapeStatus = "in-progress";
        updateLatestAssistantMessage({
          processedSearchResults,
          isDoneProcessingSearchResults: true,
        });

        // const scrapeResponse = await webscrape(result.source.url);
        const { scrapeResponse }: { scrapeResponse: string | null } = await (
          await fetch("/api/search/webscrape", {
            method: "POST",
            body: JSON.stringify({ url: result.source.url }),
          })
        ).json();

        if (signal.aborted) throw new Error("Generation cancelled");
        if (!scrapeResponse) {
          throw new Error("Failed to scrape website");
        }

        const { summaryResponse }: { summaryResponse: string | null } = await (
          await fetch("/api/search/summary", {
            method: "POST",
            body: JSON.stringify({ query, scrapeResponse }),
          })
        ).json();

        if (signal.aborted) throw new Error("Generation cancelled");

        if (!summaryResponse) {
          throw new Error("Failed to summarize website");
        }

        processedSearchResults[idx].scrapeStatus = "success";
        processedSearchResults[idx].source.summary = summaryResponse;
      } catch (error) {
        if ((error as Error).message === "Generation cancelled") throw error;

        console.error(`Error processing ${result.source.url}:`, error);
        processedSearchResults[idx].scrapeStatus = "error";
        processedSearchResults[idx].error = (error as Error).message;
      }

      updateLatestAssistantMessage({
        processedSearchResults,
        isDoneProcessingSearchResults: true,
      });
    });

    await Promise.allSettled(processPromises);

    if (signal.aborted) throw new Error("Generation cancelled");

    return {
      optimizedQueries,
      processedSearchResults,
    };
  };

  // Image search functionality
  const aiImageSearch = async (
    query: string,
    signal: AbortSignal
  ): Promise<AiImageSearchResponse> => {
    // 1. Determine if image search is needed
    // 2. Optimize image search queries
    // 3. Perform image searches
    // 4. Process and describe images
    // 5. Update UI state throughout the process
    if (
      !(await decision(
        query,
        "Would image or diagram responses be helpful in response to the given query?"
      ))
    ) {
      return {
        optimizedQueries: [],
        processedImageSearchResults: [],
      };
    }

    const {
      optimizedQueryResponse,
    }: {
      optimizedQueryResponse: SearchResponse | null;
    } = (await (
      await fetch("/api/image/optimize-query", {
        method: "POST",
        body: JSON.stringify({ query }),
      })
    ).json()) as { optimizedQueryResponse: SearchResponse | null };
    if (signal.aborted) throw new Error("Generation cancelled");

    if (!optimizedQueryResponse) {
      updateLatestAssistantMessage({
        isDoneGeneratingSearchQueries: true,
      });
      return {
        optimizedQueries: [],
        processedImageSearchResults: [],
      };
    }

    updateLatestAssistantMessage({
      imageSearchQueries: optimizedQueryResponse.queries,
    });

    const allImageSearchResults: BraveImageSearchResponse = {
      results: [],
    };

    const { queries: optimizedQueries } = optimizedQueryResponse;

    for (const query of optimizedQueries) {
      if (signal.aborted) throw new Error("Generation cancelled");

      const singleChunkImageSearchResults = await braveImageSearch(query);

      for (const result of singleChunkImageSearchResults.results) {
        // Attempt to fetch the image. if success, keep it. if error, skip it.
        try {
          const image = await fetch(result.properties.url, { mode: "no-cors" });
          if (!image) {
            throw new Error("Failed to fetch image");
          }
        } catch (error) {
          console.error(`Error fetching ${result.properties.url}:`, error);
          continue;
        }

        if (allImageSearchResults.results.length >= 6) break;
        if (!allImageSearchResults.results.some((r) => r.url === result.url)) {
          allImageSearchResults.results.push(result);
        }
      }

      updateLatestAssistantMessage({
        imageSearchResults: allImageSearchResults,
      });
    }

    updateLatestAssistantMessage({
      isDonePerformingImageSearch: true,
      imageSearchResults: allImageSearchResults,
    });

    const processedImageSearchResults: ImageScrapeStatus[] =
      allImageSearchResults.results.map((result, idx) => ({
        scrapeStatus: "not-started",
        source: {
          title: result.title,
          imgUrl: result.properties.url,
          thumbnailUrl: result.thumbnail.src,
          webUrl: result.url,
          summary: "",
          sourceNumber: idx + 1,
        },
      }));

    updateLatestAssistantMessage({
      isDoneProcessingImageSearchResults: true,
      processedImageSearchResults,
    });

    const processPromises = processedImageSearchResults.map(
      async (result, idx) => {
        if (signal.aborted) throw new Error("Generation cancelled");

        // Skip if already processed or in error state
        if (
          ["success", "error"].includes(
            processedImageSearchResults[idx].scrapeStatus
          )
        ) {
          return;
        }

        try {
          processedImageSearchResults[idx].scrapeStatus = "in-progress";
          updateLatestAssistantMessage({
            processedImageSearchResults,
          });

          const { imageDescription }: { imageDescription: string | null } =
            await (
              await fetch("/api/image/describe", {
                method: "POST",
                body: JSON.stringify({
                  title: result.source.title,
                  imageUrl: result.source.imgUrl,
                }),
              })
            ).json();

          if (signal.aborted) throw new Error("Generation cancelled");

          if (!imageDescription) {
            throw new Error("Failed to describe image");
          }

          processedImageSearchResults[idx].source.summary = imageDescription;
          processedImageSearchResults[idx].scrapeStatus = "success";
        } catch (error) {
          if ((error as Error).message === "Generation cancelled") throw error;

          console.error(`Error processing ${result.source.imgUrl}:`, error);
          processedImageSearchResults[idx].scrapeStatus = "error";
          processedImageSearchResults[idx].error = (error as Error).message;
        }

        // Single update after processing is complete
        updateLatestAssistantMessage({
          processedImageSearchResults,
        });
      }
    );

    await Promise.allSettled(processPromises);

    if (signal.aborted) throw new Error("Generation cancelled");

    updateLatestAssistantMessage({
      processedImageSearchResults,
    });

    return {
      optimizedQueries,
      processedImageSearchResults,
    };
  };

  // Main function to generate assistant responses
  const generateAssistantResponse = async (
    query: string,
    signal: AbortSignal
  ): Promise<void> => {
    // 1. Add user message
    // 2. Perform parallel web and image searches
    // 3. Generate final answer using search results
    // 4. Generate follow-up questions
    // 5. Handle errors and cancellation
    query = query.trim();
    try {
      await addUserMessage(query);
      if (signal.aborted) throw new Error("Generation cancelled");

      const [webSearchResult, imageSearchResult] = await Promise.allSettled([
        aiWebSearch(query, signal),
        aiImageSearch(query, signal),
      ]);

      const processedSearchResults =
        webSearchResult.status === "fulfilled"
          ? webSearchResult.value.processedSearchResults
          : [];

      const optimizedQueries =
        webSearchResult.status === "fulfilled"
          ? webSearchResult.value.optimizedQueries
          : [];

      const processedImageSearchResults =
        imageSearchResult.status === "fulfilled"
          ? imageSearchResult.value.processedImageSearchResults
          : [];

      if (processedSearchResults.length === 0) {
        updateLatestAssistantMessage({
          isDoneGeneratingFinalAnswer: true,
          finalAnswer: "I was unable to find any relevant information.",
        });
        return;
      }

      const finalAnswer = await getStreamedFinalAnswer({
        query: query,
        sources: processedSearchResults.map((result) => result.source),
        imageSources: processedImageSearchResults
          .filter((result) => result.scrapeStatus === "success")
          .map((result) => result.source),
      });

      let finalAnswerString = "";
      for await (const chunk of finalAnswer) {
        if (signal.aborted) throw new Error("Generation cancelled");
        finalAnswerString += chunk || "";
        updateLatestAssistantMessage({
          finalAnswer: finalAnswerString,
          isDoneGeneratingFinalAnswer: true,
        });
      }

      updateLatestAssistantMessage({
        isDoneGeneratingFinalAnswer: true,
      });

      const followUpSearchQueriesResponse = await generateFollowUpSearchQueries(
        optimizedQueries,
        finalAnswerString
      );

      if (followUpSearchQueriesResponse) {
        updateLatestAssistantMessage({
          followUpSearchQueries: followUpSearchQueriesResponse.queries,
        });
      }
    } catch (error) {
      if ((error as Error).message !== "Generation cancelled") {
        console.error("Error during generation:", error);
      }
      throw error;
    }
  };

  // Provide chat context to children components
  return (
    <ChatContext.Provider
      value={{
        sessions,
        setSessions,
        currentSessionId,
        setCurrentSessionId,
        currentSessionTitle,
        setCurrentSessionTitle,
        currentMessages,
        setCurrentMessages,
        createNewSession,
        addUserMessage,
        updateLatestAssistantMessage,
        clearMessages,
        generateAssistantResponse,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// Custom hook to use chat context
export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
