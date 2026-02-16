import { describe, it, expect } from 'vitest';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../..');

describe('Fase 6 - Integration Tests', () => {
  describe('Gateway Integration', () => {
    it('should build gateway successfully', async () => {
      const { exec } = await import('child_process');
      const { stdout, stderr } = exec('pnpm --filter @thesis/gateway build');
      
      expect(stderr).not.toContain('error');
      expect(stderr).not.toContain('Error');
    });

    it('should have gateway index.js built', async () => {
      const fs = await import('fs');
      const exists = fs.existsSync(path.join(PROJECT_ROOT, 'apps/thesis-gateway/dist/index.js'));
      
      expect(exists).toBe(true);
    });
  });

  describe('CLI Integration', () => {
    it('should build CLI successfully', async () => {
      const { exec } = await import('child_process');
      const { stdout, stderr } = exec('pnpm --filter @thesis/cli build');
      
      expect(stderr).not.toContain('error');
      expect(stderr).not.toContain('Error');
    });
  });

  describe('Agent Runtime Integration', () => {
    it('should build agent runtime successfully', async () => {
      const { exec } = await import('child_process');
      const { stdout, stderr } = exec('pnpm --filter thesis-agent-runtime build');
      
      expect(stderr).not.toContain('error');
      expect(stderr).not.toContain('Error');
    });

    it('should have agent-worker.js built', async () => {
      const fs = await import('fs');
      const exists = fs.existsSync(path.join(PROJECT_ROOT, 'apps/thesis-agent-runtime/dist/agent-worker.js'));
      
      expect(exists).toBe(true);
    });
  });

  describe('Package Integration', () => {
    it('should build prompt-adapter successfully', async () => {
      const { exec } = await import('child_process');
      const { stdout, stderr } = exec('pnpm --filter @thesis/prompt-adapter build');
      
      expect(stderr).not.toContain('error');
      expect(stderr).not.toContain('Error');
    });

    it('should build tools successfully', async () => {
      const { exec } = await import('child_process');
      const { stdout, stderr } = exec('pnpm --filter @thesis/tools build');
      
      expect(stderr).not.toContain('error');
      expect(stderr).not.toContain('Error');
    });

    it('should have SOUL.md file', async () => {
      const fs = await import('fs');
      const exists = fs.existsSync(path.join(PROJECT_ROOT, 'packages/skills/SOUL.md'));
      
      expect(exists).toBe(true);
    });
  });

  describe('End-to-End Flow', () => {
    it('should have all required components', async () => {
      const fs = await import('fs');
      
      const requiredFiles = [
        path.join(PROJECT_ROOT, 'packages/skills/SOUL.md'),
        path.join(PROJECT_ROOT, 'packages/prompt-adapter/dist/index.js'),
        path.join(PROJECT_ROOT, 'packages/tools/dist/index.js'),
        path.join(PROJECT_ROOT, 'apps/thesis-agent-runtime/dist/agent-worker.js'),
        path.join(PROJECT_ROOT, 'apps/thesis-gateway/dist/index.js'),
        path.join(PROJECT_ROOT, 'apps/thesis-cli/dist/index.js')
      ];
      
      for (const file of requiredFiles) {
        const exists = fs.existsSync(file);
        expect(exists).toBe(true);
      }
    });

    it('should have updated docker-compose.yml with orchestrator', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync(path.join(PROJECT_ROOT, 'docker-compose.yml'), 'utf-8');
      
      expect(content).toContain('orchestrator:');
      expect(content).toContain('MAX_CONCURRENT_AGENTS=3');
      expect(content).toContain('MAX_ITERATIONS=10');
    });
  });
});
