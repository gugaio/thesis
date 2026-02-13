import type { Pool } from 'pg';
import { randomUUID } from 'crypto';

export interface CreateMessageInput {
  sessionId: string;
  fromAgentId: string;
  toAgentId: string;
  content: string;
}

export interface Message {
  id: string;
  sessionId: string;
  fromAgentId: string;
  toAgentId: string;
  content: string;
  sentAt: Date;
  readAt: Date | null;
}

export class MessageRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: CreateMessageInput): Promise<Message> {
    const { sessionId, fromAgentId, toAgentId, content } = input;
    const id = randomUUID();
    const sentAt = new Date();

    const query = `
      INSERT INTO messages (id, session_id, from_agent_id, to_agent_id, content, sent_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, session_id, from_agent_id, to_agent_id, content, sent_at, read_at
    `;

    const result = await this.pool.query(query, [
      id,
      sessionId,
      fromAgentId,
      toAgentId,
      content,
      sentAt,
    ]);

    const row = result.rows[0];

    return {
      id: row.id,
      sessionId: row.session_id,
      fromAgentId: row.from_agent_id,
      toAgentId: row.to_agent_id,
      content: row.content,
      sentAt: row.sent_at,
      readAt: row.read_at,
    };
  }

  async findBySessionId(sessionId: string, agentId?: string): Promise<Message[]> {
    let query = `
      SELECT 
        id, 
        session_id, 
        from_agent_id, 
        to_agent_id, 
        content, 
        sent_at, 
        read_at
      FROM messages
      WHERE session_id = $1
    `;

    const params: (string | number)[] = [sessionId];

    if (agentId) {
      query += ` AND (from_agent_id = $2 OR to_agent_id = $2)`;
      params.push(agentId);
    }

    query += ` ORDER BY sent_at ASC`;

    const result = await this.pool.query(query, params);

    return result.rows.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      fromAgentId: row.from_agent_id,
      toAgentId: row.to_agent_id,
      content: row.content,
      sentAt: row.sent_at,
      readAt: row.read_at,
    }));
  }

  async findUnreadByAgentId(agentId: string): Promise<Message[]> {
    const query = `
      SELECT 
        id, 
        session_id, 
        from_agent_id, 
        to_agent_id, 
        content, 
        sent_at, 
        read_at
      FROM messages
      WHERE to_agent_id = $1
        AND read_at IS NULL
      ORDER BY sent_at ASC
    `;

    const result = await this.pool.query(query, [agentId]);

    return result.rows.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      fromAgentId: row.from_agent_id,
      toAgentId: row.to_agent_id,
      content: row.content,
      sentAt: row.sent_at,
      readAt: row.read_at,
    }));
  }

  async markAsRead(messageId: string, agentId: string): Promise<void> {
    const query = `
      UPDATE messages
      SET read_at = NOW()
      WHERE id = $1
        AND to_agent_id = $2
        AND read_at IS NULL
    `;

    await this.pool.query(query, [messageId, agentId]);
  }

  async markAllAsRead(agentId: string): Promise<number> {
    const query = `
      UPDATE messages
      SET read_at = NOW()
      WHERE to_agent_id = $1
        AND read_at IS NULL
      RETURNING id
    `;

    const result = await this.pool.query(query, [agentId]);
    return result.rowCount || 0;
  }
}
