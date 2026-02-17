import { AGENTS_CONFIG, type AgentRole } from '@thesis/skills';
import { transitionAfterCommand } from './runner-state.js';
import type { GatewayCommandEvent, RunnerState } from './types.js';

interface DispatchInput {
  event: GatewayCommandEvent;
  currentForcedVoteRound: boolean;
  currentInstructions: Map<AgentRole, string[]>;
}

interface DispatchOutput {
  nextState: RunnerState;
  nextForcedVoteRound: boolean;
  nextInstructions: Map<AgentRole, string[]>;
  shouldWake: boolean;
}

function cloneInstructionMap(source: Map<AgentRole, string[]>): Map<AgentRole, string[]> {
  const cloned = new Map<AgentRole, string[]>();
  for (const [key, value] of source.entries()) {
    cloned.set(key, [...value]);
  }
  return cloned;
}

export function dispatchGatewayCommand(input: DispatchInput): DispatchOutput {
  if (input.event.commandType === 'start') {
    return {
      nextState: 'running',
      nextForcedVoteRound: input.currentForcedVoteRound,
      nextInstructions: cloneInstructionMap(input.currentInstructions),
      shouldWake: false,
    };
  }

  const transition = transitionAfterCommand({
    commandType: input.event.commandType,
    currentForcedVoteRound: input.currentForcedVoteRound,
  });

  const instructions = cloneInstructionMap(input.currentInstructions);

  if (input.event.commandType === 'ask') {
    if (input.event.targetAgentRole && input.event.content) {
      const current = instructions.get(input.event.targetAgentRole) ?? [];
      current.push(input.event.content);
      instructions.set(input.event.targetAgentRole, current);
    }
  }

  if (input.event.commandType === 'vote') {
    for (const profile of AGENTS_CONFIG) {
      const role = profile.role as AgentRole;
      const current = instructions.get(role) ?? [];
      current.push('Human command: start voting round now. Vote if you have enough evidence.');
      instructions.set(role, current);
    }
  }

  return {
    nextState: transition.state,
    nextForcedVoteRound: transition.forcedVoteRound,
    nextInstructions: instructions,
    shouldWake: true,
  };
}
