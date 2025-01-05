import Cerebras from "@cerebras/cerebras_cloud_sdk";
import OpenAI from "openai";
import { Groq } from "groq-sdk";
import FirecrawlApp from "@mendable/firecrawl-js";
import { randomChoice } from "./utils";

export function getCerebrasClient() {
  return new Cerebras({
    apiKey: randomChoice([
      process.env.CEREBRAS_API_KEY,
      process.env.CEREBRAS_API_KEY2,
      process.env.CEREBRAS_API_KEY3,
    ]),
  });
}

export function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export function getGroqClient() {
  return new Groq({
    apiKey: randomChoice([
      process.env.GROQ_API_KEY,
      process.env.GROQ_API_KEY2,
      process.env.GROQ_API_KEY3,
    ]),
  });
}

export function getFirecrawlClient() {
  return new FirecrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY,
  });
}
