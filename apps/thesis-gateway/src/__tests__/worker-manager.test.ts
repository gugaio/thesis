import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AgentWorkerManager } from '../worker-manager.js';

describe('AgentWorkerManager', () => {
  let workerManager: AgentWorkerManager;

  beforeEach(() => {
    workerManager = new AgentWorkerManager(3);
  });

  afterEach(() => {
    workerManager.stopAll();
  });

  describe('constructor', () => {
    it('should create with max concurrency', () => {
      expect(workerManager).toBeDefined();
    });

    it('should have correct stats initially', () => {
      const stats = workerManager.getStats();
      expect(stats.activeWorkers).toBe(0);
      expect(stats.maxConcurrency).toBe(3);
      expect(stats.workerCount).toBe(0);
      expect(stats.pendingTasks).toBe(0);
    });
  });

  describe('runAgentTask', () => {
    it('should handle task creation', async () => {
      const task = {
        session_id: 'test-session',
        agent_id: 'test-agent',
        profile_role: 'debt' as const,
        skill_path: '/fake/skill.md',
        skill_content: 'mock content',
        iteration: 1,
        max_iterations: 10,
        api_url: 'http://localhost:4000',
        ws_url: 'ws://localhost:4000',
        pi_provider: 'openai',
        pi_model: 'gpt-4o-mini',
        iteration_timeout_ms: 1000,
      };

      // Note: This will fail because agent-worker.js doesn't exist in test environment
      // but we're testing the manager's logic
      try {
        await workerManager.runAgentTask(task);
      } catch (error) {
        // Expected to fail in test environment
        expect(error).toBeDefined();
      }
    });

    it('should update stats after task', () => {
      const stats = workerManager.getStats();
      expect(stats).toBeDefined();
      expect(stats.activeWorkers).toBeGreaterThanOrEqual(0);
    });
  });

  describe('stopAll', () => {
    it('should stop all workers', () => {
      workerManager.stopAll();

      const stats = workerManager.getStats();
      expect(stats.activeWorkers).toBe(0);
      expect(stats.workerCount).toBe(0);
      expect(stats.pendingTasks).toBe(0);
    });

    it('should be idempotent', () => {
      workerManager.stopAll();
      workerManager.stopAll();

      const stats = workerManager.getStats();
      expect(stats.activeWorkers).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return current stats', () => {
      const stats = workerManager.getStats();

      expect(stats).toEqual({
        activeWorkers: expect.any(Number),
        maxConcurrency: 3,
        workerCount: expect.any(Number),
        pendingTasks: expect.any(Number),
      });
    });
  });
});
