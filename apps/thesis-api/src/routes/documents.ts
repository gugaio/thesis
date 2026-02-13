import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { DocUploadedEvent, EventType } from '@thesis/protocol';
import { randomUUID } from 'crypto';
import { DocumentRepository } from '../repositories/document.repository.js';
import { LedgerRepository } from '../repositories/ledger.repository.js';
import { LedgerService } from '../services/ledger.service.js';
import { getPool } from '../db/connection.js';
import { publishEvent } from '../websocket/event-publisher.js';

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
}
