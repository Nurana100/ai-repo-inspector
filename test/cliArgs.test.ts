import { describe, expect, it } from "vitest";
import { parseArgs } from "../src/cliArgs.js";

describe("parseArgs", () => {
  it("keeps repo paths with spaces intact", () => {
    expect(parseArgs(["review", "--repo", "C:\\My Projects\\repo"]).repositoryPath).toBe(
      "C:\\My Projects\\repo",
    );
  });

  it("collects multiple --validate commands and defaults to markdown", () => {
    const a = parseArgs(["review", "--repo", "r", "--validate", "npm test", "--validate", "npm run lint"]);
    expect(a.validations).toEqual(["npm test", "npm run lint"]);
    expect(a.format).toBe("markdown");
  });

  it("rejects a flag with no value", () => {
    expect(() => parseArgs(["review", "--validate"])).toThrow(/Missing value/);
  });

  it("rejects an invalid format", () => {
    expect(() => parseArgs(["review", "--format", "xml"])).toThrow(/Invalid --format/);
  });

  it("rejects unknown flags", () => {
    expect(() => parseArgs(["review", "--rpo", "x"])).toThrow(/Unknown argument/);
  });
});