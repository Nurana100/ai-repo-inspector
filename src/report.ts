import type { ChangedFile, ValidationResult } from "./types.js";

type ReportInput = {
  repositoryPath: string;
  changedFiles: ChangedFile[];
  validationResults: ValidationResult[];
};

// A fence longer than any backtick run inside the text, so output can't break out of it.
function fenceFor(text: string): string {
  const longest = Math.max(0, ...(text.match(/`+/g) ?? []).map((m) => m.length));
  return "`".repeat(Math.max(3, longest + 1));
}

function describeFile(file: ChangedFile): string {
  return file.status === "renamed" && file.oldPath
    ? `- ${file.path} (renamed from ${file.oldPath})`
    : `- ${file.path} (${file.status})`;
}

export function markdownReport(input: ReportInput): string {
  const lines = [`# Review Report: ${input.repositoryPath}`, "", "## Changed files"];
  if (input.changedFiles.length === 0) lines.push("_No changed files._");
  for (const file of input.changedFiles) lines.push(describeFile(file));

  lines.push("", "## Validation output");
  if (input.validationResults.length === 0) lines.push("_No validations were run._");
  for (const result of input.validationResults) {
    const fence = fenceFor(result.output);
    lines.push(`### ${result.command} (${result.status})`, fence, result.output, fence);
  }
  return lines.join("\n");
}