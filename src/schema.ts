import { z } from "zod";
import type { ReviewRequest } from "./types.js";

// Server-defined commands. MCP clients choose a name, never a command string.
export const VALIDATION_PRESETS = {
  test: "npm test",
  typecheck: "npm run typecheck",
  lint: "npm run lint",
} as const;

export const reviewInputShape = {
  repoPath: z.string().min(1).describe("Path to the Git repository to inspect."),
  baseRef: z.string().min(1).optional().describe("Base ref to diff against. Defaults to main."),
  validations: z
    .array(z.enum(["test", "typecheck", "lint"]))
    .max(3)
    .optional()
    .describe("Named checks to run in the repository: test, typecheck, lint."),
};

export const reviewInput = z.object(reviewInputShape).strict();
export type ReviewInput = z.infer<typeof reviewInput>;

export function toReviewRequest(input: ReviewInput): ReviewRequest {
  return {
    repositoryPath: input.repoPath,
    baseRef: input.baseRef,
    validationCommands: input.validations?.map((name) => VALIDATION_PRESETS[name]),
  };
}