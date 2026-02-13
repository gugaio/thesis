import type { Pool } from 'pg';
import { randomUUID } from 'crypto';
import type { OpinionEntry, LedgerEntryType } from '@thesis/protocol';

export interface CreateOpinionInput {
  sessionId: string;
  agentId: string;
  content: string;
  confidence: number;
}

export class OpinionRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: CreateOpinionInput): Promise<OpinionEntry> {
    const { sessionId, agentId, content, confidence } = input;
    const id = randomUUID();
    const postedAt = new Date();

    const query = `
      INSERT INTO opinions (id, session_id, agent_id, content, confidence, posted_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, content, confidence, posted_at
    `;

    const result = await this.pool.query(query, [id, sessionId, agentId, content, confidence, postedAt]);

    const row = result.rows[0];

    return {
      id,
      timestamp: row.posted_at,
      type: 'opinion' as LedgerEntryType.OPINION,
      agentId,
      content: row.content,
      confidence: row.confidence,
      references: [],
      metadata: {},
    };
  }

  async findBySessionId(sessionId: string): Promise<OpinionEntry[]> {
    const query = `
      SELECT 
        o.id,
        o.content,
        o.confidence,
        o.posted_at,
        o.agent_id
      FROM opinions o
      WHERE o.session_id = $1
      ORDER BY o.posted_at ASC
    `;

    const result = await this.pool.query(query, [sessionId]);

    return result.rows.map((row) => ({
      id: row.id,
      timestamp: row.posted_at,
      type: 'opinion' as LedgerEntryType.OPINION,
      agentId: row.agent_id,
      content: row.content,
      confidence: row.confidence,
      references: [],
      metadata: {},
    }));
  }

  async findByAgentId(agentId: string): Promise<OpinionEntry[]> {
    const query = `
      SELECT 
        o.id,
        o.content,
        o.confidence,
        o.posted_at,
        o.agent_id
      FROM opinions o
      WHERE o.agent_id = $1
      ORDER BY o.posted_at ASC
    `;

    const result = await this.pool.query(query, [agentId]);

    return result.rows.map((row) => ({
      id: row.id,
      timestamp: row.posted_at,
      type: 'opinion' as LedgerEntryType.OPINION,
      agentId: row.agent_id,
      content: row.content,
      confidence: row.confidence,
      references: [],
      metadata: {},
    }));
  }
}
