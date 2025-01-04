"use client";

import { Button } from "@/components/ui/button";
import { useChat } from "@/lib/chat/chat-context";
import { Send, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
import {
  detailedWebsiteSummary,
  braveSearch,
  optimizeRawSearchQuery,
  webscrape,
  getStreamedFinalAnswer,
} from "./api/search/services";
import { AiResponseView } from "@/components/ui/chat/ai-response-view";
import { BraveSearchResponse, ScrapeStatus } from "./api/search/schemas";

export default function Home() {
  const { messages, addUserMessage, updateLatestAssistantMessage } = useChat();
  const [isGenerating, setIsGenerating] = useState(false);
  const [input, setInput] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 100;

    if (isNearBottom !== shouldAutoScroll) {
      setShouldAutoScroll(isNearBottom);
    }
  };

  useEffect(() => {
    if (shouldAutoScroll && scrollContainerRef.current) {
      const timeoutId = setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [messages, shouldAutoScroll]);

  const handleSubmit = async (query: string) => {
    cancelGeneration();

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setIsGenerating(true);
      if (signal.aborted) throw new Error("Generation cancelled");

      addUserMessage(query);
      if (signal.aborted) throw new Error("Generation cancelled");

      const optimizedQueryResponse = await optimizeRawSearchQuery(query);
      if (signal.aborted) throw new Error("Generation cancelled");

      if (!optimizedQueryResponse) {
        updateLatestAssistantMessage({
          isDoneGeneratingSearchQueries: true,
        });
        return;
      }

      const { queries: optimizedQueries } = optimizedQueryResponse;
      updateLatestAssistantMessage({
        isDoneGeneratingSearchQueries: true,
        searchQueries: optimizedQueries,
      });

      const allSearchResults: BraveSearchResponse = {
        web: { results: [] },
        videos: { results: [] },
      };

      // Modify the search results accumulation to handle cancellation
      for (const query of optimizedQueries) {
        if (signal.aborted) throw new Error("Generation cancelled");

        const singleChunkSearchResults = await braveSearch(query);

        // Add web results if URL doesn't already exist, up to 10 total
        for (const result of singleChunkSearchResults.web.results) {
          if (allSearchResults.web.results.length >= 5) break;
          if (!allSearchResults.web.results.some((r) => r.url === result.url)) {
            allSearchResults.web.results.push(result);
          }
        }

        // Add video results if URL doesn't already exist
        if (singleChunkSearchResults.videos) {
          for (const result of singleChunkSearchResults.videos.results) {
            if (allSearchResults.videos!.results.length >= 10) break;
            if (
              !allSearchResults.videos!.results.some(
                (r) => r.url === result.url
              )
            ) {
              allSearchResults.videos!.results.push(result);
            }
          }
        }

        updateLatestAssistantMessage({
          isDonePerformingSearch: true,
          searchResults: allSearchResults,
        });
      }

      if (signal.aborted) throw new Error("Generation cancelled");

      // Process results with cancellation checks
      const processedSearchResults: ScrapeStatus[] =
        allSearchResults.web.results.map((result, idx) => ({
          scrapeStatus: "not-started",
          source: {
            url: result.url,
            title: result.title,
            favicon: result.profile.img,
            sourceNumber: idx + 1,
          },
        }));

      // Modify the website processing to handle cancellation
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

          const summaryResponse = await detailedWebsiteSummary(
            input,
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

      // Generate final answer with cancellation support
      const finalAnswer = await getStreamedFinalAnswer({
        query: input,
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
    } catch (error) {
      if ((error as Error).message === "Generation cancelled") {
        console.log("Generation was cancelled");
        // updateLatestAssistantMessage({
        //   error: "Generation was cancelled by user",
        // });
      } else {
        console.error("Error during generation:", error);
        // updateLatestAssistantMessage({
        //   error: "An error occurred during generation",
        // });
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center p-4 text-foreground">
        <div className="flex flex-col gap-8 items-center w-full max-w-xl">
          <h1 className="text-3xl font-bold tracking-tighter">
            AI Product Lookup
          </h1>
          <div className="flex flex-row gap-2 border-2 border-border bg-card rounded-md w-full p-2">
            <TextareaAutosize
              className="w-full resize-none bg-transparent placeholder:text-muted-foreground focus:outline-none p-2"
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxRows={3}
              minRows={3}
            />
            <div className="flex flex-col gap-2 justify-end">
              <Button
                variant={
                  isGenerating || input.length === 0 ? "secondary" : "default"
                }
                size="icon"
                onClick={() => {
                  if (isGenerating) {
                    cancelGeneration();
                  } else {
                    setInput("");
                    handleSubmit(input);
                  }
                }}
              >
                {isGenerating ? <X /> : <Send />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background items-center">
      {/* Content */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex flex-col h-full bg-background px-4 pt-8 pb-0 w-full max-w-3xl overflow-y-auto gap-16"
      >
        {messages.map((message, idx) => (
          <div
            key={idx}
            className="flex flex-col w-full gap-8 h-auto min-h-fit"
          >
            <p className="w-full font-semibold tracking-tight text-4xl">
              {message.userMessage.content}
            </p>
            <AiResponseView assistantMessage={message.assistantMessage} />
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="w-full p-4 pb-8 flex flex-row items-center justify-center">
        <div className="flex flex-row gap-2 border-2 border-border bg-card rounded-md w-full max-w-3xl p-2">
          <TextareaAutosize
            className="w-full resize-none bg-transparent placeholder:text-muted-foreground focus:outline-none p-2"
            placeholder="Ask a follow-up question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxRows={2}
            minRows={1}
          />
          <div className="flex flex-col gap-2 justify-end">
            <Button
              variant={
                isGenerating || input.length === 0 ? "secondary" : "default"
              }
              size="icon"
              onClick={() => {
                if (isGenerating) {
                  cancelGeneration();
                } else {
                  setInput("");
                  handleSubmit(input);
                }
              }}
            >
              {isGenerating ? "×" : <Send />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
