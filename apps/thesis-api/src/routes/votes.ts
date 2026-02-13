import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { VoteCastEvent, EventType } from '@thesis/protocol';
import { randomUUID } from 'crypto';
import { VoteRepository } from '../repositories/vote.repository.js';
import { AgentRepository } from '../repositories/agent.repository.js';
import { AgentProfileRepository } from '../repositories/agent-profile.repository.js';
import { LedgerService } from '../services/ledger.service.js';
import { getPool } from '../db/connection.js';

interface CastVoteBody {
  agentId: string;
  verdict: string;
  rationale: string;
}

export async function voteRoutes(fastify: FastifyInstance): Promise<void> {
  const pool = getPool();
  const voteRepo = new VoteRepository(pool);
  const profileRepo = new AgentProfileRepository(pool);
  const agentRepo = new AgentRepository(pool, profileRepo);
  const ledgerService = new LedgerService();

  fastify.post(
    '/sessions/:id/votes',
    async (request: FastifyRequest<{ Params: { id: string }; Body: CastVoteBody }>, reply) => {
      const { id: sessionId } = request.params;
      const { agentId, verdict, rationale } = request.body;

      if (!agentId || agentId.trim().length === 0) {
        return reply.status(400).send({ error: 'agentId is required' });
      }

      if (!verdict || verdict.trim().length === 0) {
        return reply.status(400).send({ error: 'verdict is required' });
      }

      if (!['approve', 'reject', 'abstain'].includes(verdict)) {
        return reply.status(400).send({ error: 'verdict must be approve, reject, or abstain' });
      }

      if (!rationale || rationale.trim().length === 0) {
        return reply.status(400).send({ error: 'rationale is required' });
      }

      const agent = await agentRepo.findById(agentId);
      if (!agent) {
        return reply.status(404).send({ error: 'Agent not found' });
      }

      if (agent.budget.credits < 1) {
        return reply.status(403).send({ error: 'Insufficient credits' });
      }

      try {
        const vote = await voteRepo.create({ sessionId, agentId, verdict: verdict as any, rationale });

        const event: VoteCastEvent = {
          id: randomUUID(),
          type: 'vote.cast' as EventType.VOTE_CAST,
          sessionId,
          timestamp: new Date(),
          version: 1,
          agentId,
          verdict,
          rationale,
        };

        await ledgerService.addEvent(sessionId, event);

        return reply.status(201).send({
          voteId: vote.id,
          agentId,
          verdict,
          rationale,
          votedAt: vote.votedAt,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (errorMessage.includes('already voted')) {
          return reply.status(409).send({ error: errorMessage });
        }
        if (errorMessage.includes('already closed')) {
          return reply.status(409).send({ error: errorMessage });
        }
        if (errorMessage.includes('not found')) {
          return reply.status(404).send({ error: errorMessage });
        }

        return reply.status(500).send({ error: errorMessage });
      }
    }
  );

  fastify.get(
    '/sessions/:id/votes',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const { id: sessionId } = request.params;
      const votes = await voteRepo.findBySessionId(sessionId);

      return reply.send(votes);
    }
  );
}
