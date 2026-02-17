import type { AgentRole } from '@thesis/skills';
import { AGENTS_CONFIG } from '@thesis/skills';

export interface AgentResult {
  agent_id: string;
  iteration: number;
  action: 'opinion' | 'message' | 'vote' | 'wait';
  content?: string;
  confidence?: number;
  target_agent?: AgentRole;
  verdict?: 'approve' | 'reject' | 'abstain';
  wait_seconds?: number;
  reasoning?: string;
}

export interface MockAgentConfig {
  profile: AgentRole;
  initialOpinion?: boolean;
  sendMessage?: boolean;
  voteVerdict?: 'approve' | 'reject' | 'abstain';
  errorOnIteration?: number;
}

export class MockAgentWorker {
  private config: MockAgentConfig;
  private currentIteration = 0;

  constructor(config: MockAgentConfig) {
    this.config = config;
  }

  simulateIteration(agentId: string): AgentResult {
    const iteration = ++this.currentIteration;

    if (this.config.errorOnIteration && iteration === this.config.errorOnIteration) {
      throw new Error(`Mock error on iteration ${iteration}`);
    }

    if (iteration === 1 && this.config.initialOpinion !== false) {
      return this.createOpinionResult(agentId, iteration);
    }

    if (iteration === 2 && this.config.sendMessage !== false) {
      return this.createMessageResult(agentId, iteration);
    }

    if (iteration >= 3) {
      return this.createVoteResult(agentId, iteration);
    }

    return this.createWaitResult(agentId, iteration);
  }

  private createOpinionResult(agentId: string, iteration: number): AgentResult {
    const profile = this.config.profile;
    const content = this.getProfileOpinionContent(profile);
    
    return {
      agent_id: agentId,
      iteration,
      action: 'opinion',
      content,
      confidence: 0.8,
      reasoning: `Initial analysis as ${profile} specialist - iteration ${iteration}`
    };
  }

  private createMessageResult(agentId: string, iteration: number): AgentResult {
    const profile = this.config.profile;
    const targetAgent = this.getTargetAgent(profile);
    const content = this.getProfileMessageContent(profile, targetAgent);
    
    return {
      agent_id: agentId,
      iteration,
      action: 'message',
      target_agent: targetAgent,
      content,
      reasoning: `Need more information from ${targetAgent} - iteration ${iteration}`
    };
  }

  private createVoteResult(agentId: string, iteration: number): AgentResult {
    const verdict = this.config.voteVerdict || 'approve';
    const rationale = this.getVoteRationale(verdict, this.config.profile);
    
    return {
      agent_id: agentId,
      iteration,
      action: 'vote',
      verdict,
      reasoning: rationale
    };
  }

  private createWaitResult(agentId: string, iteration: number): AgentResult {
    return {
      agent_id: agentId,
      iteration,
      action: 'wait',
      wait_seconds: 2,
      reasoning: `Waiting for more information - iteration ${iteration}`
    };
  }

  private getProfileOpinionContent(profile: AgentRole): string {
    switch (profile) {
      case 'debt':
        return 'Financial metrics look promising with healthy burn rate and runway. Unit economics show positive signs of scalability.';
      case 'tech':
        return 'Technical architecture is solid with modern stack. Code quality appears good and team shows strong engineering capabilities.';
      case 'market':
        return 'Market opportunity is significant with clear product-market fit. Competition landscape is manageable with proper differentiation.';
    }
    return `Analysis from ${profile} specialist`;
  }

  private getTargetAgent(profile: AgentRole): AgentRole {
    switch (profile) {
      case 'debt':
        return 'tech';
      case 'tech':
        return 'market';
      case 'market':
        return 'debt';
    }
    return 'debt';
  }

  private getProfileMessageContent(profile: AgentRole, target: AgentRole): string {
    const questions: Record<string, Record<string, string>> = {
      debt: {
        tech: 'What are the key technical risks or debt that might impact scalability and costs?',
        market: 'How do you see the market dynamics affecting revenue growth projections?'
      },
      tech: {
        market: 'What are the key customer requirements that might require significant technical investment?',
        debt: 'What are the financial constraints that might limit technical investment?'
      },
      market: {
        debt: 'What are the financial metrics that support market expansion strategy?',
        tech: 'What technical capabilities give us competitive advantage in the market?'
      }
    };
    return questions[profile][target];
  }

  private getVoteRationale(verdict: 'approve' | 'reject' | 'abstain', profile: AgentRole): string {
    if (verdict === 'approve') {
      return `Based on ${profile} analysis, the opportunity meets our criteria for investment recommendation.`;
    } else if (verdict === 'reject') {
      return `Based on ${profile} analysis, there are significant concerns that prevent a positive recommendation.`;
    } else {
      return `Based on ${profile} analysis, we need more information to make a definitive recommendation.`;
    }
  }

  reset(): void {
    this.currentIteration = 0;
  }
}

export function createMockAgentWorkers(): Map<string, MockAgentWorker> {
  const mockWorkers = new Map<string, MockAgentWorker>();
  
  for (const config of AGENTS_CONFIG) {
    mockWorkers.set(config.role as AgentRole, new MockAgentWorker({ 
      profile: config.role as AgentRole,
      voteVerdict: 'approve'
    }));
  }
  
  return mockWorkers;
}

export function simulateIterationForAllAgents(
  mockWorkers: Map<string, MockAgentWorker>,
  agentIds: Map<string, string>
): AgentResult[] {
  const results: AgentResult[] = [];
  
  for (const [profile, worker] of mockWorkers.entries()) {
    const agentId = agentIds.get(profile);
    if (agentId) {
      const result = worker.simulateIteration(agentId);
      results.push(result);
    }
  }
  
  return results;
}
