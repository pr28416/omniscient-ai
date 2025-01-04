"use client";

import { AssistantMessage } from "@/lib/chat/schemas";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../accordion";
import Image from "next/image";
import { useEffect } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../hover-card";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function AiResponseView({
  assistantMessage,
}: {
  assistantMessage: AssistantMessage;
}) {
  useEffect(() => {
    console.log("received updated assistant message", assistantMessage);
  }, [assistantMessage]);

  return (
    <div className="flex flex-col gap-8">
      {/* Search status cards */}
      <Accordion
        type="multiple"
        className="flex flex-col rounded-md border border-b-0 overflow-clip"
        defaultValue={["search-status", "search-results", "processed-results"]}
      >
        <AccordionItem value="search-status">
          <AccordionTrigger className="text-sm font-medium px-3 py-2 bg-card border-b">
            {assistantMessage.isDoneGeneratingSearchQueries
              ? "Enhanced search queries"
              : "Enhancing search query..."}
          </AccordionTrigger>
          {assistantMessage.isDoneGeneratingSearchQueries ? (
            <AccordionContent className="pb-0 divide-y divide-border">
              {assistantMessage.searchQueries?.map((query, idx) => (
                <p
                  key={idx}
                  className="text-sm text-muted-foreground px-3 py-2 bg-card/50"
                >
                  {query}
                </p>
              ))}
            </AccordionContent>
          ) : (
            <AccordionContent className="pb-0 divide-y divide-border">
              <p className="text-sm text-muted-foreground px-3 py-2 bg-card/50">
                Working on it...
              </p>
            </AccordionContent>
          )}
        </AccordionItem>

        {assistantMessage.isDoneGeneratingSearchQueries && (
          <AccordionItem value="search-results">
            <AccordionTrigger className="text-sm font-medium px-3 py-2 bg-card border-b">
              {assistantMessage.isDonePerformingSearch
                ? "Search results"
                : "Searching..."}
            </AccordionTrigger>
            {assistantMessage.isDonePerformingSearch ? (
              <AccordionContent className="pb-0 p-3 bg-card/50">
                <div className="flex flex-row flex-wrap gap-3">
                  {assistantMessage.searchResults?.web?.results?.map(
                    (page, idx) => (
                      <a
                        key={idx}
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-row items-center gap-2 p-1 rounded border hover:bg-accent transition-colors max-w-48"
                      >
                        <Image
                          src={page.profile.img}
                          alt={`${new URL(page.url).hostname} favicon`}
                          width={16}
                          height={16}
                          className="flex-shrink-0 rounded"
                          unoptimized
                          onError={(e) => {
                            e.currentTarget.src = "/favicon.ico";
                          }}
                        />
                        <span className="text-xs font-medium line-clamp-1 text-ellipsis">
                          {page.title}
                        </span>
                      </a>
                    )
                  )}
                </div>
              </AccordionContent>
            ) : (
              <AccordionContent className="pb-0 divide-y divide-border">
                <p className="text-sm text-muted-foreground px-3 py-2 bg-card/50">
                  Working on it...
                </p>
              </AccordionContent>
            )}
          </AccordionItem>
        )}

        {assistantMessage.isDonePerformingSearch && (
          <AccordionItem value="processed-results">
            <AccordionTrigger className="text-sm font-medium px-3 py-2 bg-card border-b">
              {assistantMessage.isDoneProcessingSearchResults
                ? "Read results"
                : "Reading results..."}
            </AccordionTrigger>
            {assistantMessage.isDoneProcessingSearchResults ? (
              <AccordionContent className="pb-0 divide-y divide-border">
                {/* Not Started Group */}
                {assistantMessage.processedSearchResults?.some(
                  (result) => result.scrapeStatus === "not-started"
                ) && (
                  <div className="px-3 py-2 bg-card/50 flex flex-col gap-2">
                    <h4 className="text-sm text-muted-foreground">
                      Not Started
                    </h4>
                    <div className="flex flex-row flex-wrap gap-3">
                      {assistantMessage.processedSearchResults
                        ?.filter(
                          (result) => result.scrapeStatus === "not-started"
                        )
                        .map((result, idx) => (
                          <a
                            key={idx}
                            href={result.source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-row items-center gap-2 p-1 rounded border hover:bg-accent transition-colors max-w-48"
                          >
                            <Image
                              src={result.source.favicon}
                              alt={`${
                                new URL(result.source.url).hostname
                              } favicon`}
                              width={16}
                              height={16}
                              className="flex-shrink-0 rounded"
                              unoptimized
                              onError={(e) => {
                                e.currentTarget.src = "/favicon.ico";
                              }}
                            />
                            <span className="text-xs font-medium line-clamp-1 text-ellipsis">
                              {result.source.title}
                            </span>
                          </a>
                        ))}
                    </div>
                  </div>
                )}

                {/* In Progress Group */}
                {assistantMessage.processedSearchResults?.some(
                  (result) => result.scrapeStatus === "in-progress"
                ) && (
                  <div className="px-3 py-2 bg-card/50 flex flex-col gap-2">
                    <h4 className="text-sm text-muted-foreground">
                      Currently reading
                    </h4>
                    <div className="flex flex-row flex-wrap gap-3">
                      {assistantMessage.processedSearchResults
                        ?.filter(
                          (result) => result.scrapeStatus === "in-progress"
                        )
                        .map((result, idx) => (
                          <a
                            key={idx}
                            href={result.source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-row items-center gap-2 p-1 rounded border hover:bg-accent transition-colors max-w-48"
                          >
                            <Image
                              src={result.source.favicon}
                              alt={`${
                                new URL(result.source.url).hostname
                              } favicon`}
                              width={16}
                              height={16}
                              className="flex-shrink-0 rounded"
                              unoptimized
                              onError={(e) => {
                                e.currentTarget.src = "/favicon.ico";
                              }}
                            />
                            <span className="text-xs font-medium line-clamp-1 text-ellipsis">
                              {result.source.title}
                            </span>
                          </a>
                        ))}
                    </div>
                  </div>
                )}

                {/* Success Group */}
                {assistantMessage.processedSearchResults?.some(
                  (result) => result.scrapeStatus === "success"
                ) && (
                  <div className="px-3 py-2 bg-card/50 flex flex-col gap-2">
                    <h4 className="text-sm text-muted-foreground">
                      Finished reading
                    </h4>
                    <div className="flex flex-row flex-wrap gap-3">
                      {assistantMessage.processedSearchResults
                        ?.filter((result) => result.scrapeStatus === "success")
                        .map((result, idx) => (
                          <HoverCard key={idx} openDelay={200}>
                            <HoverCardTrigger asChild>
                              <a
                                href={result.source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-row items-center gap-2 p-1 rounded border hover:bg-accent transition-colors max-w-48"
                              >
                                <Image
                                  src={result.source.favicon}
                                  alt={`${
                                    new URL(result.source.url).hostname
                                  } favicon`}
                                  width={16}
                                  height={16}
                                  className="flex-shrink-0 rounded"
                                  unoptimized
                                  onError={(e) => {
                                    e.currentTarget.src = "/favicon.ico";
                                  }}
                                />
                                <span className="text-xs font-medium line-clamp-1 text-ellipsis">
                                  {result.source.title}
                                </span>
                              </a>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-96 max-h-96 overflow-y-auto">
                              <Markdown
                                className="text-sm prose prose-sm  dark:prose-invert"
                                remarkPlugins={[remarkGfm]}
                              >
                                {result.source.summary ||
                                  "No summary available"}
                              </Markdown>
                            </HoverCardContent>
                          </HoverCard>
                        ))}
                    </div>
                  </div>
                )}

                {/* Error Group */}
                {assistantMessage.processedSearchResults?.some(
                  (result) => result.scrapeStatus === "error"
                ) && (
                  <div className="px-3 py-2 bg-card/50 flex flex-col gap-2">
                    <h4 className="text-sm text-muted-foreground">
                      Failed to read
                    </h4>
                    <div className="flex flex-row flex-wrap gap-3">
                      {assistantMessage.processedSearchResults
                        ?.filter((result) => result.scrapeStatus === "error")
                        .map((result, idx) => (
                          <HoverCard key={idx} openDelay={200}>
                            <HoverCardTrigger asChild>
                              <a
                                href={result.source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-row items-center gap-2 p-1 rounded bg-destructive/30 border border-destructive/40 hover:bg-destructive/20 transition-colors max-w-48"
                              >
                                <Image
                                  src={result.source.favicon}
                                  alt={`${
                                    new URL(result.source.url).hostname
                                  } favicon`}
                                  width={16}
                                  height={16}
                                  className="flex-shrink-0 rounded"
                                  unoptimized
                                  onError={(e) => {
                                    e.currentTarget.src = "/favicon.ico";
                                  }}
                                />
                                <span className="text-xs font-medium line-clamp-1 text-ellipsis">
                                  {result.source.title}
                                </span>
                              </a>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80 bg-destructive">
                              <p className="text-sm">
                                {result.error || "Unknown error occurred"}
                              </p>
                            </HoverCardContent>
                          </HoverCard>
                        ))}
                    </div>
                  </div>
                )}
              </AccordionContent>
            ) : (
              <AccordionContent className="pb-0 divide-y divide-border">
                <p className="text-sm text-muted-foreground px-3 py-2 bg-card/50">
                  Working on it...
                </p>
              </AccordionContent>
            )}
          </AccordionItem>
        )}
      </Accordion>

      {/* Final Answer */}
      <div className="prose dark:prose-invert max-w-none [&>*]:my-5 [&_p]:leading-relaxed [&_p:not(:last-child)]:mb-2 [&_a]:inline-flex [&_a]:items-center [&_a]:gap-2 [&_a]:rounded [&_a]:bg-secondary [&_a]:px-1 [&_a]:py-0.5 [&_a]:border [&_a]:border-border [&_a]:text-sm [&_a]:text-primary [&_a]:font-bold [&_a]:no-underline [&_a]:transition-colors hover:[&_a]:bg-card/80">
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => {
              const result = assistantMessage.processedSearchResults?.find(
                (result) => result.source.url === href
              );

              return (
                <span className="inline-block">
                  <HoverCard openDelay={200}>
                    <HoverCardTrigger asChild>
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        <span>{children}</span>
                      </a>
                    </HoverCardTrigger>
                    <HoverCardContent
                      className="max-w-80 cursor-pointer"
                      onClick={() =>
                        window.open(href, "_blank", "noopener,noreferrer")
                      }
                    >
                      <div className="flex flex-row items-center gap-3 h-6">
                        <Image
                          src={result?.source.favicon || "/favicon.ico"}
                          alt="Site favicon"
                          width={16}
                          height={16}
                          className="flex-shrink-0 rounded"
                          unoptimized
                          onError={(e) => {
                            e.currentTarget.src = "/favicon.ico";
                          }}
                        />
                        <span className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">
                            {result?.source.title || String(children)}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            {href}
                          </span>
                        </span>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </span>
              );
            },
            p: ({ children }) => (
              <div className="my-4 leading-relaxed">{children}</div>
            ),
          }}
        >
          {assistantMessage.finalAnswer || "Generating answer..."}
        </Markdown>
      </div>
    </div>
  );
}
