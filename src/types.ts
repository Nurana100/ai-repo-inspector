export type ChangedFile = {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed";
  oldPath?: string;
};

export type ValidationResult = {
  command: string;
  status: "passed" | "failed";
  output: string;
  exitCode?: number | null;
  timedOut?: boolean;
};

export type ReviewRequest = {
  repositoryPath: string;
  baseRef?: string;
  validationCommands?: string[];
  format?: "markdown" | "json";
};