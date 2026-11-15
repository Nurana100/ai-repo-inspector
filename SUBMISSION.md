# \# Submission

# 

# \## What did you investigate first, and why?

# I read `src/mcp-server.ts` and `src/types.ts` first, because the README said to check the MCP input contract. The tool advertised `repo\_path` but the handler was typed `input: any`, so TypeScript could not catch a mismatch. I wrote `scripts/mcp-smoke.mjs` to call the real server over stdio and reproduced the bug before fixing it: the tool returned a \*successful\* report titled `# Review Report: undefined`. A wrong answer that looks right is worse than an error, so I treated it as the top priority. Then I read `validation.ts`, `git.ts`, `report.ts` and `cli.ts`, and ran `npm run build` to check the package layout.

# 

# \## What did you choose to implement or fix?

# 1\. \*\*MCP contract bug.\*\* One zod schema (`src/schema.ts`) now defines the advertised contract and types the handler. The field is `repoPath`. This is a breaking rename, but the old contract never worked, so nothing could depend on it.

# 2\. \*\*Validation crashed the review.\*\* A failing command threw, although the type already had a `"failed"` status. Failures now return status, exit code and both output streams. I added a 120 s timeout and a 20,000-character output cap with a truncation marker.

# 3\. \*\*Shell commands over MCP.\*\* The MCP tool now accepts only preset names (`test`, `typecheck`, `lint`). The command strings live on the server.

# 4\. \*\*Git handling.\*\* `baseRef` is validated so it can't be read as a git option (for example `--output=...`). Renames and filenames with spaces are parsed with `-z`. Errors are clear. I removed the `"untracked"` status because the code never produced it.

# 5\. \*\*Report.\*\* Code fences grow longer than any backtick run in the output. Renames and validation status are shown. Empty sections say so.

# 6\. \*\*CLI.\*\* Paths with spaces work, a missing flag value is an error, unknown flags are rejected, `--format json` is honoured (it was ignored before), and the exit code is 2 when a validation fails.

# 7\. \*\*Packaging.\*\* `npm run build` outputs `dist/src/cli.js`, but `bin` pointed to `./dist/cli.js`. I confirmed this with `dir dist` and fixed `bin`.

# 

# \## What did you intentionally not do?

# \- No repo-root allowlist or sandbox for MCP. It needs a design decision about which paths are allowed, and I did not have time to do it properly.

# \- No separate build config to keep `test/` out of `dist/`.

# \- No support for uncommitted or untracked changes. The tool reviews `base...HEAD` only.

# \- No changes to CI, and I did not add a lint script (the `lint` preset exists, but the repo has no `lint` script yet).

# \- No README update beyond this file.

# 

# \## Interface decision

# \*\*Decision:\*\* hybrid, with a smaller MCP surface.

# 

# \*\*Primary user and execution environment:\*\* developers at a terminal using the CLI, and AI coding agents calling the MCP tool over stdio on a developer's machine or CI runner.

# 

# \*\*Trust boundary and allowed capabilities:\*\* the person at the CLI chooses what runs, so the CLI keeps free-form `--validate "<command>"`. An MCP client can be steered by prompt injection, so it cannot send command strings. It sends preset names and the server decides the commands. Capabilities of MCP: read git diff metadata and run three fixed checks.

# 

# \*\*Reliability, discoverability, latency/context, and output tradeoffs:\*\* MCP gives agents a discoverable, typed contract, and the schema descriptions tell them the allowed values. The CLI is simpler and faster for humans. Validation output is capped at 20,000 characters per command so one noisy test run cannot flood an agent's context. Failures are returned as data, not exceptions, so a caller always gets a report. The cost is that a truncated log may hide the real error.

# 

# \*\*How supported interfaces remain consistent:\*\* both adapters call the same core (`review()` and `render()`), so the same repo and base ref give the same changed files and the same report. Only the input rules differ, and that difference is deliberate (see trust boundary).

# 

