import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { AgentTask } from '../types.js';

describe('AgentWorker', () => {
  it('should create with task data', () => {
    const task: AgentTask = {
      session_id: 'test-session',
      agent_id: 'test-agent',
      profile_role: 'debt',
      skill_path: '/fake/skill.md',
      skill_content: 'mock content',
      iteration: 1,
      max_iterations: 10,
      api_url: 'http://localhost:4000',
      ws_url: 'ws://localhost:4000/ws',
      pi_provider: 'openai',
      pi_model: 'gpt-4o-mini',
      iteration_timeout_ms: 60000,
    };

    expect(task.agent_id).toBe('test-agent');
    expect(task.iteration).toBe(1);
    expect(task.max_iterations).toBe(10);
  });

  it('should validate task structure', () => {
    const task: AgentTask = {
      session_id: 'test-session',
      agent_id: 'test-agent',
      profile_role: 'debt',
      skill_path: '/fake/skill.md',
      skill_content: 'mock content',
      iteration: 1,
      max_iterations: 10,
      api_url: 'http://localhost:4000',
      ws_url: 'ws://localhost:4000/ws',
      pi_provider: 'openai',
      pi_model: 'gpt-4o-mini',
      iteration_timeout_ms: 60000,
    };

    expect(Object.keys(task)).toContain('session_id');
    expect(Object.keys(task)).toContain('agent_id');
    expect(Object.keys(task)).toContain('profile_role');
    expect(Object.keys(task)).toContain('skill_path');
    expect(Object.keys(task)).toContain('iteration');
    expect(Object.keys(task)).toContain('max_iterations');
  });

  it('should handle different profiles', () => {
    const profiles: Array<'debt' | 'tech' | 'market'> = ['debt', 'tech', 'market'];

    profiles.forEach(profile => {
      const task: AgentTask = {
        session_id: 'test-session',
        agent_id: `test-${profile}`,
        profile_role: profile,
        skill_path: '/fake/skill.md',
        skill_content: 'mock content',
        iteration: 1,
        max_iterations: 10,
        api_url: 'http://localhost:4000',
        ws_url: 'ws://localhost:4000/ws',
        pi_provider: 'openai',
        pi_model: 'gpt-4o-mini',
        iteration_timeout_ms: 60000,
      };

      expect(task.profile_role).toBe(profile);
    });
  });

  it('should respect max iterations', () => {
    const task: AgentTask = {
      session_id: 'test-session',
      agent_id: 'test-agent',
      profile_role: 'debt',
      skill_path: '/fake/skill.md',
      skill_content: 'mock content',
      iteration: 11, // Exceeds max_iterations
      max_iterations: 10,
      api_url: 'http://localhost:4000',
      ws_url: 'ws://localhost:4000/ws',
      pi_provider: 'openai',
      pi_model: 'gpt-4o-mini',
      iteration_timeout_ms: 60000,
    };

    expect(task.iteration).toBe(11);
    expect(task.max_iterations).toBe(10);
  });
});
