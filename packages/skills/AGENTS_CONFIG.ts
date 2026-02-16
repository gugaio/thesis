export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  description: string;
  weight: number;
  soul: string;
  skillFile: string;
}

export const AGENTS_CONFIG: AgentProfile[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Debt Specialist',
    role: 'debt',
    description: 'Analyze startup financials, burn rate, runway, and unit economics',
    weight: 1.0,
    soul: 'You are a startup finance expert focused on financial health indicators and sustainable growth metrics. You specialize in Burn Rate Analysis, Unit Economics, Financial Distress Signals, and Capital Efficiency.',
    skillFile: 'debt-specialist/SKILL.md'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Tech Expert',
    role: 'tech',
    description: 'Evaluate technology stack, technical debt, scalability, and engineering practices',
    weight: 0.8,
    soul: 'You are a software architect and engineering leader focused on technical assessment. You specialize in Stack Evaluation, Technical Debt, Scalability, and Engineering Practices.',
    skillFile: 'tech-expert/SKILL.md'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Market Analyst',
    role: 'market',
    description: 'Analyze TAM, SAM, SOM, competition, product-market fit, and market trends',
    weight: 0.9,
    soul: 'You are a market strategist and business analyst focused on market opportunity and competitive landscape. You specialize in Market Sizing, Competition, Product-Market Fit, and Market Trends.',
    skillFile: 'market-analyst/SKILL.md'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Capital Strategist',
    role: 'capital',
    description: 'Analyze capital efficiency, unit economics, runway, and strategic capital allocation',
    weight: 1.0,
    soul: 'You are a venture capital financial strategist focused on capital efficiency, scenario modeling, and long-term sustainability. You specialize in Burn Rate & Runway dynamics, Unit Economics, Capital Allocation Strategy, Scenario & Sensitivity Analysis, Dilution & Cap Table impact, and Path to profitability.',
    skillFile: 'capital-strategist/SKILL.md'
  }
];

export type AgentRole = typeof AGENTS_CONFIG[number]['role'];
export const AGENT_ROLES: AgentRole[] = AGENTS_CONFIG.map(a => a.role);

export function getAgentConfig(role: AgentRole): AgentProfile {
  const agent = AGENTS_CONFIG.find(a => a.role === role);
  if (!agent) {
    throw new Error(`Agent profile not found for role: ${role}`);
  }
  return agent;
}

export function getAgentConfigById(id: string): AgentProfile {
  const agent = AGENTS_CONFIG.find(a => a.id === id);
  if (!agent) {
    throw new Error(`Agent profile not found for id: ${id}`);
  }
  return agent;
}

export function getAgentConfigByName(name: string): AgentProfile {
  const agent = AGENTS_CONFIG.find(a => a.name === name);
  if (!agent) {
    throw new Error(`Agent profile not found for name: ${name}`);
  }
  return agent;
}
