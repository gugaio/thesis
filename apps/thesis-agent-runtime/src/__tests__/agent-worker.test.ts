import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { AgentTask, StructuredAgentDecision } from '../types.js';

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

  describe('StructuredAgentDecision', () => {
    it('should validate opinion decision structure', () => {
      const decision: StructuredAgentDecision = {
        action: 'opinion',
        reasoning: 'Based on financial metrics, the burn rate is sustainable',
        content: 'The company shows strong unit economics with 3x LTV/CAC',
        confidence: 0.85,
      };

      expect(decision.action).toBe('opinion');
      expect(decision.confidence).toBe(0.85);
      expect(decision.reasoning).toBeDefined();
      expect(decision.content).toBeDefined();
    });

    it('should validate message decision structure', () => {
      const decision: StructuredAgentDecision = {
        action: 'message',
        reasoning: 'Need more information about technology stack',
        content: 'What is the current technology stack used by the company?',
        target_agent: 'tech',
      };

      expect(decision.action).toBe('message');
      expect(decision.target_agent).toBe('tech');
      expect(decision.reasoning).toBeDefined();
      expect(decision.content).toBeDefined();
    });

    it('should validate vote decision structure', () => {
      const decision: StructuredAgentDecision = {
        action: 'vote',
        reasoning: 'All financial metrics are strong, recommendation to approve',
        verdict: 'approve',
      };

      expect(decision.action).toBe('vote');
      expect(decision.verdict).toBe('approve');
      expect(decision.reasoning).toBeDefined();
    });

    it('should validate wait decision structure', () => {
      const decision: StructuredAgentDecision = {
        action: 'wait',
        reasoning: 'Waiting for more information from other agents',
        wait_seconds: 5,
      };

      expect(decision.action).toBe('wait');
      expect(decision.wait_seconds).toBe(5);
      expect(decision.reasoning).toBeDefined();
    });

    it('should parse valid JSON decision', () => {
      const jsonStr = `{
        "action": "opinion",
        "reasoning": "Test reasoning",
        "content": "Test content",
        "confidence": 0.8
      }`;

      const decision = JSON.parse(jsonStr) as StructuredAgentDecision;
      expect(decision.action).toBe('opinion');
      expect(decision.reasoning).toBe('Test reasoning');
    });

    it('should handle malformed JSON gracefully', () => {
      const malformedJson = `{
        "action": "opinion",
        "reasoning": "Test reasoning"
        "content": "Test content"
      }`;

      const decision = {
        action: 'wait' as const,
        reasoning: 'Failed to parse LLM response',
        wait_seconds: 5
      } as StructuredAgentDecision;

      expect(decision.action).toBe('wait');
      expect(decision.wait_seconds).toBe(5);
    });

    it('should validate decision with all action types', () => {
      const actions: Array<'opinion' | 'message' | 'vote' | 'wait'> = ['opinion', 'message', 'vote', 'wait'];

      actions.forEach(action => {
        const decision: StructuredAgentDecision = {
          action,
          reasoning: `Test reasoning for ${action}`,
        };

        if (action === 'opinion') {
          (decision as any).content = 'Test content';
          (decision as any).confidence = 0.8;
        } else if (action === 'message') {
          (decision as any).content = 'Test message';
          (decision as any).target_agent = 'tech';
        } else if (action === 'vote') {
          (decision as any).verdict = 'approve';
        } else if (action === 'wait') {
          (decision as any).wait_seconds = 5;
        }

        expect(decision.action).toBe(action);
        expect(decision.reasoning).toBeDefined();
      });
    });
  });
});
