import { exec } from "node:child_process";
import type { ValidationResult } from "./types.js";

export const DEFAULT_TIMEOUT_MS = 120_000;
export const MAX_OUTPUT_CHARS = 20_000;

export function truncate(text: string, max = MAX_OUTPUT_CHARS): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n... [truncated ${text.length - max} characters]`;
}

export function runValidation(
  command: string,
  cwd: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<ValidationResult> {
  return new Promise((resolve) => {
    exec(
      command,
      { cwd, timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024, windowsHide: true },
      (error, stdout, stderr) => {
        const output = truncate([stdout, stderr].filter(Boolean).join("\n"));
        if (!error) {
          resolve({ command, status: "passed", output, exitCode: 0 });
          return;
        }
        const timedOut = error.killed === true;
        resolve({
          command,
          status: "failed",
          output: timedOut ? `${output}\n[timed out after ${timeoutMs} ms]`.trim() : output,
          exitCode: typeof error.code === "number" ? error.code : null,
          timedOut,
        });
      },
    );
  });
}

export async function runValidations(commands: string[], cwd: string): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  for (const command of commands) {
    results.push(await runValidation(command, cwd));
  }
  return results;
}