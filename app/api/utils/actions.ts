"use server";

import { getGroqClient, getOpenAIClient } from "@/lib/ai";
import { DecisionSchema, ZDecisionSchema } from "./schemas";
import { zodResponseFormat } from "openai/helpers/zod.mjs";

/**
 * Makes a decision about whether a query satisfies a given constraint
 * Primary: Uses GROQ API with llama3-8b-8192 for detailed reasoning and decision
 * Fallback: OpenAI with gpt-4o-mini for direct decision
 * @param query The query to evaluate
 * @param constraint The constraint to check against
 * @returns Boolean indicating if query satisfies constraint
 */
export async function decision(
  query: string,
  constraint: string
): Promise<boolean> {
  try {
    // Validate GROQ API key exists
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set");
    }

    const groqClient = getGroqClient();

    // First API call: Get detailed decision with reasoning
    const decisionWithReasoningResponse =
      await groqClient.chat.completions.create({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content:
              "You are a decision maker. You will be given a constraint and a query. You must decide if the query satisfies the constraint. Your response must be a brief explanation of your reasoning, followed by your decision.",
          },
          {
            role: "user",
            content: `Constraint: ${constraint}\n\nQuery: ${query}`,
          },
        ],
      });

    const decisionWithReasoning =
      decisionWithReasoningResponse.choices[0].message.content;

    if (!decisionWithReasoning) {
      throw new Error("Failed to make decision with reasoning");
    }

    // Second API call: Convert reasoning into boolean decision
    const response = await groqClient.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content:
            "You are a decision maker. Given a decision you made about something, and a brief explanation of your reasoning, return a boolean value that represents the decision you made. Your response must be a JSON object with the following schema: { decision: boolean }",
        },
        {
          role: "user",
          content: `Decision: ${decisionWithReasoning}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    // Parse response and extract decision
    const decision = JSON.parse(
      response.choices[0].message.content ?? ""
    ) as DecisionSchema;

    return decision.decision;
  } catch (error) {
    console.error(error);

    // Fallback to OpenAI if GROQ fails
    const openaiClient = getOpenAIClient();

    // Single API call to get decision directly from OpenAI
    const response = await openaiClient.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a decision maker. You will be given a constraint and a query. You must decide if the query satisfies the constraint. Your response must be a JSON object with the following schema: { decision: boolean }",
        },
        {
          role: "user",
          content: `Constraint: ${constraint}\n\nQuery: ${query}`,
        },
      ],
      response_format: zodResponseFormat(ZDecisionSchema, "decision"),
    });

    // Extract decision from parsed response with fallback
    const decision = response.choices[0].message.parsed;

    return decision?.decision ?? false;
  }
}

/**
 * Creates a concise title for a chat session based on the initial query
 * Uses GROQ API with llama3-8b-8192 to generate a short descriptive title
 * Falls back to original query if generation fails
 * @param query The query to create a title from
 * @returns Generated title string or original query if failed
 */
export async function createSessionTitle(query: string): Promise<string> {
  try {
    // Create a concise title using GROQ
    const groqClient = getGroqClient();
    const response = await groqClient.chat.completions.create({
      model: "llama3-8b-8192",
      messages: [
        {
          role: "system",
          content:
            "You are a session title creator. You will be given a query. You must create a title for a session that is a single sentence using fewer than 8 words that captures the essence of the query.",
        },
        { role: "user", content: query },
      ],
    });

    const title = response.choices[0].message.content;

    // Remove any surrounding quotes and fallback to original query if needed
    return title?.replace(/^"|"$/g, "") ?? query;
  } catch (error) {
    console.error(error);
    return query;
  }
}
