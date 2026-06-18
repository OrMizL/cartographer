import "dotenv/config";
import { pathToFileURL } from "url";
import { retrieve, type RetrievedChunk } from "./retriever.js";
import { synthesize } from "./synthesizer.js";

export type { RetrievedChunk };

export async function query(
  question: string,
  repoId: string
): Promise<{ answer: string; chunks: RetrievedChunk[] }> {
  const chunks = await retrieve(question, repoId);
  const answer = await synthesize(question, chunks);
  return { answer, chunks };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    try {
      const question = process.argv[2];
      const repoId = process.argv[3];

      if (!question || !repoId) {
        console.error("Usage: tsx src/query/index.ts <question> <repoId>");
        process.exit(1);
      }

      const { answer, chunks } = await query(question, repoId);
      console.log(answer);
      console.log(`\nUsed ${chunks.length} chunks`);
    } catch (error) {
      console.error(error);
    }
  })();
}
