# Cartographer

Cartographer is a code Q&A tool that answers natural-language questions about TypeScript libraries by retrieving and citing the actual source. Ask "how does auth work?" or "where is realtime handled?" and get an answer grounded in real chunks of code, each tagged with the file path and line range it came from — not a paraphrase of documentation, not a hallucinated guess.

## Live Demo

https://cartographer.ormiz.dev — Select a repo, ask a question in plain English, and get an answer cited to the exact file and line number.

## How it works

Cartographer runs as two separate pipelines: an offline ingestion pipeline that indexes a repo, and an online query pipeline that answers questions against that index.

**Ingestion** clones the target repo, walks its TypeScript source with tree-sitter to pull out functions, classes, and methods as discrete chunks, embeds each chunk with OpenAI, and stores the vectors in Chroma alongside file/line metadata.

**Query** takes a natural-language question, rewrites it through Claude into something that looks more like the code it's trying to find, embeds that rewritten query, retrieves the nearest chunks from Chroma, and hands all of them to Claude to synthesize into a cited answer.

```
INGESTION (offline, per repo)
  git clone ──▶ tree-sitter AST walk ──▶ chunk (fn/class/method)
                                              │
                                              ▼
                                    OpenAI embeddings (text-embedding-3-small)
                                              │
                                              ▼
                                         Chroma collection
                                    (vector + filePath/startLine/endLine)

QUERY (online, per request)
  question ──▶ Claude (query expansion: NL → code-shaped query)
                                              │
                                              ▼
                                    OpenAI embed expanded query
                                              │
                                              ▼
                              Chroma vector search (top 15 by distance)
                                              │
                                              ▼
                          Claude (synthesize answer, cite file:line)
                                              │
                                              ▼
                                    answer + cited chunks
```

Source: `src/ingestion/{clone,chunker,embedder}.ts`, `src/query/{retriever,synthesizer}.ts`.

## Engineering decisions

**AST-aware chunking, not fixed-token splitting.** `chunker.ts` walks the tree-sitter AST and emits one chunk per function, class (plus its methods), or method definition — never a token window straddling two unrelated functions. A function is the unit a developer reasons about, so it's the unit Cartographer retrieves and cites. The tradeoff: top-level arrow functions assigned to a `const` (`export const useStore = () => ...`) aren't caught by the `arrow_function` case directly — they fall through to the default `walk()` on the parent `variable_declaration`/`export_statement` node, so they're still picked up, just not tagged as their own chunk type.

**Query expansion before embedding.** A question like "how does auth work?" lives in a different region of embedding space than the auth code itself — questions and implementations don't share vocabulary. Before embedding, `retriever.ts` sends the question to Claude with an instruction to rewrite it as a technical description of the relevant code (function names, types, patterns). The expanded query is what actually gets embedded and searched against, closing the gap between "how people ask" and "how code is written."

**Wide top-15 retrieval instead of top-3 to 5.** `retrieve()` pulls `topK=15` chunks by vector distance rather than a narrow top handful. Real answers — "how does realtime handled work?" — often span a client class, a channel handler, and a type definition in three different files. A narrow top-k would surface only the single closest match and miss the rest. Retrieval doesn't run a separate cross-encoder re-ranker; it casts a wide net by distance and leans on Claude's synthesis pass to read all 15 chunks and decide what's actually relevant to the question, citing only what supports the answer.

**Monorepo support via `findSrcDirs`.** Libraries like tRPC ship as a monorepo with `packages/*/src` rather than a single root `src/`. `chunker.ts`'s `findSrcDirs` recursively searches for directories literally named `src`, descending up to 4 levels (`depth <= maxDepth`), so nested package source trees get picked up without per-repo configuration. `SKIP_DIRS` (`node_modules`, `dist`, `test`, `__tests__`) prunes the search so it doesn't waste cycles descending into build output or test fixtures.

**Known limitation: large files get dropped.** `chunkFile` tries to route around tree-sitter's parser buffer limits by segmenting any source over 100KB into 80KB windows with 5KB overlap, re-parsing each window and deduping resulting chunks by start line. In practice this workaround doesn't fully hold — tree-sitter's underlying buffer handling still chokes on a meaningful share of real-world files above roughly 30KB, and a failed parse is caught and the file is skipped entirely (logged as a warning, not a hard failure). The repo still gets indexed; that file's chunks just aren't in it.

## Supported repos

Configured in `src/shared/repos.config.ts`:

- [supabase-js](https://github.com/supabase/supabase-js.git) — isomorphic JS client for the Supabase platform
- [zod](https://github.com/colinhacks/zod.git) — TypeScript-first schema validation
- [trpc](https://github.com/trpc/trpc.git) — end-to-end typesafe APIs without schemas or codegen
- [zustand](https://github.com/pmndrs/zustand.git) — small, fast state management for React

Adding a repo means adding an entry to `REPOS` and running ingestion for it — no other config required as long as the source lives under a `src/` directory.

## Stack

- TypeScript / Node.js, ESM throughout
- Express — `/repos`, `/query`, `/health` API
- tree-sitter + tree-sitter-typescript — AST parsing for chunking
- OpenAI `text-embedding-3-small` — embeddings
- Chroma — vector store
- Claude (Anthropic) — query expansion and answer synthesis
- React + Vite — frontend

## Local development

Requires Node.js, an OpenAI API key, and an Anthropic API key.

```bash
# install dependencies
npm install

# configure environment
cat <<EOF > .env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
CHROMA_URL=http://localhost:8000
EOF

# start a local Chroma server (separate terminal)
chroma run --path ./chroma_store

# ingest all configured repos (clones into ./repos, embeds, stores to Chroma)
npm run ingest

# or ingest a single repo
npm run ingest -- --repo zod

# start the API server
npm run dev
```

The server listens on `PORT` (default `3000`). `POST /query` with `{ "question": "...", "repoId": "zod" }` returns `{ answer, chunks }`, where each chunk carries `filePath`, `startLine`, `endLine`, `type`, and `distance`.

## Deployment

The frontend is deployed on Vercel at [cartographer.ormiz.dev](https://cartographer.ormiz.dev). The backend API and Chroma vector store run on a DigitalOcean VPS at [api.cartographer.ormiz.dev](https://api.cartographer.ormiz.dev), managed by PM2 with automatic restarts and reboot persistence. HTTPS is handled by Caddy on the backend (reverse proxy with auto-provisioned TLS) and by Vercel on the frontend.
