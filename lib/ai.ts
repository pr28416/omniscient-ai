import Cerebras from "@cerebras/cerebras_cloud_sdk";
import OpenAI from "openai";
import { Groq } from "groq-sdk";
import FirecrawlApp from "@mendable/firecrawl-js";

export function getCerebrasClient() {
  return new Cerebras({
    apiKey: process.env.CEREBRAS_API_KEY,
  });
}

export function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export function getGroqClient() {
  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

export function getFirecrawlClient() {
  return new FirecrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY,
  });
}
