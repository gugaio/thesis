export interface ToolConfig {
  name: string;
  description: string;
  allowed: boolean;
  timeoutMs: number;
  maxOutputBytes: number;
}

export interface BashToolResult {
  success: boolean;
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  timedOut: boolean;
}

export interface ToolExecutionLog {
  toolName: string;
  command: string;
  durationMs: number;
  success: boolean;
  outputLength: number;
  timestamp: Date;
}
