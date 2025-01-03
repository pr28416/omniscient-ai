import Cerebras from "@cerebras/cerebras_cloud_sdk";
import OpenAI from "openai";
import { Groq } from "groq-sdk";
import FirecrawlApp from "@mendable/firecrawl-js";

export const cerebras = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY,
});

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
});
