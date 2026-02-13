import type { Pool } from 'pg';
import type { Session, SessionStatus, VerdictType } from '@thesis/protocol';
import { HypothesisRepository } from './hypothesis.repository.js';

export interface CreateSessionInput {
  hypothesisStatement: string;
  hypothesisDescription?: string;
}

export interface CloseSessionInput {
  sessionId: string;
  finalVerdict: VerdictType;
  rationale?: string;
}

export class SessionRepository {
  constructor(
    private readonly pool: Pool,
    private readonly hypothesisRepo: HypothesisRepository
  ) {}

  async create(input: CreateSessionInput): Promise<{ session: Session; hypothesisId: string }> {
    const hypothesis = await this.hypothesisRepo.create({
      statement: input.hypothesisStatement,
      description: input.hypothesisDescription,
    });

    const query = `
      INSERT INTO sessions (status, hypothesis_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, status, hypothesis_id, created_at, updated_at
    `;

    const result = await this.pool.query(query, [
      'created',
      hypothesis.id,
      new Date(),
      new Date(),
    ]);

    const sessionRow = result.rows[0];

    const session: Session = {
      id: sessionRow.id,
      status: sessionRow.status as SessionStatus,
      hypothesis,
      createdAt: sessionRow.created_at,
      updatedAt: sessionRow.updated_at,
      documents: [],
      agents: [],
    };

    return { session, hypothesisId: hypothesis.id };
  }

  async findById(id: string): Promise<Session | null> {
    const query = `
      SELECT
        s.id,
        s.status,
        s.final_verdict,
        s.closed_at,
        s.hypothesis_id,
        s.created_at,
        s.updated_at,
        h.statement,
        h.description,
        h.confidence
      FROM sessions s
      JOIN hypotheses h ON s.hypothesis_id = h.id
      WHERE s.id = $1
    `;

    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    const session: Session = {
      id: row.id,
      status: row.status as SessionStatus,
      finalVerdict: row.final_verdict as VerdictType | undefined,
      closedAt: row.closed_at || undefined,
      hypothesis: {
        id: row.hypothesis_id,
        statement: row.statement,
        description: row.description,
        confidence: row.confidence,
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      documents: [],
      agents: [],
    };

    return session;
  }

  async close(input: CloseSessionInput): Promise<Session> {
    const { sessionId, finalVerdict, rationale } = input;

    const checkQuery = `
      SELECT id, status, hypothesis_id
      FROM sessions
      WHERE id = $1
    `;

    const checkResult = await this.pool.query(checkQuery, [sessionId]);

    if (checkResult.rows.length === 0) {
      throw new Error(`Session "${sessionId}" not found`);
    }

    const currentStatus = checkResult.rows[0].status;

    if (currentStatus === 'closed') {
      throw new Error(`Session "${sessionId}" is already closed`);
    }

    const updateQuery = `
      UPDATE sessions
      SET status = $1, final_verdict = $2, closed_at = $3, updated_at = $4
      WHERE id = $5
      RETURNING id, status, hypothesis_id, final_verdict, closed_at, created_at, updated_at
    `;

    const result = await this.pool.query(updateQuery, [
      'closed',
      finalVerdict,
      new Date(),
      new Date(),
      sessionId,
    ]);

    const row = result.rows[0];

    const hypothesis = await this.hypothesisRepo.findById(row.hypothesis_id);

    if (!hypothesis) {
      throw new Error(`Hypothesis "${row.hypothesis_id}" not found`);
    }

    return {
      id: row.id,
      status: row.status as SessionStatus,
      finalVerdict: row.final_verdict as VerdictType,
      closedAt: row.closed_at,
      hypothesis,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      documents: [],
      agents: [],
    };
  }
}
