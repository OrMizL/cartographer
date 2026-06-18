export type Repo = {
  id: string;
  name: string;
  url: string;
  description: string;
};

export const REPOS: Repo[] = [
  {
    id: "supabase-js",
    name: "supabase-js",
    url: "https://github.com/supabase/supabase-js.git",
    description: "Isomorphic JavaScript client for the Supabase platform.",
  },
  {
    id: "zod",
    name: "Zod",
    url: "https://github.com/colinhacks/zod.git",
    description: "TypeScript-first schema validation library with static type inference.",
  },
  {
    id: "trpc",
    name: "tRPC",
    url: "https://github.com/trpc/trpc.git",
    description: "End-to-end typesafe APIs made easy, without schemas or code generation.",
  },
  {
    id: "zustand",
    name: "Zustand",
    url: "https://github.com/pmndrs/zustand.git",
    description: "Small, fast, and scalable state management library for React.",
  },
];

export function getRepoById(id: string): Repo {
  const repo = REPOS.find((r) => r.id === id);
  if (!repo) {
    throw new Error(`Unknown repo id: ${id}`);
  }
  return repo;
}
