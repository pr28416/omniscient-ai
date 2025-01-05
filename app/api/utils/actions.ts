"use server";

import { getGroqClient, getOpenAIClient } from "@/lib/ai";
import { DecisionSchema, ZDecisionSchema } from "./schemas";
import { zodResponseFormat } from "openai/helpers/zod.mjs";

export async function decision(
  query: string,
  constraint: string
): Promise<boolean> {
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set");
    }

    const groqClient = getGroqClient();

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

    console.log("Decision with reasoning:", decisionWithReasoning);

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

    const decision = JSON.parse(
      response.choices[0].message.content ?? ""
    ) as DecisionSchema;

    return decision.decision;
  } catch (error) {
    console.error(error);

    const openaiClient = getOpenAIClient();

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

    const decision = response.choices[0].message.parsed;

    return decision?.decision ?? false;
  }
}
