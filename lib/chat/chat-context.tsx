"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import {
  AiImageSearchResponse,
  AiWebSearchResponse,
  UserMessage,
} from "./schemas";
import { AssistantMessage } from "./schemas";
import {
  detailedWebsiteSummary,
  optimizeRawSearchQuery,
  webscrape,
  getStreamedFinalAnswer,
  generateFollowUpSearchQueries,
} from "@/app/api/search/actions";
import { WebScrapeStatus } from "@/app/api/search/schemas";
import { BraveWebSearchResponse } from "@/app/api/brave/schemas";
import { braveWebSearch } from "@/app/api/brave/actions";
import { optimizeRawImageSearchQuery } from "@/app/api/image/actions";
import { decision } from "@/app/api/utils/actions";

type Message = {
  userMessage: UserMessage;
  assistantMessage: AssistantMessage;
};

interface ChatContextType {
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  addUserMessage: (content: string) => void;
  updateLatestAssistantMessage: (newAssistantMessage: AssistantMessage) => void;
  clearMessages: () => void;
  generateAssistantResponse: (
    query: string,
    signal: AbortSignal
  ) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      userMessage: { content: "What is the best way to learn React?" },
      assistantMessage: {
        searchQueries: [
          "React tutorials",
          "React best practices",
          "Learn React for beginners",
        ],
        isDoneGeneratingSearchQueries: true,
        isDonePerformingSearch: true,
        searchResults: {
          web: {
            results: [
              {
                url: "https://react.dev/learn",
                title: "Quick Start – React Documentation",
                description:
                  "Official React documentation providing step-by-step guidance for beginners to learn React fundamentals.",
                profile: {
                  name: "React",
                  img: "https://static.cdnlogo.com/logos/g/35/google-icon.svg",
                },
              },
              {
                url: "https://roadmap.sh/react",
                title: "React Developer Roadmap",
                description:
                  "A comprehensive roadmap for learning React, including prerequisites and advanced concepts.",
                profile: {
                  name: "React",
                  img: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1024px-React-icon.svg.png",
                },
              },
            ],
          },
        },
        isDoneProcessingSearchResults: true,
        processedSearchResults: [
          {
            scrapeStatus: "success",
            source: {
              url: "https://react.dev/learn",
              title: "Quick Start - React Documentation",
              summary:
                "Official React documentation providing step-by-step guidance for beginners to learn React fundamentals.",
              favicon: "https://static.cdnlogo.com/logos/g/35/google-icon.svg",
              sourceNumber: 1,
            },
          },
          {
            scrapeStatus: "error",
            source: {
              url: "https://roadmap.sh/react",
              title: "React Developer Roadmap",
              favicon:
                "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1024px-React-icon.svg.png",
              sourceNumber: 2,
            },
            error: "Error while reading: Testing error.",
          },
          {
            scrapeStatus: "in-progress",
            source: {
              url: "https://beta.reactjs.org/learn",
              title: "Learn React - Beta Documentation",
              favicon: "https://beta.reactjs.org/favicon.ico",
              sourceNumber: 3,
            },
          },
          {
            scrapeStatus: "not-started",
            source: {
              url: "https://react-tutorial.app",
              title: "Interactive React Tutorial",
              favicon:
                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoRUg0l7PMuv1byhqZ90_i41rtCfjKYpjFeA&s",
              sourceNumber: 4,
            },
          },
        ],
        isDoneGeneratingFinalAnswer: true,
        finalAnswer:
          "Here's an example of inline math: \\(f(x) = \\frac{1}{\\sqrt{2\\pi}} e^{-\\frac{x^2}{2}}\\). Here's an example of non-inline math: \\[\\int_{-\\infty}^{ \\infty} f(x) dx = 1\\]\n\nHere's more math: \\[\nf(x) = x^2\n\\]",
        followUpSearchQueries: [
          "React tutorials",
          "React best practices",
          "React tutorials",
        ],
      },
    },
  ]);

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      userMessage: { content },
      assistantMessage: {
        isDoneGeneratingSearchQueries: false,
      },
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const updateLatestAssistantMessage = (
    newAssistantMessage: AssistantMessage
  ) => {
    setMessages((prev) => {
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
    setMessages([]);
  };

  const aiWebSearch = async (
    query: string,
    signal: AbortSignal
  ): Promise<AiWebSearchResponse> => {
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
        if (allSearchResults.web.results.length >= 5) break;
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

    for (const [idx, result] of allSearchResults.web.results.entries()) {
      if (signal.aborted) throw new Error("Generation cancelled");

      try {
        processedSearchResults[idx].scrapeStatus = "in-progress";
        updateLatestAssistantMessage({
          processedSearchResults,
          isDoneProcessingSearchResults: true,
        });

        const scrapeResponse = await webscrape(result.url);
        if (signal.aborted) throw new Error("Generation cancelled");
        if (!scrapeResponse) {
          throw new Error("Failed to scrape website");
        }

        const summaryResponse = await detailedWebsiteSummary(
          query,
          scrapeResponse
        );
        if (signal.aborted) throw new Error("Generation cancelled");

        if (!summaryResponse) {
          throw new Error("Failed to summarize website");
        }

        processedSearchResults[idx].scrapeStatus = "success";
        processedSearchResults[idx].source.summary = summaryResponse;
        updateLatestAssistantMessage({
          processedSearchResults,
          isDoneProcessingSearchResults: true,
        });
      } catch (error) {
        if ((error as Error).message === "Generation cancelled") throw error;

        console.error(`Error processing ${result.url}:`, error);
        processedSearchResults[idx].scrapeStatus = "error";
        processedSearchResults[idx].error = (error as Error).message;
        updateLatestAssistantMessage({
          processedSearchResults,
          isDoneProcessingSearchResults: true,
        });
      }
    }

    if (signal.aborted) throw new Error("Generation cancelled");

    return {
      optimizedQueries,
      processedSearchResults,
    };
  };

  const aiImageSearch = async (
    query: string,
    signal: AbortSignal
  ): Promise<AiImageSearchResponse> => {
    if (
      !(await decision(
        query,
        "Would searching for images be helpful in response to the given query? You have to be absolutely sure that it would be helpful."
      ))
    ) {
      return {
        optimizedQueries: [],
        imageSearchResults: [],
      };
    }

    const optimizedQueryResponse = await optimizeRawImageSearchQuery(query);
    if (signal.aborted) throw new Error("Generation cancelled");

    if (!optimizedQueryResponse) {
      updateLatestAssistantMessage({
        isDoneGeneratingSearchQueries: true,
      });
      return {
        optimizedQueries: [],
        imageSearchResults: [],
      };
    }

    const { queries: optimizedQueries } = optimizedQueryResponse;
    return {
      optimizedQueries,
      imageSearchResults: [],
    };
  };

  const generateAssistantResponse = async (
    query: string,
    signal: AbortSignal
  ): Promise<void> => {
    try {
      addUserMessage(query);
      if (signal.aborted) throw new Error("Generation cancelled");

      const { optimizedQueries, processedSearchResults } = await aiWebSearch(
        query,
        signal
      );

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

      console.log("\\(", finalAnswerString.includes("\\("));
      console.log("\\)", finalAnswerString.includes("\\)"));
      console.log("\\[", finalAnswerString.includes("\\["));
      console.log("\\]", finalAnswerString.includes("\\]"));

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
      if ((error as Error).message === "Generation cancelled") {
        console.log("Generation was cancelled");
      } else {
        console.error("Error during generation:", error);
      }
      throw error;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
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

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
