"use server";

// Import required dependencies
import axios from "axios";
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

/**
 * Optimizes a raw search query into multiple refined search queries
 * Primary: Uses Cerebras API with llama-3.1-8b
 * Fallback: OpenAI with gpt-4o-mini
 * @param query The raw search query to optimize
 * @param numQueries Number of optimized queries to generate (default: 3)
 * @returns SearchResponse containing array of optimized queries, or null if failed
 */
export async function optimizeRawSearchQuery(
  query: string,
  numQueries: number = 3
): Promise<SearchResponse | null> {
  // Verify API key exists in environment variables
  if (!process.env.CEREBRAS_API_KEY) {
    throw new Error("CEREBRAS_API_KEY is not set");
  }

  try {
    // Make primary API request to Cerebras
    const cerebrasClient = getCerebrasClient();
    const response = await cerebrasClient.chat.completions.create({
      model: "llama-3.1-8b",
      messages: [
        {
          role: "system",
          content: `Given a user search query, return the most optimized Google or Bing search queries for this. Your response should be a JSON object with the following schema: {queries: string[]}. You should return ${numQueries} queries.`,
        },
        { role: "user", content: query },
      ],
      response_format: { type: "json_object" },
    });

    // Parse and clean up response
    const searchResponse = JSON.parse(
      (response.choices as ChatCompletion.Choice[])[0].message.content!
    ) as SearchResponse;
    searchResponse.queries = searchResponse.queries.map((query) =>
      query.trim()
    );
    return searchResponse;
  } catch (error) {
    // Handle generation cancellation
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Generation cancelled");
    }
    console.error(error);

    // Fallback to OpenAI if Cerebras fails
    const openaiClient = getOpenAIClient();
    const response = await openaiClient.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: query }],
      response_format: zodResponseFormat(ZSearchResponse, "search_response"),
    });

    return response.choices[0].message.parsed;
  }
}

/**
 * Scrapes and converts webpage content to markdown
 * - Sets reasonable timeouts and headers
 * - Handles content validation
 * - Converts HTML to clean markdown format
 * @param url URL of webpage to scrape
 * @returns Markdown string of webpage content, or null if failed
 */
export async function webscrape(url: string): Promise<string | null> {
  try {
    // Make HTTP request with appropriate settings
    const response = await axios.get(url, {
      timeout: 5000, // Reduced timeout to 5 seconds
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "*/*",
      },
      maxRedirects: 3,
      decompress: true, // Handle gzipped responses automatically
      validateStatus: (status) => status < 400, // Only accept successful responses
    });

    // Quick validation of content type
    const contentType = response.headers["content-type"] || "";
    if (!contentType.includes("html")) {
      return null;
    }

    // Configure HTML to Markdown converter
    const nhm = new NodeHtmlMarkdown({
      // Simplified ignore list for faster processing
      ignore: [
        "script",
        "style",
        "iframe",
        "noscript",
        "svg",
        "img",
        "video",
        "audio",
      ],
      keepDataImages: false,
      maxConsecutiveNewlines: 1,
      bulletMarker: "*",
    });

    // Convert HTML to Markdown
    const markdown = nhm.translate(response.data);
    return markdown;
  } catch (error) {
    console.error("Error fetching page:", error);
    return null;
  }
}

/**
 * Generates detailed summaries from markdown content
 * - Chunks content for processing
 * - Primary: Uses Cerebras API with llama-3.3-70b/3.1-70b
 * - Fallback: OpenAI with gpt-4o-mini
 * - Processes chunks in parallel
 * - Creates final synthesized summary
 * @param query Search query to focus summary on
 * @param markdown Markdown content to summarize
 * @param chunkCharSize Size of each content chunk (default: 8000)
 * @param maxChunks Maximum number of chunks to process (default: 3)
 * @param maxChunkTokens Maximum tokens per chunk summary (default: 384)
 * @param maxTotalTokens Maximum tokens for final summary (default: 2048)
 * @returns Detailed summary string, or null if failed
 */
