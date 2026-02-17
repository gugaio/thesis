import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import { unlinkSync, readFileSync } from 'fs';
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

describe('CLI - Fase 4', () => {
  describe('cast-vote command', () => {
    it('should fail without session id', async () => {
      const result = await runCli(['cast-vote']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('--session is required');
    });

    it('should fail without agent id', async () => {
      const result = await runCli(['cast-vote', '--session', 'test-id']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('--agent is required');
    });

    it('should fail without verdict', async () => {
      const result = await runCli(['cast-vote', '--session', 'test-id', '--agent', 'agent-id']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('--verdict is required');
    });

    it('should fail with invalid verdict', async () => {
      const result = await runCli(['cast-vote', '--session', 'test-id', '--agent', 'agent-id', '--verdict', 'invalid']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Invalid verdict');
    });

    it('should fail without rationale', async () => {
      const result = await runCli(['cast-vote', '--session', 'test-id', '--agent', 'agent-id', '--verdict', 'approve']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('--rationale is required');
    });
  });

  describe('close-session command', () => {
    it('should fail without session id', async () => {
      const result = await runCli(['close-session']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('--session is required');
    });

    it('should fail without verdict', async () => {
      const result = await runCli(['close-session', '--session', 'test-id']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('--verdict is required');
    });

    it('should fail with invalid verdict (abstain not allowed)', async () => {
      const result = await runCli(['close-session', '--session', 'test-id', '--verdict', 'abstain']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Available verdicts: approve, reject');
    });
  });

  describe('generate-report command', () => {
    it('should fail without session id', async () => {
      const result = await runCli(['generate-report']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('--session is required');
    });
  });

  describe('Full Flow Integration', () => {
    let sessionId: string;
    let agentAId: string;
    let agentBId: string;
    let agentCId: string;
    let tempReportPath: string;

    beforeAll(async () => {
      tempReportPath = `/tmp/fase4-report-${Date.now()}.json`;
    });

    afterAll(async () => {
      try {
        unlinkSync(tempReportPath);
      } catch (e) {
        void e;
      }
    });

    it('should create session', async () => {
      const result = await runCli(['init-session', '--hypothesis', 'Fase 4 test']);

      expect(result.code).toBe(0);

      const sessionMatch = result.stdout.match(/Session ID:\s+([a-f0-9-]+)/);
      expect(sessionMatch).toBeDefined();
      sessionId = sessionMatch![1];
    });

    it('should join three agents', async () => {
      const agentAResult = await runCli(['join-session', '--session', sessionId, '--profile', 'debt', '--credits', '50']);
      const agentAMatch = agentAResult.stdout.match(/Agent ID:\s+([a-f0-9-]+)/);
      agentAId = agentAMatch![1];

      const agentBResult = await runCli(['join-session', '--session', sessionId, '--profile', 'tech', '--credits', '50']);
      const agentBMatch = agentBResult.stdout.match(/Agent ID:\s+([a-f0-9-]+)/);
      agentBId = agentBMatch![1];

      const agentCResult = await runCli(['join-session', '--session', sessionId, '--profile', 'market', '--credits', '50']);
      const agentCMatch = agentCResult.stdout.match(/Agent ID:\s+([a-f0-9-]+)/);
      agentCId = agentCMatch![1];
    });

    it('should cast votes from all agents', async () => {
      const voteAResult = await runCli([
        'cast-vote',
        '--session',
        sessionId,
        '--agent',
        agentAId,
        '--verdict',
        'approve',
        '--rationale',
        'Strong financial fundamentals',
      ]);

      expect(voteAResult.code).toBe(0);
      expect(voteAResult.stdout).toContain('✅ Vote cast successfully!');

      const voteBResult = await runCli([
        'cast-vote',
        '--session',
        sessionId,
        '--agent',
        agentBId,
        '--verdict',
        'approve',
        '--rationale',
        'Solid technical architecture',
      ]);

      expect(voteBResult.code).toBe(0);

      const voteCResult = await runCli([
        'cast-vote',
        '--session',
        sessionId,
        '--agent',
        agentCId,
        '--verdict',
        'abstain',
        '--rationale',
        'Need more market data',
      ]);

      expect(voteCResult.code).toBe(0);
    });

    it('should not allow duplicate votes', async () => {
      const result = await runCli([
        'cast-vote',
        '--session',
        sessionId,
        '--agent',
        agentAId,
        '--verdict',
        'reject',
        '--rationale',
        'Trying to vote again',
      ]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain('already voted');
    });

    it('should generate report before closing', async () => {
      const result = await runCli(['generate-report', '--session', sessionId, '--output', tempReportPath]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('✅ Report generated successfully!');
      expect(result.stdout).toContain(`Output: ${tempReportPath}`);
      expect(result.stdout).toContain('Votes: 3');

      const report = JSON.parse(readFileSync(tempReportPath, 'utf-8'));
      expect(report.session.id).toBe(sessionId);
      expect(report.session.status).toBe('created');
      expect(report.votes).toHaveLength(3);
      expect(report.voteCounts.approve).toBe(2);
      expect(report.voteCounts.reject).toBe(0);
      expect(report.voteCounts.abstain).toBe(1);
    });

    it('should close session with final verdict', async () => {
      const result = await runCli([
        'close-session',
        '--session',
        sessionId,
        '--verdict',
        'approve',
        '--rationale',
        'Majority approved with strong rationale',
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('✅ Session closed successfully!');
      expect(result.stdout).toContain('Status: closed');
      expect(result.stdout).toContain('Final Verdict: approve');
    });

    it('should not allow voting on closed session', async () => {
      const result = await runCli([
        'cast-vote',
        '--session',
        sessionId,
        '--agent',
        agentAId,
        '--verdict',
        'reject',
        '--rationale',
        'Trying to vote on closed session',
      ]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain('already closed');
    });

    it('should not allow closing already closed session', async () => {
      const result = await runCli([
        'close-session',
        '--session',
        sessionId,
        '--verdict',
        'reject',
      ]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain('already closed');
    });

    it('should generate final report with rankings', async () => {
      const result = await runCli(['generate-report', '--session', sessionId, '--output', tempReportPath]);

      expect(result.code).toBe(0);

      const report = JSON.parse(readFileSync(tempReportPath, 'utf-8'));
      expect(report.session.status).toBe('closed');
      expect(report.session.finalVerdict).toBe('approve');
      expect(report.session.closedAt).toBeDefined();
      expect(report.rankings).toHaveLength(3);
      expect(report.rankings[0].score).toBeGreaterThan(0);
    });
  });

  describe('Vote Counting', () => {
    let sessionId: string;
    const agents: string[] = [];

    beforeAll(async () => {
      const sessionResult = await runCli(['init-session', '--hypothesis', 'Vote counting test']);
      const sessionMatch = sessionResult.stdout.match(/Session ID:\s+([a-f0-9-]+)/);
      sessionId = sessionMatch![1];

      const profiles = ['debt', 'tech', 'market'];
      for (let i = 0; i < 3; i++) {
        const profile = profiles[i];
        const agentResult = await runCli(['join-session', '--session', sessionId, '--profile', profile]);
        const agentMatch = agentResult.stdout.match(/Agent ID:\s+([a-f0-9-]+)/);
        agents.push(agentMatch![1]);
      }
    });

    it('should count votes correctly', async () => {
      await runCli(['cast-vote', '--session', sessionId, '--agent', agents[0], '--verdict', 'approve', '--rationale', 'A1']);
      await runCli(['cast-vote', '--session', sessionId, '--agent', agents[1], '--verdict', 'approve', '--rationale', 'A2']);
      await runCli(['cast-vote', '--session', sessionId, '--agent', agents[2], '--verdict', 'reject', '--rationale', 'R1']);

      const reportPath = `/tmp/fase4-votecount-${Date.now()}.json`;
      const result = await runCli(['generate-report', '--session', sessionId, '--output', reportPath]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain('(2 approve, 1 reject, 0 abstain)');

      const report = JSON.parse(readFileSync(reportPath, 'utf-8'));
      expect(report.voteCounts.approve).toBe(2);
      expect(report.voteCounts.reject).toBe(1);
      expect(report.voteCounts.abstain).toBe(0);

      unlinkSync(reportPath);
    });
  });

  describe('Ranking Calculation', () => {
    let sessionId: string;
    let agentAId: string;
    let agentBId: string;

    it('should update rankings based on correct votes', async () => {
      const sessionResult = await runCli(['init-session', '--hypothesis', 'Ranking test']);
      const sessionMatch = sessionResult.stdout.match(/Session ID:\s+([a-f0-9-]+)/);
      sessionId = sessionMatch![1];

      const agentAResult = await runCli(['join-session', '--session', sessionId, '--profile', 'debt']);
      const agentAMatch = agentAResult.stdout.match(/Agent ID:\s+([a-f0-9-]+)/);
      agentAId = agentAMatch![1];

      const agentBResult = await runCli(['join-session', '--session', sessionId, '--profile', 'tech']);
      const agentBMatch = agentBResult.stdout.match(/Agent ID:\s+([a-f0-9-]+)/);
      agentBId = agentBMatch![1];

      await runCli(['cast-vote', '--session', sessionId, '--agent', agentAId, '--verdict', 'approve', '--rationale', 'Correct']);
      await runCli(['cast-vote', '--session', sessionId, '--agent', agentBId, '--verdict', 'reject', '--rationale', 'Wrong']);

      await runCli(['close-session', '--session', sessionId, '--verdict', 'approve']);

      const reportPath = `/tmp/fase4-ranking-${Date.now()}.json`;
      await runCli(['generate-report', '--session', sessionId, '--output', reportPath]);

      const report = JSON.parse(readFileSync(reportPath, 'utf-8'));
      const rankingA = report.rankings.find((r: any) => r.agentId === agentAId);
      const rankingB = report.rankings.find((r: any) => r.agentId === agentBId);

      expect(rankingA).toBeDefined();
      expect(rankingB).toBeDefined();
      expect(rankingA.correctVotes).toBe(1);
      expect(rankingB.correctVotes).toBe(0);
      expect(rankingA.score).toBeGreaterThan(rankingB.score);

      unlinkSync(reportPath);
    });
  });
});
