import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import type { Repo } from "../shared/repos.config.js";

export function cloneOrUpdate(repo: Repo): void {
  const repoPath = join("repos", repo.id);

  if (existsSync(repoPath)) {
    execSync("git pull", { cwd: repoPath, stdio: "inherit" });
  } else {
    execSync(`git clone --depth 1 ${repo.url} ${repoPath}`, { stdio: "inherit" });
  }
}
