"use server";

import { getCerebrasClient, getGroqClient, getOpenAIClient } from "@/lib/ai";
import { SearchResponse } from "../search/schemas";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { ChatCompletion } from "openai/resources/index.mjs";
import { ZSearchResponse } from "../search/schemas";

/**
 * Optimizes a raw image search query into multiple refined search queries
 * Primary: Uses Cerebras API with llama-3.3-70b
 * Fallback: OpenAI with gpt-4o-mini
 * @param query The raw search query to optimize
 * @param numQueries Number of optimized queries to generate (default: 3)
 * @returns SearchResponse containing array of optimized queries, or null if failed
 */
export async function optimizeRawImageSearchQuery(
  query: string,
  numQueries: number = 3
): Promise<SearchResponse | null> {
  // Verify API key exists in environment variables
  if (!process.env.CEREBRAS_API_KEY) {
    throw new Error("CEREBRAS_API_KEY is not set");
  }

  try {
    const cerebrasClient = getCerebrasClient();
    // Make primary API request to Cerebras
    const response = await cerebrasClient.chat.completions.create({
      model: "llama-3.3-70b",
      messages: [
        {
          role: "system",
          content: `Given a user search query, return the most optimized Google or Bing image search queries for this. Your response should be a JSON object with the following schema: {queries: string[]}. You should return ${numQueries} queries.`,
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
 * Generates a detailed description of an image given its title and URL
 * Uses Groq API with vision models
 * @param title The title of the image
 * @param imageUrl The URL of the image to describe
 * @returns String containing the image description, or null if failed
 */
export async function describeImage(
  title: string,
  imageUrl: string
): Promise<string | null> {
  // Set timeout to prevent hanging
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Image description timed out")), 10000)
  );

  try {
    // Race between description generation and timeout
    const result = await Promise.race([
      describeImageImpl(title, imageUrl),
      timeout,
    ]);
    return result as string | null;
  } catch (error) {
    // Handle generation cancellation
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Generation cancelled");
    }
    console.error("Error describing image:", error);
    return null;
  }
}

/**
 * Implementation function for image description
 * Handles fetching image data and making API request
 */
async function describeImageImpl(
  title: string,
  imageUrl: string
): Promise<string | null> {
  try {
    const groqClient = getGroqClient();

    // Fetch image data with fallback
    const imageData = await fetch(imageUrl, { mode: "no-cors" })
      .then((res) => res.arrayBuffer())
      .catch(async () => {
        const response = await fetch(imageUrl);
        return response.arrayBuffer();
      });
    const imageDataBase64 = Buffer.from(imageData).toString("base64");

    // Randomly select vision model (75% chance for 11b, 25% for 90b)
    const model =
      Math.random() < 0.75
        ? "llama-3.2-11b-vision-preview"
        : "llama-3.2-90b-vision-preview";

    // Make API request to Groq
    const response = await groqClient.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an assistant that evaluates images. You are given an image with title: "${title}". Given this and the image, write a detailed description of what is in the image and what the image is about.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageDataBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 384,
      temperature: 0.2,
      top_p: 1,
      stream: true,
    });

    // Accumulate streamed response
    let content = "";
    for await (const chunk of response) {
      content += chunk.choices[0]?.delta?.content || "";
    }
    return content;
  } catch (error) {
    // Handle generation cancellation
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Generation cancelled");
    }
    console.error(error);
    return null;
  }
}
