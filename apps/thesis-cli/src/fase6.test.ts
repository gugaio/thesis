import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('Fase 6 - Integration Tests', () => {
  describe('Gateway Integration', () => {
    it('should build gateway successfully', async () => {
      const { stdout, stderr } = await execAsync('pnpm --filter @thesis/gateway build');

      expect(stderr).not.toContain('error');
      expect(stderr).not.toContain('Error');
    });

    it('should have gateway index.js built', async () => {
      const fs = (await import('fs')).default;
      const exists = fs.existsSync('apps/thesis-gateway/dist/index.js');

      expect(exists).toBe(true);
    });
  });

  describe('CLI Integration', () => {
    it('should build CLI successfully', async () => {
      const { stdout, stderr } = await execAsync('pnpm --filter @thesis/cli build');

      expect(stderr).not.toContain('error');
      expect(stderr).not.toContain('Error');
    });

    it('should have analyze command', async () => {
      const { stdout } = await execAsync('node apps/thesis-cli/dist/index.js analyze --help');

      expect(stdout).toContain('analyze');
      expect(stdout).toContain('Run automated multi-agent analysis');
    });

    it('should require session ID for analyze', async () => {
      try {
        await execAsync('node apps/thesis-cli/dist/index.js analyze');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.stderr || error.message).toContain('--session');
      }
    });
  });

  describe('Agent Runtime Integration', () => {
    it('should build agent runtime successfully', async () => {
      const { stdout, stderr } = await execAsync('pnpm --filter thesis-agent-runtime build');

      expect(stderr).not.toContain('error');
      expect(stderr).not.toContain('Error');
    });

    it('should have agent-worker.js built', async () => {
      const fs = (await import('fs')).default;
      const exists = fs.existsSync('apps/thesis-agent-runtime/dist/agent-worker.js');

      expect(exists).toBe(true);
    });
  });

  describe('Package Integration', () => {
    it('should build prompt-adapter successfully', async () => {
      const { stdout, stderr } = await execAsync('pnpm --filter @thesis/prompt-adapter build');

      expect(stderr).not.toContain('error');
      expect(stderr).not.toContain('Error');
    });

    it('should build tools successfully', async () => {
      const { stdout, stderr } = await execAsync('pnpm --filter @thesis/tools build');

      expect(stderr).not.toContain('error');
      expect(stderr).not.toContain('Error');
    });

    it('should have SOUL.md file', async () => {
      const fs = (await import('fs')).default;
      const exists = fs.existsSync('packages/skills/SOUL.md');

      expect(exists).toBe(true);
    });
  });

  describe('End-to-End Flow', () => {
    it('should have all required components', async () => {
      const fs = (await import('fs')).default;

      const requiredFiles = [
        'packages/skills/SOUL.md',
        'packages/prompt-adapter/dist/index.js',
        'packages/tools/dist/index.js',
        'apps/thesis-agent-runtime/dist/agent-worker.js',
        'apps/thesis-gateway/dist/index.js',
        'apps/thesis-cli/dist/index.js'
      ];

      for (const file of requiredFiles) {
        const exists = fs.existsSync(file);
        expect(exists).toBe(true);
      }
    });

    it('should have updated docker-compose.yml with orchestrator', async () => {
      const fs = (await import('fs')).default;
      const content = fs.readFileSync('docker-compose.yml', 'utf-8');

      expect(content).toContain('orchestrator:');
      expect(content).toContain('MAX_CONCURRENT_AGENTS=3');
      expect(content).toContain('MAX_ITERATIONS=10');
    });
  });
});
