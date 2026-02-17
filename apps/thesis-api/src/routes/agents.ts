import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { AgentJoinedEvent, EventType } from '@thesis/protocol';
import { randomUUID } from 'crypto';
import { AgentRepository } from '../repositories/agent.repository.js';
import { LedgerRepository } from '../repositories/ledger.repository.js';
import { LedgerService } from '../services/ledger.service.js';
import { getPool } from '../db/connection.js';
import { publishEvent } from '../websocket/event-publisher.js';

interface JoinSessionBody {
  profileRole: string;
  initialCredits?: number;
}

export async function agentRoutes(fastify: FastifyInstance): Promise<void> {
  const pool = getPool();
  const agentRepo = new AgentRepository(pool);
  const ledgerRepo = new LedgerRepository(pool);
  const ledgerService = new LedgerService(ledgerRepo);

  fastify.post<{ Params: { id: string }; Body: JoinSessionBody }>(
    '/sessions/:id/agents',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['profileRole'],
          properties: {
            profileRole: { type: 'string' },
            initialCredits: { type: 'number' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id: sessionId } = request.params;
      const { profileRole, initialCredits } = request.body;

      if (!profileRole || profileRole.trim().length === 0) {
        return reply.status(400).send({ error: 'profileRole is required' });
      }

      try {
        const agent = await agentRepo.joinSession({ sessionId, profileRole, initialCredits });

        const event: AgentJoinedEvent = {
          id: randomUUID(),
          type: 'agent.joined' as EventType.AGENT_JOINED,
          sessionId,
          timestamp: new Date(),
          version: 1,
          agentId: agent.id,
          agentProfileId: agent.profile.id,
          agentRole: agent.profile.role,
          budgetCredits: agent.budget.credits,
        };

        await ledgerService.addEvent(sessionId, event);

        publishEvent(sessionId, event);

        return reply.status(201).send({
          agentId: agent.id,
          profile: agent.profile,
          sessionId,
          budget: agent.budget,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (message.includes('not found')) {
          return reply.status(404).send({ error: message });
        }
        return reply.status(400).send({ error: message });
      }
    }
  );

  fastify.get(
    '/sessions/:id/agents',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const { id: sessionId } = request.params;
      const agents = await agentRepo.findBySessionId(sessionId);

      return reply.send(agents);
    }
  );

  fastify.get(
    '/agents/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const { id } = request.params;
      const agent = await agentRepo.findById(id);

      if (!agent) {
        return reply.status(404).send({ error: 'Agent not found' });
      }

      return reply.send(agent);
    }
  );
}
