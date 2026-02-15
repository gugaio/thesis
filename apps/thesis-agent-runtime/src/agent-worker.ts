import { parentPort, workerData } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import type { WorkerMessage, AgentTask, AgentResult, AgentProfile } from './types.js';
import { log } from './config.js';
import { composePrompt, buildConstraints, savePromptSnapshot } from '@thesis/prompt-adapter';
import { ToolRegistry, BashToolExecutor } from '@thesis/tools';

interface PiAgent {
  generate(options: { prompt: string; maxTokens: number; temperature: number }): Promise<string>;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface AgentContext {
  sessionId: string;
  agentId: string;
  profile: AgentProfile;
  baseSystem: string;
  soul: string;
  budget: number;
  documents: any[];
  previousMessages: any[];
  previousOpinions: any[];
}

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

  private async buildFullPrompt(context: AgentContext): Promise<string> {
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

    return composePrompt(
      context.baseSystem,
      context.soul,
      this.getProfileDescription(this.profile),
      this.skillContent,
      constraints
    );
  }

  private async decideAction(iteration: number, budget: number): Promise<'opinion' | 'message' | 'vote' | 'wait'> {
    if (budget < this.minCreditsBuffer) {
      return 'wait';
    }

    if (iteration < 3) {
      return 'opinion';
    } else if (iteration < 5) {
      return 'message';
    } else if (iteration < this.maxIterations) {
      return 'vote';
    }

    return 'wait';
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

    const action = await this.decideAction(this.iteration, this.currentBudget);
    log.debug(`[Worker ${this.taskId}] Decided action: ${action}`);

    switch (action) {
      case 'opinion':
        return this.generateOpinion();
      case 'message':
        return this.generateMessage();
      case 'vote':
        return this.generateVote();
      default:
        return {
          agent_id: this.taskId,
          iteration: this.iteration,
          action: 'wait',
          wait_seconds: 5,
          reasoning: 'Waiting for next iteration'
        };
    }
  }

  private async generateOpinion(): Promise<AgentResult> {
    log.debug(`[Worker ${this.taskId}] Generating opinion...`);

    const context: AgentContext = {
      sessionId: this.sessionId,
      agentId: this.taskId,
      profile: this.profile,
      baseSystem: this.baseSystem,
      soul: this.soul,
      budget: this.currentBudget,
      documents: [],
      previousMessages: [],
      previousOpinions: []
    };

    const prompt = await this.buildFullPrompt(context);

    try {
      const response = await this.piAgent!.generate({
        prompt,
        maxTokens: 500,
        temperature: 0.7
      });

      const confidence = this.extractConfidence(response);
      const content = this.cleanResponse(response);

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

      this.currentBudget -= 1;

      return {
        agent_id: this.taskId,
        iteration: this.iteration,
        action: 'opinion',
        content,
        confidence,
        reasoning: `Opinion generated based on ${this.profile} analysis`
      };
    } catch (error) {
      log.error(`[Worker ${this.taskId}] Error generating opinion:`, error);
      throw error;
    }
  }

  private async generateMessage(): Promise<AgentResult> {
    log.debug(`[Worker ${this.taskId}] Generating message...`);

    const targetAgent = this.getOtherAgent();

    const context: AgentContext = {
      sessionId: this.sessionId,
      agentId: this.taskId,
      profile: this.profile,
      baseSystem: this.baseSystem,
      soul: this.soul,
      budget: this.currentBudget,
      documents: [],
      previousMessages: [],
      previousOpinions: []
    };

    const prompt = await this.buildFullPrompt(context);
    const messagePrompt = `${prompt}\n\nTask: Ask a clarifying question to the ${targetAgent} agent.`;

    try {
      const response = await this.piAgent!.generate({
        prompt: messagePrompt,
        maxTokens: 300,
        temperature: 0.8
      });

      const content = this.cleanResponse(response);

      this.currentBudget -= 1;

      return {
        agent_id: this.taskId,
        iteration: this.iteration,
        action: 'message',
        content,
        target_agent: targetAgent,
        reasoning: `Question addressed to ${targetAgent} agent`
      };
    } catch (error) {
      log.error(`[Worker ${this.taskId}] Error generating message:`, error);
      throw error;
    }
  }

  private async generateVote(): Promise<AgentResult> {
    log.debug(`[Worker ${this.taskId}] Generating vote...`);

    const context: AgentContext = {
      sessionId: this.sessionId,
      agentId: this.taskId,
      profile: this.profile,
      baseSystem: this.baseSystem,
      soul: this.soul,
      budget: this.currentBudget,
      documents: [],
      previousMessages: [],
      previousOpinions: []
    };

    const prompt = await this.buildFullPrompt(context);
    const votePrompt = `${prompt}\n\nTask: Based on your analysis and all available evidence, cast your final vote on the investment hypothesis. Options: approve, reject, abstain. Respond with just the verdict and a brief rationale.`;

    try {
      const response = await this.piAgent!.generate({
        prompt: votePrompt,
        maxTokens: 200,
        temperature: 0.5
      });

      const verdict = this.extractVerdict(response);
      const rationale = this.cleanResponse(response);

      this.currentBudget -= 1;

      return {
        agent_id: this.taskId,
        iteration: this.iteration,
        action: 'vote',
        verdict,
        reasoning: rationale
      };
    } catch (error) {
      log.error(`[Worker ${this.taskId}] Error generating vote:`, error);
      throw error;
    }
  }

  private extractConfidence(response: string): number {
    const confidenceMatch = response.match(/confidence[:\s]*(\d+\.?\d*)/i);
    if (confidenceMatch) {
      const value = parseFloat(confidenceMatch[1]);
      return Math.min(Math.max(value, 0), 1);
    }
    return 0.7;
  }

  private extractVerdict(response: string): 'approve' | 'reject' | 'abstain' {
    const lower = response.toLowerCase();
    if (lower.includes('approve')) return 'approve';
    if (lower.includes('reject')) return 'reject';
    return 'abstain';
  }

  private cleanResponse(response: string): string {
    return response
      .replace(/Confidence:?\s*\d+\.?\d*/gi, '')
      .replace(/Verdict:?\s*(approve|reject|abstain)/gi, '')
      .trim();
  }

  private getOtherAgent(): string {
    const agents: AgentProfile[] = ['debt', 'tech', 'market'];
    const otherAgents = agents.filter(a => a !== this.profile);
    return otherAgents[Math.floor(Math.random() * otherAgents.length)];
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
