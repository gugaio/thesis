import { describe, it, expect } from 'vitest';
import { BashToolExecutor } from '../bash-tool.js';
import type { ToolConfig } from '../types.js';

describe('BashToolExecutor', () => {
  describe('execute', () => {
    it('should execute simple command successfully', async () => {
      const executor = new BashToolExecutor();
      const config: ToolConfig = {
        name: 'ls',
        description: 'List directory',
        allowed: true,
        timeoutMs: 5000,
        maxOutputBytes: 10240
      };

      const result = await executor.execute('ls /tmp', config);

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBeDefined();
      expect(result.timedOut).toBe(false);
    });

    it('should fail with invalid command', async () => {
      const executor = new BashToolExecutor();
      const config: ToolConfig = {
        name: 'invalid',
        description: 'Invalid tool',
        allowed: true,
        timeoutMs: 5000,
        maxOutputBytes: 1024
      };

      const result = await executor.execute('nonexistentcommand', config);

      expect(result.success).toBe(false);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr.length).toBeGreaterThan(0);
    });

    it('should timeout on long running command', async () => {
      const executor = new BashToolExecutor();
      const config: ToolConfig = {
        name: 'sleep',
        description: 'Sleep tool',
        allowed: true,
        timeoutMs: 100,
        maxOutputBytes: 1024
      };

      const result = await executor.execute('sleep 10', config);

      expect(result.timedOut).toBe(true);
      expect(result.success).toBe(false);
      expect(result.stderr.toLowerCase()).toContain('timed out');
      expect(result.durationMs).toBeLessThan(200);
    });

    it('should truncate large output', async () => {
      const executor = new BashToolExecutor();
      const config: ToolConfig = {
        name: 'echo',
        description: 'Echo tool',
        allowed: true,
        timeoutMs: 5000,
        maxOutputBytes: 10
      };

      const result = await executor.execute('echo "this is a long output that should be truncated"', config);

      expect(result.stdout).toContain('[Output truncated]');
    });
  });

  describe('execution logs', () => {
    it('should log executions', async () => {
      const executor = new BashToolExecutor();
      const config: ToolConfig = {
        name: 'echo',
        description: 'Echo tool',
        allowed: true,
        timeoutMs: 5000,
        maxOutputBytes: 1024
      };

      await executor.execute('echo "test"', config);
      await executor.execute('echo "test2"', config);

      const logs = executor.getExecutionLogs();

      expect(logs.length).toBe(2);
      expect(logs[0].toolName).toBe('echo');
      expect(logs[0].command).toBe('echo "test"');
      expect(logs[0].success).toBe(true);
    });

    it('should clear logs', async () => {
      const executor = new BashToolExecutor();
      const config: ToolConfig = {
        name: 'echo',
        description: 'Echo tool',
        allowed: true,
        timeoutMs: 5000,
        maxOutputBytes: 1024
      };

      await executor.execute('echo "test"', config);
      executor.clearLogs();

      const logs = executor.getExecutionLogs();

      expect(logs.length).toBe(0);
    });
  });
});