export async function detailedWebsiteSummary(
  query: string,
  markdown: string,
  chunkCharSize: number = 8000,
  maxChunks: number = 3,
  maxChunkTokens: number = 384,
  maxTotalTokens: number = 2048
): Promise<string | null> {
  try {
    // Split markdown into manageable chunks
    const chunks =
      markdown.match(new RegExp(`.{1,${chunkCharSize}}`, "gs")) || [];
    const limitedChunks = chunks.slice(0, maxChunks);

    // Define system message template
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
          // Try Cerebras first
          const client = getCerebrasClient();
          const model = Math.random() < 0.5 ? "llama-3.3-70b" : "llama-3.1-70b";

          const response = await (
            client as unknown as OpenAI
          ).chat.completions.create({
            model,
            messages: [systemMessage(), { role: "user", content: chunk }],
            max_tokens: maxChunkTokens,
          });

          return response.choices[0].message.content || "";
        } catch (error) {
          // Fallback to OpenAI for chunk processing
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

    // Generate final summary with error handling
    try {
      // Try Cerebras for final summary
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
      // Fallback to OpenAI for final summary
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

      // Collect streamed response
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

/**
 * Streams a final answer based on provided sources
 * - Handles both text and image sources
 * - Uses OpenAI's gpt-4o-mini
 * - Implements strict citation and formatting guidelines
 * - Returns streamed response for real-time updates
 * @param streamedFinalAnswerRequest Request containing query and sources
 * @yields Chunks of the generated response
 */
export async function* getStreamedFinalAnswer(
  streamedFinalAnswerRequest: StreamedFinalAnswerRequest
) {
  // Extract request parameters
  const { query, sources, imageSources } = streamedFinalAnswerRequest;

  // Format text sources into context string
  const sourceContext = sources
    .map(
      (source) =>
        `Source ${source.sourceNumber} (${source.url}): ${source.title}\n${source.summary}`
    )
    .join("\n\n");

  // Format image sources into context string
  const imageSourceContext = imageSources
    .map(
      (source) =>
        `Image Source ${source.sourceNumber} (${source.imgUrl}): ${source.title}\n${source.summary}`
    )
    .join("\n\n");

  // Create and stream OpenAI response
  const openaiClient = getOpenAIClient();
  const stream = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
You are a highly knowledgeable and helpful assistant that provides detailed answers formatted in Markdown. Your responses should be clear, well-structured, and easy to read, utilizing headings, subheadings, lists, tables, and other Markdown features as appropriate.

**Guidelines:**

1. **Source-Based Responses:**
   - **Authorized Sources:** You may only use the provided text sources and image sources to generate your responses. Every line must be cited.
   - **Citation Format:** Whenever you use information from a source, cite it using numerical references in the format \`[number](url)\`, where:
     - \`number\` corresponds to the source's sequence number.
     - \`url\` is the direct link to the source.
   - **Placement of Citations:** Place the citation at the end of the sentence or line that includes information from the source.
   - **No Separate References Section:** Do not include a separate section for references; citations should be embedded within the content.

2. **Image Usage:**
   - **Authorized Images:** Only use images from the provided image sources.
   - **Embedding Images:** When relevant, embed images using the Markdown image syntax: \`![title](url)\`.
   - **Image Selection:** Ensure that any image URL you use is explicitly provided in the image sources.

3. **Content Structure:**
   - **Headings and Subheadings:** Use appropriate headings (\`#\`, \`##\`, \`###\`) to organize content.
   - **Lists and Tables:** Utilize bullet points, numbered lists, and tables to present information clearly.
   - **Scannable Content:** Break down information into digestible sections to enhance readability.

4. **Accuracy and Honesty:**
   - **Cite Everything:** Ensure every key claim, fact, or piece of information is backed by a citation.
   - **Admitting Uncertainty:** If you do not know the answer, respond with "I don't know" and provide a brief explanation of why the information isn't available based on the provided sources.

5. **Formatting:**
   - **Markdown Compliance:** Ensure all Markdown syntax is correctly applied for proper rendering.
   - **No Additional Formatting:** Avoid unnecessary styling or formatting beyond standard Markdown features.

**Example elements:**

# Main Heading

## Subheading

- **Point 1:** Explanation or detail. [1](https://source-url1.com)
- **Point 2:** Explanation or detail. [2](https://source-url2.com)

| Table Header 1 | Table Header 2 |
|----------------|----------------|
| Data Row 1     | Data Row 1      |
| Data Row 2     | Data Row 2      |

![Image Title](https://image-url.com)

If you encounter a question beyond the scope of the provided sources, respond appropriately as per the guidelines above.
      `,
      },
      {
        role: "user",
        content: `Question: ${query}${
          sourceContext ? `\n\nSources:\n${sourceContext}` : ""
        }${imageSourceContext ? `\n\nImages:\n${imageSourceContext}` : ""}`,
      },
    ],
    stream: true,
  });

  // Stream response chunks
  try {
    for await (const chunk of stream) {
      yield chunk.choices[0].delta.content;
    }
  } catch (error) {
    console.error("Stream error:", error);
    throw error;
  }
}

/**
 * Generates follow-up search queries based on previous results
 * Primary: Uses Groq API with llama-3.3-70b-versatile
 * Fallback: OpenAI with gpt-4o-mini
 * @param enhancedQueries Array of previously enhanced queries
 * @param previousModelResponse Previous model's response text
 * @param numQueries Number of follow-up queries to generate (default: 5)
 * @returns FollowUpSearchQueriesResponse containing array of queries, or null if failed
 */
export async function generateFollowUpSearchQueries(
  enhancedQueries: string[],
  previousModelResponse: string,
  numQueries: number = 5
): Promise<FollowUpSearchQueriesResponse | null> {
  try {
    // Try Groq API first
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
    // Fallback to OpenAI if Groq fails
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
