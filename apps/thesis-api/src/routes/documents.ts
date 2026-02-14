import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { DocUploadedEvent, EventType } from '@thesis/protocol';
import { randomUUID } from 'crypto';
import { DocumentRepository } from '../repositories/document.repository.js';
import { LedgerRepository } from '../repositories/ledger.repository.js';
import { LedgerService } from '../services/ledger.service.js';
import { getPool } from '../db/connection.js';
import { publishEvent } from '../websocket/event-publisher.js';
import { promises as fs } from 'fs';

export async function documentRoutes(fastify: FastifyInstance): Promise<void> {
  const pool = getPool();
  const documentRepo = new DocumentRepository(pool);
  const ledgerRepo = new LedgerRepository(pool);
  const ledgerService = new LedgerService(ledgerRepo);

  fastify.post(
    '/sessions/:id/documents',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const { id } = request.params;
      const uploadDir = process.env.UPLOAD_DIR || '/app/uploads';

      const data = await request.file();

      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' });
      }

      const buffer = await data.toBuffer();
      const filename = data.filename;
      const mimetype = data.mimetype || 'application/octet-stream';

      const document = await documentRepo.create({
        sessionId: id,
        name: filename,
        type: mimetype,
        size: buffer.length,
        content: buffer,
        uploadDir,
      });

      const event: DocUploadedEvent = {
        id: randomUUID(),
        type: 'doc.uploaded' as EventType.DOC_UPLOADED,
        sessionId: id,
        timestamp: new Date(),
        version: 1,
        documentId: document.id,
        documentName: document.name,
        documentType: document.type,
        uploadedBy: 'system',
      };

      await ledgerService.addEvent(id, event);

      publishEvent(id, event);

      return reply.status(201).send({
        documentId: document.id,
        name: document.name,
        size: document.size,
      });
    }
  );

  fastify.get(
    '/sessions/:id/documents',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const { id } = request.params;
      const documents = await documentRepo.findBySessionId(id);

      return reply.send(documents);
    }
  );

  fastify.get(
    '/sessions/:id/documents/:docId',
    async (
      request: FastifyRequest<{ Params: { id: string; docId: string } }>,
      reply
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: sessionId, docId } = request.params;

      const doc = await documentRepo.findById(docId);

      if (!doc) {
        return reply.status(404).send({ error: 'Document not found' });
      }

      const buffer = await fs.readFile(doc.filePath);

      return reply
        .header('Content-Type', doc.type)
        .header('Content-Disposition', `attachment; filename="${doc.name}"`)
        .header('Content-Length', buffer.length)
        .send(buffer);
    }
  );

  fastify.get(
    '/sessions/:id/documents/:docId/content',
    async (
      request: FastifyRequest<{ Params: { id: string; docId: string } }>,
      reply
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: sessionId, docId } = request.params;

      try {
        const { text, type } = await documentRepo.extractText(docId);

        return reply.send({ text, type });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (errorMessage.includes('not found')) {
          return reply.status(404).send({ error: errorMessage });
        }

        return reply.status(400).send({ error: errorMessage });
      }
    }
  );
}
