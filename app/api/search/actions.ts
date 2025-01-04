"use server";

import { getCerebrasClient, getGroqClient, getOpenAIClient } from "@/lib/ai";
import { ChatCompletion } from "openai/resources/index.mjs";
import {
  FollowUpSearchQueriesResponse,
  SearchResponse,
  StreamedFinalAnswerRequest,
  ZFollowUpSearchQueriesResponse,
  ZSearchResponse,
} from "./schemas";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { NodeHtmlMarkdown } from "node-html-markdown";
import OpenAI from "openai";

export async function optimizeRawSearchQuery(
  query: string,
  numQueries: number = 3
): Promise<SearchResponse | null> {
  if (!process.env.CEREBRAS_API_KEY) {
    throw new Error("CEREBRAS_API_KEY is not set");
  }

  try {
    console.log("making cerebras search request");
    const cerebrasClient = getCerebrasClient();
    const response = await cerebrasClient.chat.completions.create({
      model: "llama-3.3-70b",
      messages: [
        {
          role: "system",
          content: `Given a user search query, return the most optimized Google or Bing search queries for this. Your response should be a JSON object with the following schema: {queries: string[]}. You should return ${numQueries} queries.`,
        },
        { role: "user", content: query },
      ],
      response_format: { type: "json_object" },
    });

    const searchResponse = JSON.parse(
      (response.choices as ChatCompletion.Choice[])[0].message.content!
    ) as SearchResponse;
    searchResponse.queries = searchResponse.queries.map((query) =>
      query.trim()
    );
    return searchResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Generation cancelled");
    }
    console.error(error);

    const openaiClient = getOpenAIClient();
    const response = await openaiClient.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: query }],
      response_format: zodResponseFormat(ZSearchResponse, "search_response"),
    });

    return response.choices[0].message.parsed;
  }
}

export async function webscrape(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      // Add timeout and redirect handling
      signal: AbortSignal.timeout(10000), // 10 second timeout
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const html = await response.text();

    const nhm = new NodeHtmlMarkdown({
      ignore: [
        "script",
        "style",
        "iframe",
        "noscript",
        "form",
        "button",
        "a",
        "input",
        "nav",
        "footer",
        "header",
        "aside",
        "svg",
        "img",
        "video",
        "audio",
        "canvas",
        "select",
        "textarea",
        "meta",
        "link",
        "advertisement",
      ],
      keepDataImages: false,
      maxConsecutiveNewlines: 2,
      bulletMarker: "*",
    });

    // Convert HTML to Markdown text
    const markdown = nhm.translate(html);

    return markdown;
  } catch (error) {
    console.error("Error fetching page:", error);
    return null;
  }
}

