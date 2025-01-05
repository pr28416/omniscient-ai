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
import {
  BraveImageSearchResponse,
  BraveWebSearchResponse,
} from "@/app/api/brave/schemas";
import { braveImageSearch, braveWebSearch } from "@/app/api/brave/actions";
import {
  describeImage,
  optimizeRawImageSearchQuery,
} from "@/app/api/image/actions";
import { decision } from "@/app/api/utils/actions";
import { ImageScrapeStatus } from "@/app/api/image/schemas";

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
    // {
    //   userMessage: { content: "What is the best way to learn React?" },
    //   assistantMessage: {
    //     searchQueries: [
    //       "React tutorials",
    //       "React best practices",
    //       "Learn React for beginners",
    //     ],
    //     isDoneGeneratingSearchQueries: true,
    //     isDonePerformingSearch: true,
    //     searchResults: {
    //       web: {
    //         results: [
    //           {
    //             url: "https://react.dev/learn",
    //             title: "Quick Start – React Documentation",
    //             description:
    //               "Official React documentation providing step-by-step guidance for beginners to learn React fundamentals.",
    //             profile: {
    //               name: "React",
    //               img: "https://static.cdnlogo.com/logos/g/35/google-icon.svg",
    //             },
    //           },
    //           {
    //             url: "https://roadmap.sh/react",
    //             title: "React Developer Roadmap",
    //             description:
    //               "A comprehensive roadmap for learning React, including prerequisites and advanced concepts.",
    //             profile: {
    //               name: "React",
    //               img: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1024px-React-icon.svg.png",
    //             },
    //           },
    //         ],
    //       },
    //     },
    //     isDoneProcessingSearchResults: true,
    //     processedSearchResults: [
    //       {
    //         scrapeStatus: "success",
    //         source: {
    //           url: "https://react.dev/learn",
    //           title: "Quick Start - React Documentation",
    //           summary:
    //             "Official React documentation providing step-by-step guidance for beginners to learn React fundamentals.",
    //           favicon: "https://static.cdnlogo.com/logos/g/35/google-icon.svg",
    //           sourceNumber: 1,
    //         },
    //       },
    //       {
    //         scrapeStatus: "error",
    //         source: {
    //           url: "https://roadmap.sh/react",
    //           title: "React Developer Roadmap",
    //           favicon:
    //             "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1024px-React-icon.svg.png",
    //           sourceNumber: 2,
    //         },
    //         error: "Error while reading: Testing error.",
    //       },
    //       {
    //         scrapeStatus: "in-progress",
    //         source: {
    //           url: "https://beta.reactjs.org/learn",
    //           title: "Learn React - Beta Documentation",
    //           favicon: "https://beta.reactjs.org/favicon.ico",
    //           sourceNumber: 3,
    //         },
    //       },
    //       {
    //         scrapeStatus: "not-started",
    //         source: {
    //           url: "https://react-tutorial.app",
    //           title: "Interactive React Tutorial",
    //           favicon:
    //             "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQoRUg0l7PMuv1byhqZ90_i41rtCfjKYpjFeA&s",
    //           sourceNumber: 4,
    //         },
    //       },
    //     ],
    //     isDoneGeneratingFinalAnswer: true,
    //     finalAnswer:
    //       "Here's an example of inline math: \\(f(x) = \\frac{1}{\\sqrt{2\\pi}} e^{-\\frac{x^2}{2}}\\). Here's an example of non-inline math: \\[\\int_{-\\infty}^{ \\infty} f(x) dx = 1\\]\n\nHere's more math: \\[\nf(x) = x^2\n\\]",
    //     followUpSearchQueries: [
    //       "React tutorials",
    //       "React best practices",
    //       "React tutorials",
    //     ],
    //     processedImageSearchResults: [
    //       {
    //         scrapeStatus: "not-started",
    //         source: {
    //           sourceNumber: 1,
    //           title: "Example 1",
    //           imgUrl:
    //             "https://d2u1z1lopyfwlx.cloudfront.net/thumbnails/3fc9f0ad-4ab4-531f-a148-529b9a87cf70/e91e73d4-022b-59db-9713-717a2a198855.jpg",
    //           thumbnailUrl:
    //             "https://d2u1z1lopyfwlx.cloudfront.net/thumbnails/3fc9f0ad-4ab4-531f-a148-529b9a87cf70/e91e73d4-022b-59db-9713-717a2a198855.jpg",
    //           webUrl: "https://react.dev",
    //           summary:
    //             "(Summary 1) Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    //         },
    //       },
    //       {
    //         scrapeStatus: "in-progress",
    //         source: {
    //           sourceNumber: 2,
    //           title: "Example 2",
    //           imgUrl:
    //             "https://images.photowall.com/products/42556/summer-landscape-with-river.jpg?h=699&q=85",
    //           thumbnailUrl:
    //             "https://images.photowall.com/products/42556/summer-landscape-with-river.jpg?h=699&q=85",
    //           webUrl: "https://instagram.com",
    //           summary:
    //             "(Summary 2) Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    //         },
    //       },
    //       {
    //         scrapeStatus: "success",
    //         source: {
    //           sourceNumber: 3,
    //           title: "Example 3",
    //           imgUrl:
    //             "https://imageio.forbes.com/blogs-images/tomcoughlin/files/2016/07/Electronic-Functions-in-Cars-1200x758.png?format=png&height=900&width=1600&fit=bounds",
    //           thumbnailUrl:
    //             "https://imageio.forbes.com/blogs-images/tomcoughlin/files/2016/07/Electronic-Functions-in-Cars-1200x758.png?format=png&height=900&width=1600&fit=bounds",
    //           webUrl: "https://reddit.com",
    //           summary:
    //             "(Summary 3) Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    //         },
    //       },
    //       {
    //         scrapeStatus: "error",
    //         source: {
    //           sourceNumber: 4,
    //           title: "Example 4",
    //           imgUrl:
    //             "https://media.istockphoto.com/id/485371557/photo/twilight-at-spirit-island.jpg?s=612x612&w=0&k=20&c=FSGliJ4EKFP70Yjpzso0HfRR4WwflC6GKfl4F3Hj7fk=",
    //           thumbnailUrl:
    //             "https://media.istockphoto.com/id/485371557/photo/twilight-at-spirit-island.jpg?s=612x612&w=0&k=20&c=FSGliJ4EKFP70Yjpzso0HfRR4WwflC6GKfl4F3Hj7fk=",
    //           webUrl: "https://apple.com",
    //           summary:
    //             "(Summary 4) Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    //         },
    //       },
    //       {
    //         scrapeStatus: "success",
    //         source: {
    //           sourceNumber: 5,
    //           title: "Example 5",
    //           imgUrl:
    //             "https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?cs=srgb&dl=pexels-bri-schneiter-28802-346529.jpg&fm=jpg",
    //           thumbnailUrl:
    //             "https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg?cs=srgb&dl=pexels-bri-schneiter-28802-346529.jpg&fm=jpg",
    //           webUrl: "https://google.com",
    //           summary:
    //             "(Summary 5) Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    //         },
    //       },
    //     ],
    //   },
    // },
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

    const processPromises = allSearchResults.web.results.map(
      async (result, idx) => {
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
        } catch (error) {
          if ((error as Error).message === "Generation cancelled") throw error;

          console.error(`Error processing ${result.url}:`, error);
          processedSearchResults[idx].scrapeStatus = "error";
          processedSearchResults[idx].error = (error as Error).message;
        }

        updateLatestAssistantMessage({
          processedSearchResults,
          isDoneProcessingSearchResults: true,
        });
      }
    );

    await Promise.allSettled(processPromises);

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
        "Would searching for images be helpful in response to the given query?"
      ))
    ) {
      console.log("Image search not needed");
      return {
        optimizedQueries: [],
        processedImageSearchResults: [],
      };
    } else {
      console.log("Image search needed");
    }

    const optimizedQueryResponse = await optimizeRawImageSearchQuery(query);
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
        // try {
        //   const image = await fetch(result.properties.url, { mode: "no-cors" });
        //   if (!image) {
        //     throw new Error("Failed to fetch image");
        //   }
        // } catch (error) {
        //   console.error(`Error fetching ${result.properties.url}:`, error);
        //   continue;
        // }

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

    console.log("Images should be processed now");

    const processPromises = processedImageSearchResults.map(
      async (result, idx) => {
        if (signal.aborted) throw new Error("Generation cancelled");

        console.log("Processing image ", idx);

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

          const imageDescription = await describeImage(
            result.source.title,
            result.source.imgUrl
          );

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

        console.log("Update happened for index ", idx);

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

  const generateAssistantResponse = async (
    query: string,
    signal: AbortSignal
  ): Promise<void> => {
    try {
      addUserMessage(query);
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
