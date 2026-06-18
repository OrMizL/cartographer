import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import type { RetrievedChunk } from "./retriever.js";

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are a code assistant helping developers understand a TypeScript codebase. Answer the question based only on the provided code chunks. Cite file paths and line numbers when relevant. If the answer isn't in the chunks, say you don't know.`;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function formatChunk(chunk: RetrievedChunk): string {
  return `--- ${chunk.filePath}:${chunk.startLine}-${chunk.endLine} ---\n${chunk.text}\n--- end chunk ---`;
}

function buildPrompt(question: string, chunks: RetrievedChunk[]): string {
  const formattedChunks = chunks.map(formatChunk).join("\n\n");
  return `Question: ${question}\n\nRetrieved code chunks:\n\n${formattedChunks}`;
}

export async function synthesize(question: string, chunks: RetrievedChunk[]): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildPrompt(question, chunks) }],
  });

  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}
