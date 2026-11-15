export type Args = {
  command: string;
  repositoryPath?: string;
  baseRef?: string;
  format: "markdown" | "json";
  validations: string[];
};

export function parseArgs(argv: string[]): Args {
  const args: Args = { command: argv[0] ?? "", format: "markdown", validations: [] };

  const value = (flag: string, index: number): string => {
    const v = argv[index];
    if (v === undefined || v.startsWith("--")) throw new Error(`Missing value for ${flag}`);
    return v;
  };

  for (let i = 1; i < argv.length; i++) {
    const token = argv[i];
    switch (token) {
      case "--repo":
        args.repositoryPath = value(token, ++i);
        break;
      case "--base-ref":
        args.baseRef = value(token, ++i);
        break;
      case "--format": {
        const f = value(token, ++i);
        if (f !== "markdown" && f !== "json") {
          throw new Error(`Invalid --format: ${f} (use markdown or json)`);
        }
        args.format = f;
        break;
      }
      case "--validate":
        args.validations.push(value(token, ++i));
        break;
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }
  return args;
}