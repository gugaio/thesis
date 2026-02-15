export interface PromptCompositionConfig {
  baseSystem: string;
  soul: string;
  profile: string;
  skill: string;
  constraints: string;
}

export interface PromptSnapshot {
  sessionId: string;
  agentId: string;
  prompt: string;
  composition: PromptCompositionConfig;
  timestamp: Date;
}

export interface PromptConstraints {
  budget: {
    credits: number;
    minBuffer: number;
  };
  toolPolicy: string[];
  sessionRules: string[];
}
