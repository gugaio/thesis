import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import path from 'path';

const CLI_PATH = path.join(__dirname, '../dist/index.js');
const NODE = process.execPath;

function runCli(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
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

    child.on('error', reject);
  });
}

describe('CLI - Fase 2', () => {
  describe('join-session', () => {
    it('should fail without session id', async () => {
      const result = await runCli(['join-session']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('--session is required');
    });

    it('should fail without profile', async () => {
      const result = await runCli(['join-session', '--session', 'test-id']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('--profile is required');
    });

    it('should fail with invalid profile', async () => {
      const result = await runCli(['join-session', '--session', 'test-id', '--profile', 'invalid']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Invalid profile');
    });
  });

  describe('post-opinion', () => {
    it('should fail without session id', async () => {
      const result = await runCli(['post-opinion']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('--session is required');
    });

    it('should fail without agent id', async () => {
      const result = await runCli(['post-opinion', '--session', 'test-id']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('--agent is required');
    });

    it('should fail without content', async () => {
      const result = await runCli(['post-opinion', '--session', 'test-id', '--agent', 'agent-id']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('--content is required');
    });

    it('should fail with invalid confidence', async () => {
      const result = await runCli(['post-opinion', '--session', 'test-id', '--agent', 'agent-id', '--content', 'test', '--confidence', '2']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('--confidence must be between 0 and 1');
    });
  });

  describe('Full Flow Integration', () => {
    let sessionId: string;
    let agentId: string;

    it('should create session via CLI', async () => {
      const result = await runCli([
        'init-session',
        '--hypothesis',
        'Fase 2 test hypothesis',
        '--description',
        'Testing join and opinion',
      ]);

      expect(result.code).toBe(0);

      const sessionMatch = result.stdout.match(/Session ID:\s+([a-f0-9-]+)/);
      expect(sessionMatch).toBeDefined();
      sessionId = sessionMatch![1];
    });

    it('should upload document via CLI', async () => {
      const testContent = 'Test document for Fase 2';
      const tempFilePath = `/tmp/fase2-test-doc-${Date.now()}.txt`;
      writeFileSync(tempFilePath, testContent);

      const result = await runCli(['upload-doc', '--session', sessionId, '--file', tempFilePath]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('✅ Document uploaded successfully!');

      unlinkSync(tempFilePath);
    });

    it('should join session with debt profile', async () => {
      const result = await runCli(['join-session', '--session', sessionId, '--profile', 'debt', '--credits', '50']);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('✅ Agent joined session successfully!');
      expect(result.stdout).toContain('Debt Specialist');

      const agentMatch = result.stdout.match(/Agent ID:\s+([a-f0-9-]+)/);
      expect(agentMatch).toBeDefined();
      agentId = agentMatch![1];
    });

    it('should post opinion via CLI', async () => {
      const result = await runCli([
        'post-opinion',
        '--session',
        sessionId,
        '--agent',
        agentId,
        '--content',
        'This looks like a promising startup with solid unit economics.',
        '--confidence',
        '0.8',
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('✅ Opinion posted successfully!');
      expect(result.stdout).toContain('This looks like a promising startup');
    });

    it('should query status and show agents and opinions', async () => {
      const result = await runCli(['status', '--session', sessionId]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('📊 Session Status');
      expect(result.stdout).toContain('🤖 Agents');
      expect(result.stdout).toContain('Debt Specialist');
      expect(result.stdout).toContain('💬 Opinions');
      expect(result.stdout).toContain('This looks like a promising startup');
    });
  });

  describe('Multiple Agents', () => {
    let sessionId: string;
    let debtAgentId: string;
    let techAgentId: string;

    it('should create session', async () => {
      const result = await runCli(['init-session', '--hypothesis', 'Multiple agents test']);

      expect(result.code).toBe(0);

      const sessionMatch = result.stdout.match(/Session ID:\s+([a-f0-9-]+)/);
      expect(sessionMatch).toBeDefined();
      sessionId = sessionMatch![1];
    });

    it('should join with debt specialist', async () => {
      const result = await runCli(['join-session', '--session', sessionId, '--profile', 'debt']);

      expect(result.code).toBe(0);

      const agentMatch = result.stdout.match(/Agent ID:\s+([a-f0-9-]+)/);
      expect(agentMatch).toBeDefined();
      debtAgentId = agentMatch![1];
    });

    it('should join with tech expert', async () => {
      const result = await runCli(['join-session', '--session', sessionId, '--profile', 'tech']);

      expect(result.code).toBe(0);

      const agentMatch = result.stdout.match(/Agent ID:\s+([a-f0-9-]+)/);
      expect(agentMatch).toBeDefined();
      techAgentId = agentMatch![1];
    });

    it('should post opinion from debt agent', async () => {
      const result = await runCli([
        'post-opinion',
        '--session',
        sessionId,
        '--agent',
        debtAgentId,
        '--content',
        'Strong financial metrics, good runway.',
        '--confidence',
        '0.9',
      ]);

      expect(result.code).toBe(0);
    });

    it('should post opinion from tech agent', async () => {
      const result = await runCli([
        'post-opinion',
        '--session',
        sessionId,
        '--agent',
        techAgentId,
        '--content',
        'Modern stack, scalable architecture.',
        '--confidence',
        '0.85',
      ]);

      expect(result.code).toBe(0);
    });

    it('should show both agents and opinions in status', async () => {
      const result = await runCli(['status', '--session', sessionId]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Debt Specialist');
      expect(result.stdout).toContain('Tech Expert');
      expect(result.stdout).toContain('Strong financial metrics');
      expect(result.stdout).toContain('Modern stack');
    });
  });
});
