#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { parseArgs } from "./cliArgs.js";
import { render, review } from "./core.js";

const USAGE =
  "Usage: inspector review --repo <path> [--base-ref <ref>] [--format markdown|json] [--validate <command>]...";

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(USAGE);
    process.exitCode = 1;
    return;
  }

  if (args.command !== "review" || !args.repositoryPath) {
    console.error(USAGE);
    process.exitCode = 1;
    return;
  }

  const result = await review({
    repositoryPath: args.repositoryPath,
    baseRef: args.baseRef,
    validationCommands: args.validations,
  });
  const file = args.format === "json" ? "review-report.json" : "review-report.md";
  writeFileSync(file, render(result, args.format), "utf8");
  console.log(`Review report written to ${file}`);

  // Exit code 2: the review ran, but at least one validation failed.
  if (result.validationResults.some((r) => r.status === "failed")) process.exitCode = 2;
}

main().catch((error) => {
  console.error("Error:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});