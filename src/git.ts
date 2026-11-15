import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import type { ChangedFile } from "./types.js";

// Must not start with "-" so a ref can never be parsed as a git option.
const SAFE_REF = /^[A-Za-z0-9_][A-Za-z0-9._\/@{}~^-]*$/;

export function assertSafeRef(ref: string): string {
  if (!SAFE_REF.test(ref)) {
    throw new Error(`Invalid base ref: ${JSON.stringify(ref)}`);
  }
  return ref;
}

function git(repositoryPath: string, args: string[]): string {
  try {
    return execFileSync("git", args, {
      cwd: repositoryPath,
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const e = error as { stderr?: string; message: string };
    throw new Error(`git ${args[0]} failed: ${(e.stderr || e.message).toString().trim()}`);
  }
}

export function changedFiles(repositoryPath: string, baseRef = "main"): ChangedFile[] {
  if (!existsSync(repositoryPath)) {
    throw new Error(`Repository path does not exist: ${repositoryPath}`);
  }
  const base = assertSafeRef(baseRef);
  const output = git(repositoryPath, ["diff", "--name-status", "-z", "-M", `${base}...HEAD`]);

  const tokens = output.split("\0");
  if (tokens[tokens.length - 1] === "") tokens.pop();

  const files: ChangedFile[] = [];
  let i = 0;
  while (i < tokens.length) {
    const kind = tokens[i++][0];
    if (kind === "R" || kind === "C") {
      const from = tokens[i++];
      const to = tokens[i++];
      files.push(
        kind === "R"
          ? { path: to, status: "renamed", oldPath: from }
          : { path: to, status: "added" },
      );
    } else {
      const path = tokens[i++];
      files.push({
        path,
        status: kind === "A" ? "added" : kind === "D" ? "deleted" : "modified",
      });
    }
  }
  return files;
}