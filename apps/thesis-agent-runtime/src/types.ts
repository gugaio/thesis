import type { AgentRole } from '@thesis/skills';

export type AgentProfile = AgentRole;

// Session status from thesis API
export interface ThesisSession {
  id: string;
  status: 'created' | 'active' | 'paused' | 'closed';
  hypothesis: string;
  hypothesis_description?: string;
  documents: Document[];
  agents: SessionAgent[];
  created_at: Date;
  updated_at: Date;
  closed_at?: Date;
  final_verdict?: 'approve' | 'reject' | 'abstain';
}

export interface Document {
  id: string;
  session_id: string;
  name: string;
  type: string;
  size: number;
  content_hash: string;
  uploaded_at: Date;
}

export interface SessionAgent {
  id: string;
  session_id: string;
  profile_role: string;
  profile_name?: string;
  joined_at: Date;
  is_active: boolean;
  budget: {
    credits: number;
    max_credits: number;
    last_refill: Date;
  };
}

// Agent actions
export interface AgentOpinion {
  session_id: string;
  agent_id: string;
  content: string;
  confidence: number;
  created_at: Date;
}

export interface AgentMessage {
  session_id: string;
  id: string;
  from_agent_id: string;
  to_agent_id: string;
  content: string;
  created_at: Date;
}

export interface AgentVote {
  session_id: string;
  id: string;
  agent_id: string;
  verdict: 'approve' | 'reject' | 'abstain';
  created_at: Date;
}

// Worker thread communication
export interface WorkerMessage {
  type: 'task' | 'result' | 'error' | 'stop';
  agent_id: string;
  data?: unknown;
}

export interface AgentTask {
  session_id: string;
  agent_id: string;
  profile_role: AgentProfile;
  skill_path: string;
  skill_content: string;
  iteration: number;
  max_iterations: number;
  api_url: string;
  ws_url: string;
  pi_provider: string;
  pi_model: string;
  preferred_language?: string;
  iteration_timeout_ms: number;
  forced_vote?: boolean;
  human_instructions?: string[];
}

export interface AgentResult {
  agent_id: string;
  iteration: number;
  action: 'opinion' | 'message' | 'vote' | 'wait' | 'search';
  content?: string;
  confidence?: number;
  target_agent?: AgentProfile;
  verdict?: 'approve' | 'reject' | 'abstain';
  wait_seconds?: number;
  reasoning?: string;
  structured_response?: StructuredAgentDecision;
}

export interface StructuredAgentDecision {
  action: 'opinion' | 'message' | 'vote' | 'wait' | 'search';
  reasoning: string;
  content?: string;
  target_agent?: AgentProfile;
  confidence?: number;
  verdict?: 'approve' | 'reject' | 'abstain';
  wait_seconds?: number;
}

export interface AutonomousAgentContext {
  session_id: string;
  agent_id: string;
  profile: AgentProfile;
  iteration: number;
  max_iterations: number;
  budget: number;
  hypothesis: string;
  hypothesis_description?: string;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    content_hash: string;
  }>;
  other_agents: Array<{
    id: string;
    profile: AgentProfile;
    is_active: boolean;
  }>;
  previous_opinions: Array<{
    agent_id: string;
    profile: AgentProfile;
    content: string;
    confidence: number;
  }>;
  previous_messages: Array<{
    from_agent: string;
    to_agent: string;
    content: string;
  }>;
  previous_votes: Array<{
    agent_id: string;
    profile: AgentProfile;
    verdict: 'approve' | 'reject' | 'abstain';
  }>;
  session_status: 'created' | 'active' | 'paused' | 'closed';
  final_verdict?: 'approve' | 'reject';
}

// Runtime config
export interface RuntimeConfig {
  api_url: string;
  ws_url: string;
  max_concurrent_agents: number;
  iteration_delay_ms: number;
  max_iterations_per_agent: number;
  iteration_timeout_ms: number;
  min_credits_buffer: number;
  log_level: 'debug' | 'info' | 'warn' | 'error';
  pi_provider: string;
  pi_model: string;
  pi_api_key?: string;
}

// Skill metadata
export interface SkillMetadata {
  name: string;
  description: string;
  role: AgentProfile;
  weight: number;
}

export interface ParsedSkill {
  metadata: SkillMetadata;
  content: string;
  frontmatter: Record<string, any>;
}

// Tool result from thesis tools
export interface ThesisToolResult {
  success?: boolean;
  message?: string;
  session_id?: string;
  documents_count?: number;
  agents_count?: number;
}