export async function detailedWebsiteSummary(
  query: string,
  markdown: string,
  chunkCharSize: number = 8000,
  maxChunks: number = 3,
  maxChunkTokens: number = 384,
  maxTotalTokens: number = 2048
): Promise<string | null> {
  try {
    // Split markdown into chunks
    const chunks =
      markdown.match(new RegExp(`.{1,${chunkCharSize}}`, "gs")) || [];
    const limitedChunks = chunks.slice(0, maxChunks);

    console.log("Reading ", limitedChunks.length, " chunks");

    // Common message template
    const systemMessage = (detailed = false) => ({
      role: "system" as const,
      content: `Summarize the following text as it relates to this query: "${query}". Focus only on relevant information and be detailed. ${
        !detailed
          ? 'If none of the information in the text is relevant to the query, return "no relevant information found". '
          : ""
      }Your response should be in Markdown format.`,
    });

    // Process chunks in parallel with error handling
    const chunkSummaries = await Promise.all(
      limitedChunks.map(async (chunk, idx) => {
        try {
          const client = getCerebrasClient();
          const model = "llama-3.3-70b";

          const response = await (
            client as unknown as OpenAI
          ).chat.completions.create({
            model,
            messages: [systemMessage(), { role: "user", content: chunk }],
            max_tokens: maxChunkTokens,
          });

          return response.choices[0].message.content || "";
        } catch (error) {
          console.warn(`Chunk ${idx} failed, falling back to OpenAI:`, error);
          const openaiClient = getOpenAIClient();
          const response = await openaiClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [systemMessage(), { role: "user", content: chunk }],
            max_tokens: maxChunkTokens,
          });
          return response.choices[0].message.content || "";
        }
      })
    );

    // Final summary with error handling
    try {
      const combinedSummaries = chunkSummaries.join("\n\n");
      const cerebrasClient = getCerebrasClient();
      const finalResponse = await cerebrasClient.chat.completions.create({
        model: "llama-3.3-70b",
        messages: [
          {
            role: "system",
            content: `You are writing a detailed response to the query: "${query}". Analyze the provided text segments, synthesize key information, and present a comprehensive response. Include specific details and examples. Write clearly for a general audience. Use Markdown format.`,
          },
          { role: "user", content: combinedSummaries },
        ],
        max_tokens: maxTotalTokens,
      });

      return (
        (finalResponse.choices as ChatCompletion.Choice[])[0].message.content ||
        null
      );
    } catch (error) {
      console.warn("Final summary failed, falling back to OpenAI:", error);
      const openaiClient = getOpenAIClient();

      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are writing a detailed response to the query: "${query}". Analyze the provided text segments, synthesize key information, and present a comprehensive response. Include specific details and examples. Write clearly for a general audience. Use Markdown format.`,
          },
          { role: "user", content: chunkSummaries.join("\n\n") },
        ],
        max_tokens: maxTotalTokens,
        stream: true,
      });

      let content = "";
      for await (const chunk of response) {
        content += chunk.choices[0].delta.content || "";
      }

      return content || null;
    }
  } catch (error) {
    console.error("Error in detailedWebsiteSummary:", error);
    return null;
  }
}

export async function* getStreamedFinalAnswer(
  streamedFinalAnswerRequest: StreamedFinalAnswerRequest
) {
  const { query, sources } = streamedFinalAnswerRequest;

  const sourceContext = sources
    .map(
      (source) =>
        `Source ${source.sourceNumber} (${source.url}): ${source.title}\n${source.summary}`
    )
    .join("\n\n");

  const openaiClient = getOpenAIClient();
  const stream = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant that provides detailed answers formatted in markdown. 
Use numerical references throughout the response in the format [number](url), where 'number' corresponds to the source number and 'url' is the source's URL. These references should appear at the end of every line that uses information from a source.

Structure your response with headings, subheadings, lists, and tables when appropriate to make the content scannable. Ensure every key claim, fact, or piece of information is cited. Do not include a separate references section. 
If you do not know the answer, respond with "I don't know" and explain why you cannot provide an answer.`,
      },
      {
        role: "user",
        content: `Question: ${query}\n\nSources:\n${sourceContext}`,
      },
    ],
    stream: true,
  });

  try {
    for await (const chunk of stream) {
      yield chunk.choices[0].delta.content;
    }
  } catch (error) {
    console.error("Stream error:", error);
    throw error;
  }

  // return stream.choices[0].message.content;
}

export async function generateFollowUpSearchQueries(
  enhancedQueries: string[],
  previousModelResponse: string,
  numQueries: number = 5
): Promise<FollowUpSearchQueriesResponse | null> {
  try {
    const groqClient = getGroqClient();
    const response = await groqClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that generates follow-up search queries based on a list of enhanced queries and a previous model response. Your response should be a JSON object with the following schema: {queries: string[]}. You should return ${numQueries} queries.`,
        },
        {
          role: "user",
          content: `Enhanced Queries:\n${enhancedQueries.join(
            "\n"
          )}\n\nPrevious Model Response:\n${previousModelResponse}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const followUpSearchQueriesResponse = JSON.parse(
      response.choices[0].message.content as string
    ) as FollowUpSearchQueriesResponse;
    return followUpSearchQueriesResponse;
  } catch (error) {
    console.error("Error in generateFollowUpSearchQueries:", error);

    const openaiClient = getOpenAIClient();
    const response = await openaiClient.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that generates follow-up search queries based on a list of enhanced queries and a previous model response. Your response should be a JSON object with the following schema: {queries: string[]}. You should return ${numQueries} queries.`,
        },
        {
          role: "user",
          content: `Enhanced Queries:\n${enhancedQueries.join(
            "\n"
          )}\n\nPrevious Model Response:\n${previousModelResponse}`,
        },
      ],
      response_format: zodResponseFormat(
        ZFollowUpSearchQueriesResponse,
        "follow_up_search_queries_response"
      ),
    });

    return response.choices[0].message.parsed;
  }
}
