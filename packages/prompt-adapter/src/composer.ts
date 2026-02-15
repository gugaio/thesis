import type { PromptCompositionConfig, PromptConstraints, PromptSnapshot } from './types.js';

export function composePrompt(
  baseSystem: string,
  soul: string,
  profile: string,
  skill: string,
  constraints: string
): string {
  const parts = [
    `# System Prompt\n`,
    `## Base System\n${baseSystem}\n`,
    `## SOUL\n${soul}\n`,
    `## Profile\n${profile}\n`,
    `## Skill\n${skill}\n`,
    `## Constraints\n${constraints}`
  ];

  return parts.join('\n');
}

export function buildConstraints(constraints: PromptConstraints): string {
  const parts: string[] = [];

  parts.push(`### Budget Constraints\n`);
  parts.push(`- Current Credits: ${constraints.budget.credits}\n`);
  parts.push(`- Minimum Buffer: ${constraints.budget.minBuffer}\n`);
  parts.push(`- Stop Condition: When credits < ${constraints.budget.minBuffer}\n`);

  parts.push(`\n### Tool Policy\n`);
  constraints.toolPolicy.forEach(policy => {
    parts.push(`- ${policy}\n`);
  });

  parts.push(`\n### Session Rules\n`);
  constraints.sessionRules.forEach(rule => {
    parts.push(`- ${rule}\n`);
  });

  return parts.join('');
}

export async function savePromptSnapshot(
  sessionId: string,
  agentId: string,
  prompt: string,
  composition: PromptCompositionConfig
): Promise<PromptSnapshot> {
  const snapshot: PromptSnapshot = {
    sessionId,
    agentId,
    prompt,
    composition,
    timestamp: new Date()
  };

  // TODO: Persist snapshot to database or file system for audit
  // For now, just log it
  console.log(`[PromptSnapshot] Session: ${sessionId}, Agent: ${agentId}`);
  console.log(`[PromptSnapshot] Saved at: ${snapshot.timestamp.toISOString()}`);

  return snapshot;
}

export function parseMarkdownContent(content: string): string {
  return content.trim();
}
