import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { MessageSentEvent, BudgetUpdatedEvent, EventType } from '@thesis/protocol';
import { randomUUID } from 'crypto';
import { MessageRepository } from '../repositories/message.repository.js';
import { AgentRepository } from '../repositories/agent.repository.js';
import { LedgerService } from '../services/ledger.service.js';
import { getPool } from '../db/connection.js';

interface SendMessageBody {
  fromAgentId: string;
  toAgentId: string;
  content: string;
}

export async function messageRoutes(fastify: FastifyInstance): Promise<void> {
  const pool = getPool();
  const messageRepo = new MessageRepository(pool);
  const agentRepo = new AgentRepository(pool, messageRepo as any);
  const ledgerService = new LedgerService();

  const MESSAGE_COST = parseInt(process.env.MESSAGE_COST || '1', 10);

  fastify.post<{ Params: { id: string }; Body: SendMessageBody }>(
    '/sessions/:id/messages',
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
          required: ['fromAgentId', 'toAgentId', 'content'],
          properties: {
            fromAgentId: { type: 'string' },
            toAgentId: { type: 'string' },
            content: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id: sessionId } = request.params;
      const { fromAgentId, toAgentId, content } = request.body;

      if (!fromAgentId || fromAgentId.trim().length === 0) {
        return reply.status(400).send({ error: 'fromAgentId is required' });
      }

      if (!toAgentId || toAgentId.trim().length === 0) {
        return reply.status(400).send({ error: 'toAgentId is required' });
      }

      if (!content || content.trim().length === 0) {
        return reply.status(400).send({ error: 'content is required' });
      }

      if (fromAgentId === toAgentId) {
        return reply.status(400).send({ error: 'Cannot send message to yourself' });
      }

      const fromAgent = await agentRepo.findById(fromAgentId);
      if (!fromAgent) {
        return reply.status(404).send({ error: 'Sender agent not found' });
      }

      const toAgent = await agentRepo.findById(toAgentId);
      if (!toAgent) {
        return reply.status(404).send({ error: 'Recipient agent not found' });
      }

      if (fromAgent.budget.credits < MESSAGE_COST) {
        return reply.status(403).send({
          error: `Insufficient credits. Need ${MESSAGE_COST} credits, have ${fromAgent.budget.credits}`,
        });
      }

      const message = await messageRepo.create({
        sessionId,
        fromAgentId,
        toAgentId,
        content,
      });

      const updatedAgent = await agentRepo.decrementBudget(fromAgentId, MESSAGE_COST);

      const budgetEvent: BudgetUpdatedEvent = {
        id: randomUUID(),
        type: 'budget.updated' as EventType.BUPDATED,
        sessionId,
        timestamp: new Date(),
        version: 1,
        agentId: fromAgentId,
        oldCredits: fromAgent.budget.credits,
        newCredits: updatedAgent.budget.credits,
        reason: `Sent message to ${toAgentId}`,
      };

      await ledgerService.addEvent(sessionId, budgetEvent);

      const messageEvent: MessageSentEvent = {
        id: randomUUID(),
        type: 'message.sent' as EventType.MESSAGE_SENT,
        sessionId,
        timestamp: new Date(),
        version: 1,
        fromAgentId,
        toAgentId,
        content,
      };

      await ledgerService.addEvent(sessionId, messageEvent);

      return reply.status(201).send({
        messageId: message.id,
        fromAgentId,
        toAgentId,
        content,
        sentAt: message.sentAt,
        remainingCredits: updatedAgent.budget.credits,
      });
    }
  );

  fastify.get<{ Params: { id: string }; Querystring: { agentId?: string; unreadOnly?: string } }>(
    '/sessions/:id/messages',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            agentId: { type: 'string' },
            unreadOnly: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id: sessionId } = request.params;
      const { agentId, unreadOnly } = request.query;

      if (unreadOnly === 'true' && !agentId) {
        return reply.status(400).send({ error: 'agentId is required when unreadOnly=true' });
      }

      let messages;

      if (unreadOnly === 'true') {
        messages = await messageRepo.findUnreadByAgentId(agentId!);
      } else {
        messages = await messageRepo.findBySessionId(sessionId, agentId);
      }

      return reply.send({ messages });
    }
  );

  fastify.post<{ Params: { id: string }; Body: { messageIds: string[] } }>(
    '/agents/:id/messages/read',
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
          required: ['messageIds'],
          properties: {
            messageIds: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
      const { id: agentId } = request.params;
      const { messageIds } = request.body;

      for (const messageId of messageIds) {
        await messageRepo.markAsRead(messageId, agentId);
      }

      return reply.send({ markedAsRead: messageIds.length });
    }
  );

  fastify.post<{ Params: { id: string } }>(
    '/agents/:id/messages/read-all',
    async (request, reply) => {
      const { id: agentId } = request.params;

      const count = await messageRepo.markAllAsRead(agentId);

      return reply.send({ markedAsRead: count });
    }
  );
}
