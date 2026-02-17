import type { FastifyInstance, FastifyRequest } from 'fastify';
import { GATEWAY_COMMAND_TYPES, type EventType, type GatewayCommandType, type OrchestratorCommandIssuedEvent } from '@thesis/protocol';
import { randomUUID } from 'crypto';
import { AGENT_ROLES, type AgentRole } from '@thesis/skills';
import { SessionRepository } from '../repositories/session.repository.js';
import { HypothesisRepository } from '../repositories/hypothesis.repository.js';
import { LedgerRepository } from '../repositories/ledger.repository.js';
import { LedgerService } from '../services/ledger.service.js';
import { getPool } from '../db/connection.js';
import { publishEvent } from '../websocket/event-publisher.js';

interface IssueCommandBody {
  commandType: GatewayCommandType;
  issuedBy?: string;
  targetAgentRole?: string;
  content?: string;
}

export async function orchestratorRoutes(fastify: FastifyInstance): Promise<void> {
  const pool = getPool();
  const hypothesisRepo = new HypothesisRepository(pool);
  const sessionRepo = new SessionRepository(pool, hypothesisRepo);
  const ledgerRepo = new LedgerRepository(pool);
  const ledgerService = new LedgerService(ledgerRepo);

  fastify.post<{ Params: { id: string }; Body: IssueCommandBody }>(
    '/sessions/:id/orchestrator/commands',
    async (request: FastifyRequest<{ Params: { id: string }; Body: IssueCommandBody }>, reply) => {
      const { id: sessionId } = request.params;
      const { commandType, issuedBy, targetAgentRole, content } = request.body;

      const session = await sessionRepo.findById(sessionId);
      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      if (session.status === 'closed') {
        return reply.status(409).send({ error: 'Session is closed' });
      }

      if (!commandType || !GATEWAY_COMMAND_TYPES.includes(commandType)) {
        return reply.status(400).send({ error: 'commandType must be start, ask, resume, or vote' });
      }

      if (commandType === 'ask') {
        if (!targetAgentRole || !AGENT_ROLES.includes(targetAgentRole as AgentRole)) {
          return reply.status(400).send({
            error: `targetAgentRole must be one of: ${AGENT_ROLES.join(', ')}`,
          });
        }

        if (!content || content.trim().length === 0) {
          return reply.status(400).send({ error: 'content is required for ask command' });
        }
      }

      const event: OrchestratorCommandIssuedEvent = {
        id: randomUUID(),
        type: 'orchestrator.command_issued' as EventType.ORCHESTRATOR_COMMAND_ISSUED,
        sessionId,
        timestamp: new Date(),
        version: 1,
        commandType,
        issuedBy: issuedBy && issuedBy.trim().length > 0 ? issuedBy : 'human',
        targetAgentRole,
        content,
      };

      await ledgerService.addEvent(sessionId, event);
      publishEvent(sessionId, event);

      return reply.status(201).send({
        commandId: event.id,
        sessionId,
        commandType: event.commandType,
        issuedBy: event.issuedBy,
      });
    }
  );
}
