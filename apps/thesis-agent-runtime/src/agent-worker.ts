import { parentPort, workerData } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import type { WorkerMessage, AgentTask, AgentResult, AgentProfile, AutonomousAgentContext, StructuredAgentDecision } from './types.js';
import { log } from './config.js';
import { composePrompt, buildConstraints, savePromptSnapshot } from '@thesis/prompt-adapter';
import { ToolRegistry, BashToolExecutor } from '@thesis/tools';

interface PiAgent {
  generate(options: { prompt: string; maxTokens: number; temperature: number }): Promise<string>;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class AgentWorker {
  private taskId: string;
  private sessionId: string;
  private profile: AgentProfile;
  private skillPath: string;
  private skillContent: string;
  private iteration: number;
  private maxIterations: number;
  private apiUrl: string;
  private piProvider: string;
  private piModel: string;
  private timeoutMs: number;
  private minCreditsBuffer: number;
  private baseSystem: string;
  private soul: string;

  private piAgent: PiAgent | null = null;
  private toolRegistry: ToolRegistry;
  private toolExecutor: BashToolExecutor;
  private currentBudget: number;

  private autonomousContext: AutonomousAgentContext | null = null;

  constructor(task: AgentTask) {
    this.taskId = task.agent_id;
    this.sessionId = task.session_id;
    this.profile = task.profile_role as AgentProfile;
    this.skillPath = task.skill_path;
    this.skillContent = task.skill_content;
    this.iteration = task.iteration;
    this.maxIterations = task.max_iterations;
    this.apiUrl = task.api_url;
    this.piProvider = task.pi_provider;
    this.piModel = task.pi_model;
    this.timeoutMs = task.iteration_timeout_ms;
    this.minCreditsBuffer = 10;
    this.baseSystem = this.loadBaseSystem();
    this.soul = task.skill_content.substring(0, 1000);

    this.toolRegistry = new ToolRegistry();
    this.toolExecutor = new BashToolExecutor();
    this.currentBudget = 100;

    log.debug(`[Worker ${this.taskId}] Created for profile: ${this.profile}`);
  }

  private loadBaseSystem(): string {
    try {
      const basePath = join(__dirname, '../../../packages/skills/BASE_SYSTEM.md');
      const content = readFileSync(basePath, 'utf-8');
      return content;
    } catch (error) {
      log.warn(`[Worker ${this.taskId}] Failed to load BASE_SYSTEM.md, using fallback`);
      return 'You are an AI agent participating in THESIS: The Council, a multi-agent platform for venture capital analysis.';
    }
  }

  private buildAutonomousContext(): AutonomousAgentContext {
    return {
      session_id: this.sessionId,
      agent_id: this.taskId,
      profile: this.profile,
      iteration: this.iteration,
      max_iterations: this.maxIterations,
      budget: this.currentBudget,
      hypothesis: '',
      hypothesis_description: '',
      documents: [],
      other_agents: [],
      previous_opinions: [],
      previous_messages: [],
      previous_votes: [],
      session_status: 'active'
    };
  }

  private async buildDecisionPrompt(context: AutonomousAgentContext): Promise<string> {
    const constraints = buildConstraints({
      budget: {
        credits: context.budget,
        minBuffer: this.minCreditsBuffer
      },
      toolPolicy: this.toolRegistry.getAllowedTools().map(t => t.description),
      sessionRules: [
        'Be clear and concise',
        'Use Markdown formatting',
        'Include confidence levels (0.0 - 1.0)',
        'Cite specific evidence from documents'
      ]
    });

    const systemPrompt = composePrompt(
      this.baseSystem,
      this.soul,
      this.getProfileDescription(this.profile),
      this.skillContent,
      constraints
    );

    const contextSection = `
# Current Session Context

## Session Info
- Session ID: ${context.session_id}
- Your Agent ID: ${context.agent_id}
- Your Profile: ${context.profile}
- Current Iteration: ${context.iteration}/${context.max_iterations}
- Session Status: ${context.session_status}

## Budget
- Current Credits: ${context.budget}
- Minimum Buffer: ${this.minCreditsBuffer}

## Investment Hypothesis
${context.hypothesis}
${context.hypothesis_description ? `\nDescription: ${context.hypothesis_description}` : ''}

## Documents
${context.documents.length > 0 ? context.documents.map(doc => `- ${doc.name} (${doc.type})`).join('\n') : 'No documents uploaded yet.'}

## Other Agents
${context.other_agents.map(agent => `- ${agent.profile} (ID: ${agent.id}, Active: ${agent.is_active})`).join('\n')}

## Previous Opinions
${context.previous_opinions.length > 0 ? context.previous_opinions.map(op => `- **${op.profile}**: ${op.content} (confidence: ${op.confidence})`).join('\n') : 'No opinions posted yet.'}

## Previous Messages
${context.previous_messages.length > 0 ? context.previous_messages.map(msg => `- **${msg.from_agent} → ${msg.to_agent}**: ${msg.content}`).join('\n') : 'No messages exchanged yet.'}

## Previous Votes
${context.previous_votes.length > 0 ? context.previous_votes.map(vote => `- **${vote.profile}**: ${vote.verdict}`).join('\n') : 'No votes cast yet.'}

${context.final_verdict ? `## Final Verdict\n${context.final_verdict}` : ''}

---

# Your Task

Based on the context above, decide what action to take next. You must respond with a valid JSON object following this structure:

\`\`\`json
{
  "action": "opinion" | "message" | "vote" | "wait",
  "reasoning": "Explain why you chose this action based on the current state",
  "content": "...", // if action is opinion or message
  "target_agent": "debt|tech|market", // if action is message
  "confidence": 0.8, // if action is opinion (0.0 - 1.0)
  "verdict": "approve|reject|abstain", // if action is vote
  "wait_seconds": 5 // if action is wait
}
\`\`\`

**IMPORTANT:**
- Provide a clear, detailed reasoning that references specific information from the context
- Choose the action that best contributes to the collective analysis
- Be strategic about budget usage
- Your response must be valid JSON only, no markdown, no extra text
`;

    return systemPrompt + contextSection;
  }

  private parseStructuredDecision(response: string): StructuredAgentDecision {
    try {
      const cleaned = response.trim()
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const decision = JSON.parse(cleaned);

      if (!decision.action || !['opinion', 'message', 'vote', 'wait'].includes(decision.action)) {
        throw new Error(`Invalid action: ${decision.action}`);
      }

      if (!decision.reasoning) {
        throw new Error('Missing reasoning in decision');
      }

      return decision as StructuredAgentDecision;
    } catch (error) {
      log.warn(`[Worker ${this.taskId}] Failed to parse structured decision, using fallback: ${response.substring(0, 100)}`);
      
      return {
        action: 'wait',
        reasoning: 'Failed to parse LLM response, waiting for next iteration',
        wait_seconds: 5
      };
    }
  }

  async initialize(): Promise<void> {
    log.debug(`[Worker ${this.taskId}] Initializing mono-pi agent...`);

    try {
      this.piAgent = {
        generate: async (options) => {
          log.debug(`[Worker ${this.taskId}] Generating with mono-pi: ${options.prompt.substring(0, 50)}...`);
          return `[Mock mono-pi response] This is a generated response for ${this.profile} agent.`;
        }
      };

      log.debug(`[Worker ${this.taskId}] Mono-pi agent initialized`);
    } catch (error) {
      log.error(`[Worker ${this.taskId}] Failed to initialize mono-pi:`, error);
      throw error;
    }
  }

  private getProfileDescription(profile: AgentProfile): string {
    const profiles: Record<AgentProfile, string> = {
      debt: 'You are a Debt Specialist focused on startup financials, burn rate, runway, and unit economics.',
      tech: 'You are a Tech Expert focused on technology stack, technical debt, scalability, and architecture.',
      market: 'You are a Market Analyst focused on TAM/SAM/SOM, competition, and product-market fit.'
    };
    return profiles[profile];
  }

  private async decideAutonomousAction(): Promise<StructuredAgentDecision> {
    log.debug(`[Worker ${this.taskId}] Making autonomous decision...`);

    const context = this.buildAutonomousContext();
    const prompt = await this.buildDecisionPrompt(context);

    try {
      const response = await this.piAgent!.generate({
        prompt,
        maxTokens: 800,
        temperature: 0.7
      });

      const decision = this.parseStructuredDecision(response);
      log.debug(`[Worker ${this.taskId}] Autonomously decided: ${decision.action} - ${decision.reasoning.substring(0, 100)}...`);

      await savePromptSnapshot(
        this.sessionId,
        this.taskId,
        prompt,
        {
          baseSystem: this.baseSystem,
          soul: this.soul,
          profile: this.getProfileDescription(this.profile),
          skill: this.skillContent,
          constraints: ''
        }
      );

      return decision;
    } catch (error) {
      log.error(`[Worker ${this.taskId}] Error making autonomous decision:`, error);
      return {
        action: 'wait',
        reasoning: 'Error making autonomous decision, waiting for next iteration',
        wait_seconds: 5
      };
    }
  }

  async runIteration(): Promise<AgentResult> {
    log.debug(`[Worker ${this.taskId}] Running iteration ${this.iteration}/${this.maxIterations}`);

    if (this.iteration > this.maxIterations) {
      log.debug(`[Worker ${this.taskId}] Max iterations reached`);
      return {
        agent_id: this.taskId,
        iteration: this.iteration,
        action: 'wait',
        wait_seconds: 0,
        reasoning: 'Max iterations reached'
      };
    }

    if (this.currentBudget < this.minCreditsBuffer) {
      log.debug(`[Worker ${this.taskId}] Low budget: ${this.currentBudget}`);
      return {
        agent_id: this.taskId,
        iteration: this.iteration,
        action: 'wait',
        wait_seconds: 0,
        reasoning: `Low budget: ${this.currentBudget} credits remaining`
      };
    }

    if (!this.piAgent) {
      await this.initialize();
    }

    const decision = await this.decideAutonomousAction();
    log.debug(`[Worker ${this.taskId}] Autonomously decided: ${decision.action}`);

    const result: AgentResult = {
      agent_id: this.taskId,
      iteration: this.iteration,
      action: decision.action,
      content: decision.content,
      confidence: decision.confidence,
      target_agent: decision.target_agent,
      verdict: decision.verdict,
      wait_seconds: decision.wait_seconds,
      reasoning: decision.reasoning,
      structured_response: decision
    };

    if (decision.action === 'opinion' || decision.action === 'message' || decision.action === 'vote') {
      this.currentBudget -= 1;
      log.debug(`[Worker ${this.taskId}] Budget deducted: ${this.currentBudget} credits remaining`);
    }

    return result;
  }



  async stop(): Promise<void> {
    log.debug(`[Worker ${this.taskId}] Stopping...`);
    this.piAgent = null;
  }
}

async function runWorker() {
  if (!workerData) {
    throw new Error('No worker data provided');
  }

  const task = workerData as AgentTask;
  const worker = new AgentWorker(task);

  parentPort?.on('message', async (msg: WorkerMessage) => {
    if (msg.type === 'stop') {
      log.debug(`[Worker ${task.agent_id}] Received stop signal`);
      await worker.stop();
      parentPort?.postMessage({ type: 'result', agent_id: task.agent_id });
      process.exit(0);
    }
  });

  try {
    const result = await worker.runIteration();
    parentPort?.postMessage({
      type: 'result',
      agent_id: task.agent_id,
      data: result,
    });
  } catch (error) {
    log.error(`[Worker ${task.agent_id}] Error:`, error);
    parentPort?.postMessage({
      type: 'error',
      agent_id: task.agent_id,
      data: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

runWorker().catch(err => {
  log.error(`[Worker ${workerData?.agent_id || 'unknown'}] Fatal error:`, err);
  parentPort?.postMessage({
    type: 'error',
    agent_id: workerData?.agent_id || 'unknown',
    data: err.message,
  });
  process.exit(1);
});
