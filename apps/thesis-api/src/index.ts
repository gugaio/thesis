import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { sessionRoutes } from './routes/sessions.js';
import { documentRoutes } from './routes/documents.js';
import { agentRoutes } from './routes/agents.js';
import { opinionRoutes } from './routes/opinions.js';

const fastify = Fastify({
  logger: true
});

fastify.register(cors, {
  origin: true
});

fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024,
  }
});

fastify.register(sessionRoutes);
fastify.register(agentRoutes);
fastify.register(documentRoutes);
fastify.register(opinionRoutes);

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
