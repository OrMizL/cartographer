import "dotenv/config";
import express from "express";
import { query } from "./query/index.js";
import { REPOS } from "./shared/repos.config.js";

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.get("/repos", (_req, res) => {
  res.json(REPOS);
});

app.post("/query", async (req, res) => {
  const { question, repoId } = req.body ?? {};

  if (!question || !repoId) {
    res.status(400).json({ error: "question and repoId are required" });
    return;
  }

  try {
    const { answer, chunks } = await query(question, repoId);
    res.json({
      answer,
      chunks: chunks.map(({ filePath, startLine, endLine, type, distance }) => ({
        filePath,
        startLine,
        endLine,
        type,
        distance,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", repos: REPOS.map((r) => r.id) });
});

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
  console.log(`Cartographer API listening on port ${port}`);
});
