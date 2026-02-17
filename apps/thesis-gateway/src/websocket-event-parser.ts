import { GATEWAY_COMMAND_TYPES, type GatewayCommandType } from '@thesis/protocol';
import type { GatewayCommandEvent } from './types.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isGatewayCommandType(value: unknown): value is GatewayCommandType {
  return typeof value === 'string' && GATEWAY_COMMAND_TYPES.some((type) => type === value);
}

export function parseGatewayCommandEventMessage(raw: Buffer): GatewayCommandEvent | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.toString());
  } catch {
    return null;
  }

  if (!isRecord(parsed)) {
    return null;
  }

  const envelopeType = parsed.type;
  const envelopeData = parsed.data;

  if (envelopeType !== 'event' || !isRecord(envelopeData)) {
    return null;
  }

  if (envelopeData.type !== 'orchestrator.command_issued') {
    return null;
  }

  const commandType = envelopeData.commandType;
  const sessionId = envelopeData.sessionId;
  const issuedBy = envelopeData.issuedBy;
  const targetAgentRole = envelopeData.targetAgentRole;
  const content = envelopeData.content;

  if (!isGatewayCommandType(commandType)) {
    return null;
  }

  if (typeof sessionId !== 'string' || sessionId.length === 0) {
    return null;
  }

  if (typeof issuedBy !== 'string' || issuedBy.length === 0) {
    return null;
  }

  if (targetAgentRole !== undefined && typeof targetAgentRole !== 'string') {
    return null;
  }

  if (content !== undefined && typeof content !== 'string') {
    return null;
  }

  return {
    type: 'orchestrator.command_issued',
    sessionId,
    commandType,
    issuedBy,
    targetAgentRole: targetAgentRole as GatewayCommandEvent['targetAgentRole'],
    content,
  };
}
