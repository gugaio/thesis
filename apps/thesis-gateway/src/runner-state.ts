import type { RunnerState } from './types.js';
import type { GatewayCommandType } from '@thesis/protocol';

export interface RunnerStatusSnapshot {
  state: RunnerState;
  forcedVoteRound: boolean;
}

export function transitionAfterIteration(input: {
  allWaiting: boolean;
  forcedVoteRound: boolean;
  allVoted: boolean;
}): RunnerStatusSnapshot {
  if (input.forcedVoteRound && input.allVoted) {
    return {
      state: 'stopped',
      forcedVoteRound: true,
    };
  }

  if (input.allWaiting) {
    return {
      state: 'idle',
      forcedVoteRound: false,
    };
  }

  return {
    state: 'running',
    forcedVoteRound: input.forcedVoteRound,
  };
}

export function transitionAfterCommand(input: {
  commandType: Exclude<GatewayCommandType, 'start'>;
  currentForcedVoteRound: boolean;
}): RunnerStatusSnapshot {
  if (input.commandType === 'vote') {
    return {
      state: 'running',
      forcedVoteRound: true,
    };
  }

  return {
    state: 'running',
    forcedVoteRound: input.currentForcedVoteRound,
  };
}
