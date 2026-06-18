import "dotenv/config";
import { ChromaClient } from "chromadb";
import OpenAI from "openai";

const EMBEDDING_MODEL = "text-embedding-3-small";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type RetrievedChunk = {
  text: string;
  filePath: string;
  startLine: number;
  endLine: number;
  type: string;
  distance: number;
};

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
    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: question,
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
