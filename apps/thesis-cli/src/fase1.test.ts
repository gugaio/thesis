import { describe, it, expect, beforeAll } from 'vitest';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import path from 'path';
import { ensureCliIntegrationPrerequisites } from './__tests__/helpers/cli-prereqs';

const CLI_PATH = path.join(__dirname, '../dist/index.js');
const NODE = process.execPath;

function runCli(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const child = spawn(NODE, [CLI_PATH, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, API_URL: 'http://localhost:4000' },
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
      resolve({ stdout, stderr, code: code || 0 });
    });

    child.on('error', (error) => {
      resolve({ stdout, stderr: `${stderr}\n${error.message}`, code: 1 });
    });
  });
}

describe('CLI - Fase 1', () => {
  beforeAll(async () => {
    await ensureCliIntegrationPrerequisites();
  });

  it('should show version', async () => {
    const result = await runCli(['version']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('0.1.0');
  });

  it('should fail init-session without hypothesis', async () => {
    const result = await runCli(['init-session']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('--hypothesis is required');
  });

  it('should create a new session', async () => {
    const hypothesis = 'CLI test hypothesis - This startup will succeed';
    const result = await runCli(['init-session', '--hypothesis', hypothesis]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('✅ Session created successfully!');
    expect(result.stdout).toContain('Session ID:');
    expect(result.stdout).toContain('Status: created');
    expect(result.stdout).toContain(`thesis upload-doc --session`);
    expect(result.stdout).toContain(`thesis status --session`);
  });

  it('should fail upload-doc without session and file', async () => {
    const result = await runCli(['upload-doc']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('--session is required');
  });

  it('should fail upload-doc with non-existent file', async () => {
    const result = await runCli(['upload-doc', '--session', 'test-id', '--file', '/nonexistent/file.txt']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('File not found');
  });

  it('should fail status without session id', async () => {
    const result = await runCli(['status']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('--session is required');
  });

  describe('Full Flow Integration', () => {
    let sessionId: string;

    it('should create session via CLI', async () => {
      const hypothesis = 'Full flow test hypothesis';
      const result = await runCli(['init-session', '--hypothesis', hypothesis, '--description', 'Testing full CLI flow']);

      expect(result.code).toBe(0);

      const sessionMatch = result.stdout.match(/Session ID:\s+([a-f0-9-]+)/);
      expect(sessionMatch).toBeDefined();
      sessionId = sessionMatch![1];
      expect(sessionId).toMatch(/^[a-f0-9-]{36}$/);
    });

    it('should upload document via CLI', async () => {
      const testContent = 'Test document content for CLI';
      const tempFilePath = `/tmp/cli-test-doc-${Date.now()}.txt`;
      writeFileSync(tempFilePath, testContent);

      const result = await runCli(['upload-doc', '--session', sessionId, '--file', tempFilePath]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('✅ Document uploaded successfully!');
      expect(result.stdout).toContain('Document ID:');
      expect(result.stdout).toContain(`Name: ${path.basename(tempFilePath)}`);
      expect(result.stdout).toContain(`Size: ${testContent.length} bytes`);

      unlinkSync(tempFilePath);
    });

    it('should query status via CLI', async () => {
      const result = await runCli(['status', '--session', sessionId]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('📊 Session Status');
      expect(result.stdout).toContain(`Session ID: ${sessionId}`);
      expect(result.stdout).toContain('Status: created');
      expect(result.stdout).toContain('📝 Hypothesis');
      expect(result.stdout).toContain('Full flow test hypothesis');
      expect(result.stdout).toContain('📄 Documents');
      expect(result.stdout).toMatch(/cli-test-doc-.*\.txt/);
      expect(result.stdout).toContain('📜 Ledger Events');
      expect(result.stdout).toContain('session.created');
      // Note: doc.uploaded not in ledger due to in-memory storage (known debt)
    });
  });
});
