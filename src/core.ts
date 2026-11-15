import { changedFiles } from "./git.js";
import { markdownReport } from "./report.js";
import type { ChangedFile, ReviewRequest, ValidationResult } from "./types.js";
import { runValidations } from "./validation.js";

export type ReviewResult = {
  repositoryPath: string;
  changedFiles: ChangedFile[];
  validationResults: ValidationResult[];
};

export async function review(request: ReviewRequest): Promise<ReviewResult> {
  const files = changedFiles(request.repositoryPath, request.baseRef);
  const validations = await runValidations(
    request.validationCommands ?? [],
    request.repositoryPath,
  );
  return {
    repositoryPath: request.repositoryPath,
    changedFiles: files,
    validationResults: validations,
  };
}

export function render(result: ReviewResult, format: "markdown" | "json" = "markdown"): string {
  return format === "json" ? JSON.stringify(result, null, 2) : markdownReport(result);
}

export async function reviewRepository(request: ReviewRequest): Promise<string> {
  return render(await review(request), request.format);
}