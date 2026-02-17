import { describe, expect, it } from 'vitest';
import { parseGatewayCommandEventMessage } from '../websocket-event-parser.js';

describe('parseGatewayCommandEventMessage', () => {
  it('should parse a valid command envelope', () => {
    const payload = Buffer.from(JSON.stringify({
      type: 'event',
      data: {
        type: 'orchestrator.command_issued',
        sessionId: 'session-1',
        commandType: 'ask',
        issuedBy: 'human',
        targetAgentRole: 'research',
        content: 'Pesquisar TAM',
      },
    }));

    const parsed = parseGatewayCommandEventMessage(payload);
    expect(parsed).not.toBeNull();
    expect(parsed?.commandType).toBe('ask');
    expect(parsed?.sessionId).toBe('session-1');
  });

  it('should return null for invalid command type', () => {
    const payload = Buffer.from(JSON.stringify({
      type: 'event',
      data: {
        type: 'orchestrator.command_issued',
        sessionId: 'session-1',
        commandType: 'invalid',
        issuedBy: 'human',
      },
    }));

    const parsed = parseGatewayCommandEventMessage(payload);
    expect(parsed).toBeNull();
  });
});
