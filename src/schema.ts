import { z } from "zod";
import type { ReviewRequest } from "./types.js";

export const reviewInputShape = {
  repoPath: z.string().min(1).describe("Path to the Git repository to inspect."),
  baseRef: z.string().min(1).optional().describe("Base ref to diff against. Defaults to main."),
  validationCommands: z.array(z.string()).optional(),
};

export const reviewInput = z.object(reviewInputShape).strict();
export type ReviewInput = z.infer<typeof reviewInput>;

export function toReviewRequest(input: ReviewInput): ReviewRequest {
  return {
    repositoryPath: input.repoPath,
    baseRef: input.baseRef,
    validationCommands: input.validationCommands,
  };
}