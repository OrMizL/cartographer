import "dotenv/config";
import { ChromaClient } from "chromadb";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EXPANSION_MODEL = "claude-sonnet-4-6";

function buildExpansionSystemPrompt(repoId: string): string {
  return `You are helping improve code search for the ${repoId} TypeScript library. Given a natural language question about a TypeScript codebase, rewrite it as a technical description of what the relevant code would look like — function names, patterns, types, and implementation details. Return only the rewritten query, nothing else.`;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type RetrievedChunk = {
  text: string;
  filePath: string;
  startLine: number;
  endLine: number;
  type: string;
  distance: number;
};

export async function expandQuery(question: string, repoId: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: EXPANSION_MODEL,
    max_tokens: 256,
    system: buildExpansionSystemPrompt(repoId),
    messages: [{ role: "user", content: question }],
  });

  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}

export async function retrieve(
  question: string,
  repoId: string,
  topK: number = 15
): Promise<RetrievedChunk[]> {
  const chromaUrl = new URL(process.env.CHROMA_URL ?? "http://localhost:8000");
  const client = new ChromaClient({
    host: chromaUrl.hostname,
    port: Number(chromaUrl.port),
  });

  try {
    const expandedQuery = await expandQuery(question, repoId);
    console.log(`Expanded query: ${expandedQuery}`);

    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: expandedQuery,
    });
    const [queryEmbedding] = embeddingResponse.data.map((item) => item.embedding);

    const collection = await client.getCollection({ name: repoId });

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      include: ["documents", "metadatas", "distances"],
    });

    const documents = results.documents[0] ?? [];
    const metadatas = results.metadatas[0] ?? [];
    const distances = results.distances[0] ?? [];

    const chunks: RetrievedChunk[] = documents.map((document, index) => {
      const metadata = metadatas[index] ?? {};
      return {
        text: document ?? "",
        filePath: String(metadata.filePath ?? ""),
        startLine: Number(metadata.startLine ?? 0),
        endLine: Number(metadata.endLine ?? 0),
        type: String(metadata.type ?? ""),
        distance: distances[index] ?? Infinity,
      };
    });

    return chunks.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    throw new Error(
      `Failed to retrieve chunks for repo "${repoId}": ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
