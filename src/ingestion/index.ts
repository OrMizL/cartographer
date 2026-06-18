import "dotenv/config";
import { pathToFileURL } from "url";
import { REPOS, getRepoById, type Repo } from "../shared/repos.config.js";
import { cloneOrUpdate } from "./clone.js";
import { chunkRepo } from "./chunker.js";
import { embedAndStore } from "./embedder.js";

export async function ingestRepo(repo: Repo): Promise<void> {
  console.log(`Starting ingestion for ${repo.name}`);

  cloneOrUpdate(repo);

  const chunks = chunkRepo(`./repos/${repo.id}`);
  console.log(`Found ${chunks.length} chunks for ${repo.name}`);

  await embedAndStore(chunks, repo.id);

  console.log(`Done ingesting ${repo.name}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    try {
      const args = process.argv.slice(2);
      const flagIndex = args.findIndex((arg) => arg === "--repo");
      const repoId =
        flagIndex !== -1
          ? args[flagIndex + 1]
          : args.find((arg) => arg.startsWith("--repo="))?.split("=")[1];

      if (repoId) {
        await ingestRepo(getRepoById(repoId));
      } else {
        for (const repo of REPOS) {
          await ingestRepo(repo);
        }
      }
    } catch (error) {
      console.error(error);
    }
  })();
}
