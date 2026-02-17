import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { OpinionPostedEvent, EventType } from '@thesis/protocol';
import { randomUUID } from 'crypto';
import { OpinionRepository } from '../repositories/opinion.repository.js';
import { AgentRepository } from '../repositories/agent.repository.js';
import { LedgerRepository } from '../repositories/ledger.repository.js';
import { LedgerService } from '../services/ledger.service.js';
import { getPool } from '../db/connection.js';
import { publishEvent } from '../websocket/event-publisher.js';

interface PostOpinionBody {
  agentId: string;
  content: string;
  confidence: number;
}

export async function opinionRoutes(fastify: FastifyInstance): Promise<void> {
  const pool = getPool();
  const opinionRepo = new OpinionRepository(pool);
  const agentRepo = new AgentRepository(pool);
  const ledgerRepo = new LedgerRepository(pool);
  const ledgerService = new LedgerService(ledgerRepo);

  fastify.post(
    '/sessions/:id/opinions',
    async (request: FastifyRequest<{ Params: { id: string }; Body: PostOpinionBody }>, reply) => {
      const { id: sessionId } = request.params;
      const { agentId, content, confidence } = request.body;

      if (!agentId || agentId.trim().length === 0) {
        return reply.status(400).send({ error: 'agentId is required' });
      }

      if (!content || content.trim().length === 0) {
        return reply.status(400).send({ error: 'content is required' });
      }

      if (confidence === undefined || confidence < 0 || confidence > 1) {
        return reply.status(400).send({ error: 'confidence must be between 0 and 1' });
      }

      const agent = await agentRepo.findById(agentId);
      if (!agent) {
        return reply.status(404).send({ error: 'Agent not found' });
      }

      if (agent.budget.credits < 1) {
        return reply.status(403).send({ error: 'Insufficient credits' });
      }

      const opinion = await opinionRepo.create({ sessionId, agentId, content, confidence });

      const event: OpinionPostedEvent = {
        id: randomUUID(),
        type: 'opinion.posted' as EventType.OPINION_POSTED,
        sessionId,
        timestamp: new Date(),
        version: 1,
        agentId,
        opinionId: opinion.type,
        content,
        confidence,
      };

      await ledgerService.addEvent(sessionId, event);

      publishEvent(sessionId, event);

      return reply.status(201).send({
        opinionId: opinion.type,
        agentId,
        content,
        confidence,
      });
    }
  );

  fastify.get(
    '/sessions/:id/opinions',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const { id: sessionId } = request.params;
      const opinions = await opinionRepo.findBySessionId(sessionId);

      return reply.send(opinions);
    }
  );
}
