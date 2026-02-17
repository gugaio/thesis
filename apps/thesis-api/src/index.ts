import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import websocket from '@fastify/websocket';
import { sessionRoutes } from './routes/sessions.js';
import { documentRoutes } from './routes/documents.js';
import { agentRoutes } from './routes/agents.js';
import { opinionRoutes } from './routes/opinions.js';
import { messageRoutes } from './routes/messages.js';
import { voteRoutes } from './routes/votes.js';
import { orchestratorRoutes } from './routes/orchestrator.js';
import { createWebSocketHandler } from './websocket/websocket.handler.js';
import { SessionRepository } from './repositories/session.repository.js';
import { DocumentRepository } from './repositories/document.repository.js';
import { AgentRepository } from './repositories/agent.repository.js';
import { OpinionRepository } from './repositories/opinion.repository.js';
import { VoteRepository } from './repositories/vote.repository.js';
import { MessageRepository } from './repositories/message.repository.js';
import { LedgerRepository } from './repositories/ledger.repository.js';
import { LedgerService } from './services/ledger.service.js';
import { getPool } from './db/connection.js';
import { HypothesisRepository } from './repositories/hypothesis.repository.js';

const fastify = Fastify({
  logger: true
});

fastify.register(cors, {
  origin: true
});

fastify.register(websocket);

fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024,
  }
});

fastify.register(sessionRoutes);
fastify.register(agentRoutes);
fastify.register(documentRoutes);
fastify.register(opinionRoutes);
fastify.register(messageRoutes);
fastify.register(voteRoutes);
fastify.register(orchestratorRoutes);

fastify.register(async function (fastify) {
  const pool = getPool();
  const hypothesisRepo = new HypothesisRepository(pool);
  const sessionRepo = new SessionRepository(pool, hypothesisRepo);
  const documentRepo = new DocumentRepository(pool);
  const agentRepo = new AgentRepository(pool);
  const opinionRepo = new OpinionRepository(pool);
  const voteRepo = new VoteRepository(pool);
  const messageRepo = new MessageRepository(pool);
  const ledgerRepo = new LedgerRepository(pool);
  const ledgerService = new LedgerService(ledgerRepo);

  fastify.register(async function (fastify) {
    fastify.get(
      '/ws/sessions/:id',
      { websocket: true },
      createWebSocketHandler(
        sessionRepo,
        documentRepo,
        agentRepo,
        opinionRepo,
        voteRepo,
        messageRepo,
        ledgerService
      )
    );
  });
});

fastify.get('/health', async () => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'thesis-api',
    version: '0.1.0'
  };
});

export const app = fastify;

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 4000;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    
    console.log(`🚀 THESIS API running on http://${host}:${port}`);
    console.log(`📊 Health check: http://${host}:${port}/health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
