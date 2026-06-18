import "dotenv/config";
import { randomUUID } from "crypto";
import { ChromaClient } from "chromadb";
import OpenAI from "openai";
import type { CodeChunk } from "../ingestion/chunker.js";

const EMBEDDING_MODEL = "text-embedding-3-small";
const BATCH_SIZE = 100;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function chunkBatches<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

export async function embedAndStore(chunks: CodeChunk[], repoId: string): Promise<void> {
  const chromaUrl = new URL(process.env.CHROMA_URL ?? "http://localhost:8000");
  const client = new ChromaClient({
    host: chromaUrl.hostname,
    port: Number(chromaUrl.port),
  });

  try {
    await client.deleteCollection({ name: repoId });
  } catch {
    // Collection didn't exist yet — nothing to delete.
  }

  const collection = await client.createCollection({ name: repoId });

  const batches = chunkBatches(chunks, BATCH_SIZE);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch.map((chunk) => chunk.text),
    });

    await collection.add({
      ids: batch.map(() => randomUUID()),
      embeddings: response.data.map((item) => item.embedding),
      documents: batch.map((chunk) => chunk.text),
      metadatas: batch.map((chunk) => ({
        filePath: chunk.filePath,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        type: chunk.type,
      })),
    });

    console.log(`Embedded batch ${i + 1}/${batches.length} for ${repoId}`);
  }
}
