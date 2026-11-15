import { describe, expect, it } from "vitest";
import { reviewInput, toReviewRequest } from "../src/schema.js";

describe("review input contract", () => {
  it("maps repoPath to repositoryPath", () => {
    const parsed = reviewInput.parse({ repoPath: "/work/sample", baseRef: "dev" });
    expect(toReviewRequest(parsed)).toMatchObject({
      repositoryPath: "/work/sample",
      baseRef: "dev",
    });
  });

  it("rejects the old repo_path name instead of silently ignoring it", () => {
    expect(reviewInput.safeParse({ repo_path: "/work/sample" }).success).toBe(false);
  });

  it("rejects an empty repoPath", () => {
    expect(reviewInput.safeParse({ repoPath: "" }).success).toBe(false);
  });

  it("maps preset names to server-defined commands", () => {
    const req = toReviewRequest(reviewInput.parse({ repoPath: "/r", validations: ["test"] }));
    expect(req.validationCommands).toEqual(["npm test"]);
  });

  it("rejects free-form commands", () => {
    expect(reviewInput.safeParse({ repoPath: "/r", validations: ["rm -rf /"] }).success).toBe(false);
  });
});