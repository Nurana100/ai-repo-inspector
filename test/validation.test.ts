import { describe, expect, it } from "vitest";
import { runValidation, runValidations, truncate } from "../src/validation.js";

const cwd = process.cwd();

describe("runValidation", () => {
  it("reports passed with output", async () => {
    const r = await runValidation(`node -e "console.log('ok')"`, cwd);
    expect(r.status).toBe("passed");
    expect(r.output).toContain("ok");
  });

  it("reports failed instead of throwing, with exit code and both streams", async () => {
    const r = await runValidation(
      `node -e "console.log('out'); console.error('err'); process.exit(3)"`,
      cwd,
    );
    expect(r.status).toBe("failed");
    expect(r.exitCode).toBe(3);
    expect(r.output).toContain("out");
    expect(r.output).toContain("err");
  });

  it("times out and reports it", async () => {
    const r = await runValidation(`node -e "setTimeout(() => {}, 10000)"`, cwd, 300);
    expect(r.status).toBe("failed");
    expect(r.timedOut).toBe(true);
  });

  it("keeps running later commands after a failure", async () => {
    const results = await runValidations(
      [`node -e "process.exit(1)"`, `node -e "console.log('second')"`],
      cwd,
    );
    expect(results.map((r) => r.status)).toEqual(["failed", "passed"]);
  });
});

describe("truncate", () => {
  it("leaves short text alone and marks long text", () => {
    expect(truncate("abc", 10)).toBe("abc");
    const out = truncate("x".repeat(50), 10);
    expect(out.startsWith("x".repeat(10))).toBe(true);
    expect(out).toContain("truncated 40 characters");
  });
});