# \*\*Evidence that would change this decision:\*\* if nearly all real usage were agents, I would go MCP-first and drop the free-form CLI option. If agents needed custom checks, I would add a per-server allowlist of commands, not accept strings. If nobody used MCP, I would go CLI-first and remove the MCP surface to reduce attack area.

# 

# \## How did you use an AI coding agent?

# I used Claude as a pair-programmer. It proposed the investigation order and wrote the code and tests. I ran every step myself on Windows, pasted the output back, and only committed when typecheck and tests were clean. I reproduced the bug myself with the smoke script and checked the build output myself.

# 

# \## Where did you check, correct, or reject an AI suggestion? (required)

# \- The AI's first smoke-script instruction said to change one line inside the script. I treated that line as the whole file, and Node failed with `SyntaxError: Unexpected token ','`. The AI then gave me the full script and it worked. I caught that the instruction was ambiguous by reading the error.

# \- The AI suspected the `bin` path was wrong. I did not trust the suspicion. I ran `npm run build` and `dir dist`, confirmed the file was at `dist/src/cli.js`, fixed it, and then ran the built file directly.

# \- The AI wrote that the MCP SDK "probably" strips unknown keys and that `.strict()` may not apply inside the SDK. I did not claim either in this file, because I did not verify them through the live server.

# 

# \## Commands used to verify the result, with outcomes

# \- `node scripts/mcp-smoke.mjs` (before): tool advertised `repo\_path`; report title was `undefined`. Bug reproduced.

# \- `npm test` before `src/schema.ts` existed: failed with `Cannot find module '../src/schema.js'`. After: passed.

# \- `npm run typecheck`: clean after every step.

# \- `npm test` final: 22 tests passed in 6 files. This includes tests on a real temporary git repo (renames, spaces in names, bad ref, bad path).

# \- `npm run inspector -- review --repo . --base-ref afcf30d --format json`: wrote `review-report.json` listing all 16 changed files with correct statuses.

# \- `npm run inspector -- review --rpo x`: printed `Unknown argument: --rpo` and the usage line.

# \- `npm run build`, `dir dist`: showed only `src` and `test`, which confirmed the `bin` bug. After the fix, `node dist\\src\\cli.js review --rpo x` ran correctly.

# \- GitHub Actions: green on Linux with Node 20 after the validation commit. I did not re-check it for the later commits.

# \- Not test-first for validation: a machine restart interrupted that step, so I ran those tests after writing the code. The schema fix was test-first (red, then green).

# 

# \## A blocker you hit and how you approached it

# The first run of the smoke script failed with a syntax error because my file contained only one line. I read the error, saw the file was incomplete, and replaced the whole file with the full script. A second, smaller blocker: my computer's mouse stopped working and I had to restart. I used `git status` and `git log` to see exactly what was saved, and re-checked every file before continuing. Committed work was safe.

# 

# \## Known limitations and the next three things you would do

# \*\*Limitations:\*\*

# \- Presets run `npm test` inside the target repo, so a malicious repo's own scripts execute. MCP is not safe against hostile repos.

# \- No restriction on which paths an MCP client can inspect.

# \- I did not verify, through the live MCP server, what happens with the old `repo\_path` key or unknown fields. Unit tests show our schema rejects them. I also did not re-run the live smoke test after the preset change.

# \- On Windows, a timeout kills the shell but may leave child processes behind.

# \- Only committed changes are reviewed. The `dist` folder also contains compiled tests.

# 

# \*\*Next three things:\*\*

# 1\. Add an allowed-repo-roots setting for MCP (an environment variable) and consider sandboxing the validation commands.

# 2\. Re-run the live MCP smoke test and add an automated end-to-end test of the server, including the old key and unknown fields.

# 3\. Add a separate build config for `src` only, a real `lint` script, and an option to include uncommitted changes.

# 

# \## Approximate focused-work time

# Start: 22:45

# Finish: 23:23 (about 38 focused minutes of coding and verification). The Node install, the machine restart and this write-up are not counted.

