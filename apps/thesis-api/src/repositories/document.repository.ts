import type { Pool } from 'pg';
import { createHash } from 'crypto';
import type { Document } from '@thesis/protocol';
import { mkdirSync, promises as fs } from 'fs';

export interface CreateDocumentInput {
  sessionId: string;
  name: string;
  type: string;
  size: number;
  content: Buffer;
  uploadDir: string;
}

export class DocumentRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: CreateDocumentInput): Promise<Document> {
    const { sessionId, name, type, size, content, uploadDir } = input;

    const contentHash = createHash('sha256').update(content).digest('hex');
    const fileName = `${contentHash}-${Date.now()}-${name}`;
    const filePath = `${uploadDir}/${fileName}`;

    await mkdirSync(uploadDir, { recursive: true });
    await fs.writeFile(filePath, content);

    const query = `
      INSERT INTO documents (session_id, name, type, size, content_hash, file_path, uploaded_at)
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, type, size, uploaded_at, content_hash
    `;

    const result = await this.pool.query(query, [
      sessionId,
      name,
      type,
      size,
      contentHash,
      filePath,
      new Date(),
    ]);

    const row = result.rows[0];

    return {
      id: row.id,
      name: row.name,
      type: row.type,
      size: row.size,
      uploadedAt: row.uploaded_at,
      contentHash: row.content_hash,
    };
  }

  async findBySessionId(sessionId: string): Promise<Document[]> {
    const query = `
      SELECT id, name, type, size, uploaded_at, content_hash
      FROM documents
      WHERE session_id = $1
      ORDER BY uploaded_at ASC
    `;

    const result = await this.pool.query(query, [sessionId]);

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      size: row.size,
      uploadedAt: row.uploaded_at,
      contentHash: row.content_hash,
    }));
  }

  async findById(id: string): Promise<(Document & { filePath: string }) | null> {
    const query = `
      SELECT id, name, type, size, uploaded_at, content_hash, file_path
      FROM documents
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      id: row.id,
      name: row.name,
      type: row.type,
      size: row.size,
      uploadedAt: row.uploaded_at,
      contentHash: row.content_hash,
      filePath: row.file_path,
    };
  }

  async getFilePath(id: string): Promise<string | null> {
    const doc = await this.findById(id);
    return doc ? doc.filePath : null;
  }

  async extractText(id: string): Promise<{ text: string; type: string }> {
    const doc = await this.findById(id);

    if (!doc) {
      throw new Error('Document not found');
    }

    const buffer = await fs.readFile(doc.filePath);
    const mimeType = doc.type;

    if (mimeType === 'text/csv' || mimeType === 'text/tab-separated-values' || mimeType === 'text/plain' || mimeType === 'text/markdown') {
      return { text: buffer.toString('utf-8'), type: mimeType };
    }

    throw new Error(`Unsupported file type: ${mimeType}. Only CSV, TSV, TXT, and MD files can be previewed as text. Please download the file to view.`);
  }
}
