import { describe, expect, it } from 'vitest';
import { dispatchGatewayCommand } from '../command-dispatcher.js';

describe('dispatchGatewayCommand', () => {
  it('should add instruction for ask command', () => {
    const result = dispatchGatewayCommand({
      event: {
        type: 'orchestrator.command_issued',
        sessionId: 's1',
        commandType: 'ask',
        issuedBy: 'human',
        targetAgentRole: 'research',
        content: 'busque dados',
      },
      currentForcedVoteRound: false,
      currentInstructions: new Map(),
    });

    expect(result.nextState).toBe('running');
    expect(result.shouldWake).toBe(true);
    expect(result.nextInstructions.get('research')).toEqual(['busque dados']);
  });

  it('should broadcast vote instruction to all roles', () => {
    const result = dispatchGatewayCommand({
      event: {
        type: 'orchestrator.command_issued',
        sessionId: 's1',
        commandType: 'vote',
        issuedBy: 'human',
      },
      currentForcedVoteRound: false,
      currentInstructions: new Map(),
    });

    expect(result.nextForcedVoteRound).toBe(true);
    expect(result.nextInstructions.size).toBeGreaterThan(0);
  });
});
