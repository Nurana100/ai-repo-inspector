import { describe, expect, it } from "vitest";
import { markdownReport } from "../src/report.js";

describe("markdownReport robustness", () => {
  it("uses a longer fence when output contains backticks", () => {
    const report = markdownReport({
      repositoryPath: "/r",
      changedFiles: [],
      validationResults: [{ command: "x", status: "failed", output: "a\n```\nb" }],
    });
    expect(report).toContain("````");
  });

  it("shows renames and failed status", () => {
    const report = markdownReport({
      repositoryPath: "/r",
      changedFiles: [{ path: "new.ts", status: "renamed", oldPath: "old.ts" }],
      validationResults: [{ command: "npm test", status: "failed", output: "boom" }],
    });
    expect(report).toContain("new.ts (renamed from old.ts)");
    expect(report).toContain("npm test (failed)");
  });
});