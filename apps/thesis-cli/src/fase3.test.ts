import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
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

describe('CLI - Fase 3', () => {
  describe('ask command', () => {
    it('should fail without session id', async () => {
      const result = await runCli(['ask']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('--session is required');
    });

    it('should fail without from agent', async () => {
      const result = await runCli(['ask', '--session', 'test-id']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('--from is required');
    });

    it('should fail without to agent', async () => {
      const result = await runCli(['ask', '--session', 'test-id', '--from', 'agent-a']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('--to is required');
    });

    it('should fail without content', async () => {
      const result = await runCli(['ask', '--session', 'test-id', '--from', 'agent-a', '--to', 'agent-b']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('--content is required');
    });
  });

  describe('listen command', () => {
    it('should fail without session id', async () => {
      const result = await runCli(['listen']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('--session is required');
    });

    it('should fail without agent id', async () => {
      const result = await runCli(['listen', '--session', 'test-id']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('--agent is required');
    });

    it('should fail with invalid interval', async () => {
      const result = await runCli(['listen', '--session', 'test-id', '--agent', 'test', '--interval', 'abc']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('--interval must be a positive number');
    });
  });

  describe('Full Flow Integration', () => {
    let sessionId: string;
    let agentAId: string;
    let agentBId: string;

    it('should create session', async () => {
      const result = await runCli(['init-session', '--hypothesis', 'Fase 3 test']);

      expect(result.code).toBe(0);

      const sessionMatch = result.stdout.match(/Session ID:\s+([a-f0-9-]+)/);
      expect(sessionMatch).toBeDefined();
      sessionId = sessionMatch![1];
    });

    it('should join agent A (Debt)', async () => {
      const result = await runCli(['join-session', '--session', sessionId, '--profile', 'debt', '--credits', '50']);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Debt Specialist');

      const agentMatch = result.stdout.match(/Agent ID:\s+([a-f0-9-]+)/);
      expect(agentMatch).toBeDefined();
      agentAId = agentMatch![1];
    });

    it('should join agent B (Tech)', async () => {
      const result = await runCli(['join-session', '--session', sessionId, '--profile', 'tech', '--credits', '50']);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Tech Expert');

      const agentMatch = result.stdout.match(/Agent ID:\s+([a-f0-9-]+)/);
      expect(agentMatch).toBeDefined();
      agentBId = agentMatch![1];
    });

    it('should get status to verify agents joined', async () => {
      const result = await runCli(['status', '--session', sessionId]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Debt Specialist');
      expect(result.stdout).toContain('Tech Expert');
    });

    it('should send message from A to B', async () => {
      const result = await runCli([
        'ask',
        '--session',
        sessionId,
        '--from',
        agentAId,
        '--to',
        agentBId,
        '--content',
        'O que você acha da arquitetura?',
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('✅ Message sent successfully!');
      expect(result.stdout).toContain('Remaining credits: 49');
    });

    it('should fail to send message with insufficient credits', async () => {
      const agentCResult = await runCli(['join-session', '--session', sessionId, '--profile', 'market', '--credits', '1']);
      const agentCMatch = agentCResult.stdout.match(/Agent ID:\s+([a-f0-9-]+)/);
      const agentCId = agentCMatch![1];

      const result1 = await runCli([
        'ask',
        '--session',
        sessionId,
        '--from',
        agentCId,
        '--to',
        agentAId,
        '--content',
        'Mensagem',
      ]);

      expect(result1.code).toBe(0);

      const result2 = await runCli([
        'ask',
        '--session',
        sessionId,
        '--from',
        agentCId,
        '--to',
        agentAId,
        '--content',
        'Sem créditos',
      ]);

      expect(result2.code).toBe(1);
      expect(result2.stderr).toContain('Insufficient credits');
      expect(result2.stderr).toContain('Need 1 credits, have 0');
    });

    it('should fail to send message to self', async () => {
      const result = await runCli([
        'ask',
        '--session',
        sessionId,
        '--from',
        agentAId,
        '--to',
        agentAId,
        '--content',
        'Mensagem para mim mesmo',
      ]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Cannot send message to yourself');
    });
  });

  describe('Budget Validation', () => {
    let sessionId: string;
    let agentAId: string;
    let agentBId: string;

    beforeAll(async () => {
      const sessionResult = await runCli(['init-session', '--hypothesis', 'Budget test']);
      const sessionMatch = sessionResult.stdout.match(/Session ID:\s+([a-f0-9-]+)/);
      sessionId = sessionMatch![1];

      const agentAResult = await runCli(['join-session', '--session', sessionId, '--profile', 'debt', '--credits', '3']);
      const agentAMatch = agentAResult.stdout.match(/Agent ID:\s+([a-f0-9-]+)/);
      agentAId = agentAMatch![1];

      const agentBResult = await runCli(['join-session', '--session', sessionId, '--profile', 'tech', '--credits', '50']);
      const agentBMatch = agentBResult.stdout.match(/Agent ID:\s+([a-f0-9-]+)/);
      agentBId = agentBMatch![1];
    });

    it('should deduct 1 credit per message', async () => {
      const result1 = await runCli([
        'ask',
        '--session',
        sessionId,
        '--from',
        agentAId,
        '--to',
        agentBId,
        '--content',
        'Pergunta 1',
      ]);

      expect(result1.code).toBe(0);

      const statusResult1 = await runCli(['status', '--session', sessionId]);
      const budget1Match = statusResult1.stdout.match(new RegExp(`${agentAId}[^\\n]*\\n\\s*Budget:\\s+(\\d+)`));
      expect(budget1Match).toBeDefined();
      expect(budget1Match![1]).toBe('2'); // 3 inicial - 1 mensagem = 2 créditos

      const result2 = await runCli([
        'ask',
        '--session',
        sessionId,
        '--from',
        agentAId,
        '--to',
        agentBId,
        '--content',
        'Pergunta 2',
      ]);

      expect(result2.code).toBe(0);

      const statusResult2 = await runCli(['status', '--session', sessionId]);
      const budget2Match = statusResult2.stdout.match(new RegExp(`${agentAId}[^\\n]*\\n\\s*Budget:\\s+(\\d+)`));
      expect(budget2Match).toBeDefined();
      expect(budget2Match![1]).toBe('1'); // 2 - 1 mensagem = 1 crédito
    });

    it('should block when credits reach 0', async () => {
      const agentCResult = await runCli(['join-session', '--session', sessionId, '--profile', 'market', '--credits', '1']);
      const agentCMatch = agentCResult.stdout.match(/Agent ID:\s+([a-f0-9-]+)/);
      const agentCId = agentCMatch![1];

      const result1 = await runCli([
        'ask',
        '--session',
        sessionId,
        '--from',
        agentCId,
        '--to',
        agentAId,
        '--content',
        'Última mensagem',
      ]);

      expect(result1.code).toBe(0);

      const result2 = await runCli([
        'ask',
        '--session',
        sessionId,
        '--from',
        agentCId,
        '--to',
        agentAId,
        '--content',
        'Sem créditos',
      ]);

      expect(result2.code).toBe(1);
      expect(result2.stderr).toContain('Insufficient credits');
      expect(result2.stderr).toContain('Need 1 credits, have 0');
    });
  });
});
