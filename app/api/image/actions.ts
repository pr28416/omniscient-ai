"use server";

import { getCerebrasClient, getGroqClient, getOpenAIClient } from "@/lib/ai";
import { SearchResponse } from "../search/schemas";
import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { ChatCompletion } from "openai/resources/index.mjs";
import { ZSearchResponse } from "../search/schemas";

export async function optimizeRawImageSearchQuery(
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
          content: `Given a user search query, return the most optimized Google or Bing image search queries for this. Your response should be a JSON object with the following schema: {queries: string[]}. You should return ${numQueries} queries.`,
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

export async function describeImage(
  title: string,
  imageUrl: string
): Promise<string | null> {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Image description timed out")), 5000)
  );

  try {
    const result = await Promise.race([
      describeImageImpl(title, imageUrl),
      timeout,
    ]);
    return result as string | null;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Generation cancelled");
    }
    console.error("Error describing image:", error);
    return null;
  }
}

async function describeImageImpl(
  title: string,
  imageUrl: string
): Promise<string | null> {
  try {
    console.log("describing image: ", title, imageUrl);
    const groqClient = getGroqClient();
    const imageData = await fetch(imageUrl, { mode: "no-cors" })
      .then((res) => res.arrayBuffer())
      .catch(async () => {
        const response = await fetch(imageUrl);
        return response.arrayBuffer();
      });
    const imageDataBase64 = Buffer.from(imageData).toString("base64");
    const model =
      Math.random() < 0.75
        ? "llama-3.2-11b-vision-preview"
        : "llama-3.2-90b-vision-preview";
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
    let content = "";
    for await (const chunk of response) {
      content += chunk.choices[0]?.delta?.content || "";
    }
    return content;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Generation cancelled");
    }
    console.error(error);
    return null;
  }
}
