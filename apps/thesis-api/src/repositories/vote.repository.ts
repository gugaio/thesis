import type { Pool } from 'pg';
import { randomUUID } from 'crypto';
import type { Vote, VerdictType } from '@thesis/protocol';

export interface CreateVoteInput {
  sessionId: string;
  agentId: string;
  verdict: VerdictType;
  rationale: string;
}

export class VoteRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: CreateVoteInput): Promise<Vote> {
    const { sessionId, agentId, verdict, rationale } = input;

    const checkSession = await this.pool.query('SELECT id, status FROM sessions WHERE id = $1', [sessionId]);
    if (checkSession.rows.length === 0) {
      throw new Error(`Session "${sessionId}" not found`);
    }

    const sessionStatus = checkSession.rows[0].status;
    if (sessionStatus === 'closed') {
      throw new Error(`Session "${sessionId}" is already closed`);
    }

    const checkAgent = await this.pool.query(
      'SELECT id FROM agents WHERE id = $1 AND session_id = $2',
      [agentId, sessionId]
    );
    if (checkAgent.rows.length === 0) {
      throw new Error(`Agent "${agentId}" not found in session "${sessionId}"`);
    }

    const checkExistingVote = await this.pool.query(
      'SELECT id FROM votes WHERE session_id = $1 AND agent_id = $2',
      [sessionId, agentId]
    );
    if (checkExistingVote.rows.length > 0) {
      throw new Error(`Agent "${agentId}" has already voted in session "${sessionId}"`);
    }

    const id = randomUUID();
    const votedAt = new Date();

    const query = `
      INSERT INTO votes (id, session_id, agent_id, verdict, rationale, voted_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, session_id, agent_id, verdict, rationale, voted_at
    `;

    const result = await this.pool.query(query, [id, sessionId, agentId, verdict, rationale, votedAt]);
    const row = result.rows[0];

    return {
      id: row.id,
      sessionId: row.session_id,
      agentId: row.agent_id,
      verdict: row.verdict as VerdictType,
      rationale: row.rationale,
      votedAt: row.voted_at,
    };
  }

  async findBySessionId(sessionId: string): Promise<Vote[]> {
    const query = `
      SELECT id, session_id, agent_id, verdict, rationale, voted_at
      FROM votes
      WHERE session_id = $1
      ORDER BY voted_at ASC
    `;

    const result = await this.pool.query(query, [sessionId]);

    return result.rows.map((row): Vote => ({
      id: row.id,
      sessionId: row.session_id,
      agentId: row.agent_id,
      verdict: row.verdict as VerdictType,
      rationale: row.rationale,
      votedAt: row.voted_at,
    }));
  }

  async findBySessionIdAndAgentId(sessionId: string, agentId: string): Promise<Vote | null> {
    const query = `
      SELECT id, session_id, agent_id, verdict, rationale, voted_at
      FROM votes
      WHERE session_id = $1 AND agent_id = $2
    `;

    const result = await this.pool.query(query, [sessionId, agentId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      id: row.id,
      sessionId: row.session_id,
      agentId: row.agent_id,
      verdict: row.verdict as VerdictType,
      rationale: row.rationale,
      votedAt: row.voted_at,
    };
  }

  async countBySessionId(sessionId: string): Promise<{ approve: number; reject: number; abstain: number }> {
    const query = `
      SELECT verdict, COUNT(*) as count
      FROM votes
      WHERE session_id = $1
      GROUP BY verdict
    `;

    const result = await this.pool.query(query, [sessionId]);

    const counts = { approve: 0, reject: 0, abstain: 0 };

    for (const row of result.rows) {
      if (row.verdict === 'approve') counts.approve = parseInt(row.count, 10);
      else if (row.verdict === 'reject') counts.reject = parseInt(row.count, 10);
      else if (row.verdict === 'abstain') counts.abstain = parseInt(row.count, 10);
    }

    return counts;
  }
}
