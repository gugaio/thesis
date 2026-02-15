import { exec } from 'child_process';
import type { BashToolResult, ToolExecutionLog, ToolConfig } from './types.js';

export class BashToolExecutor {
  private executionLogs: ToolExecutionLog[] = [];

  async execute(
    command: string,
    config: ToolConfig,
    workingDir?: string
  ): Promise<BashToolResult> {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    let exitCode: number | null = null;
    let timedOut = false;
    let success = false;

    try {
      const result = await this.execWithTimeout(command, config.timeoutMs, workingDir);
      stdout = this.truncateOutput(result.stdout, config.maxOutputBytes);
      stderr = this.truncateOutput(result.stderr, config.maxOutputBytes);
      exitCode = result.exitCode;
      success = exitCode === 0;
    } catch (error) {
      if (error instanceof Error && error.message === 'Command timeout') {
        timedOut = true;
        stderr = `Command timed out after ${config.timeoutMs}ms`;
      } else if (error instanceof Error) {
        stderr = error.message;
      }
      success = false;
    }

    const durationMs = Date.now() - startTime;

    const result: BashToolResult = {
      success,
      command,
      stdout,
      stderr,
      exitCode,
      durationMs,
      timedOut
    };

    this.logExecution(config.name, command, durationMs, success, stdout.length + stderr.length);

    return result;
  }

  private async execWithTimeout(
    command: string,
    timeoutMs: number,
    workingDir?: string
  ): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Command timeout'));
      }, timeoutMs);

      const child = exec(command, {
        cwd: workingDir || process.cwd(),
        maxBuffer: 10 * 1024 * 1024, // 10MB
        shell: '/bin/bash'
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        resolve({ stdout, stderr, exitCode: code });
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }

  private truncateOutput(output: string, maxBytes: number): string {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(output);

    if (bytes.length <= maxBytes) {
      return output;
    }

    const truncatedBytes = bytes.slice(0, maxBytes);
    return new TextDecoder().decode(truncatedBytes) + '\n\n[Output truncated]';
  }

  private logExecution(
    toolName: string,
    command: string,
    durationMs: number,
    success: boolean,
    outputLength: number
  ): void {
    const log: ToolExecutionLog = {
      toolName,
      command,
      durationMs,
      success,
      outputLength,
      timestamp: new Date()
    };

    this.executionLogs.push(log);

    console.log(`[ToolExecution] ${toolName}: ${command.substring(0, 50)}...`);
    console.log(`[ToolExecution] Duration: ${durationMs}ms, Success: ${success}, Output: ${outputLength} bytes`);
  }

  getExecutionLogs(): ToolExecutionLog[] {
    return [...this.executionLogs];
  }

  clearLogs(): void {
    this.executionLogs = [];
  }
}

export function createBashToolExecutor(): BashToolExecutor {
  return new BashToolExecutor();
}
