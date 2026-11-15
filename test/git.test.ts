import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { changedFiles } from "../src/git.js";

let dir: string;

function run(...args: string[]) {
  execFileSync(
    "git",
    ["-c", "user.name=t", "-c", "user.email=t@example.com", "-c", "commit.gpgsign=false", ...args],
    { cwd: dir, stdio: "ignore" },
  );
}

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "inspector-"));
  run("init");
  run("symbolic-ref", "HEAD", "refs/heads/main");
  writeFileSync(join(dir, "a.txt"), "hello\nworld\nthis is a file\n");
  writeFileSync(join(dir, "keep.txt"), "to be deleted\n");
  run("add", "-A");
  run("commit", "-m", "base");
  run("checkout", "-b", "feature");
  run("mv", "a.txt", "renamed file.txt");
  unlinkSync(join(dir, "keep.txt"));
  writeFileSync(join(dir, "new.txt"), "brand new\n");
  run("add", "-A");
  run("commit", "-m", "changes");
}, 30000);

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("changedFiles", () => {
  it("reports added, deleted and renamed files, including names with spaces", () => {
    const files = changedFiles(dir, "main");
    expect(files).toEqual(
      expect.arrayContaining([
        { path: "new.txt", status: "added" },
        { path: "keep.txt", status: "deleted" },
        { path: "renamed file.txt", status: "renamed", oldPath: "a.txt" },
      ]),
    );
    expect(files).toHaveLength(3);
  });

  it("rejects a base ref that looks like a git option", () => {
    expect(() => changedFiles(dir, "--output=evil.txt")).toThrow(/Invalid base ref/);
  });

  it("fails clearly when the path does not exist", () => {
    expect(() => changedFiles(join(dir, "nope"), "main")).toThrow(/does not exist/);
  });

  it("fails clearly when the ref does not exist", () => {
    expect(() => changedFiles(dir, "no-such-branch")).toThrow(/git diff failed/);
  });
}, 30000);