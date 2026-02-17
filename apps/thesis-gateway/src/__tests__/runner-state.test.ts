import { describe, expect, it } from 'vitest';
import { transitionAfterCommand, transitionAfterIteration } from '../runner-state.js';

describe('Runner State Machine', () => {
  it('should enter idle when all agents are waiting', () => {
    const next = transitionAfterIteration({
      allWaiting: true,
      forcedVoteRound: false,
      allVoted: false,
    });

    expect(next.state).toBe('idle');
    expect(next.forcedVoteRound).toBe(false);
  });

  it('should keep running after resume command', () => {
    const next = transitionAfterCommand({
      commandType: 'resume',
      currentForcedVoteRound: false,
    });

    expect(next.state).toBe('running');
    expect(next.forcedVoteRound).toBe(false);
  });

  it('should enable forced vote round after vote command', () => {
    const next = transitionAfterCommand({
      commandType: 'vote',
      currentForcedVoteRound: false,
    });

    expect(next.state).toBe('running');
    expect(next.forcedVoteRound).toBe(true);
  });

  it('should stop when forced vote round has all votes', () => {
    const next = transitionAfterIteration({
      allWaiting: false,
      forcedVoteRound: true,
      allVoted: true,
    });

    expect(next.state).toBe('stopped');
    expect(next.forcedVoteRound).toBe(true);
  });
});
