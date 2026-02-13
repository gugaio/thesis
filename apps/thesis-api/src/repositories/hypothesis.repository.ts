import type { Pool } from 'pg';
import { randomUUID } from 'crypto';
import type { Hypothesis } from '@thesis/protocol';

export interface CreateHypothesisInput {
  statement: string;
  description?: string;
  confidence?: number;
}

export class HypothesisRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: CreateHypothesisInput): Promise<Hypothesis> {
    const id = randomUUID();
    const { statement, description, confidence = 0.5 } = input;
    const createdAt = new Date();

    const query = `
      INSERT INTO hypotheses (id, statement, description, confidence, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, statement, description, confidence, created_at
    `;

    const result = await this.pool.query(
      query,
      [id, statement, description, confidence, createdAt]
    );

    return result.rows[0];
  }

  async findById(id: string): Promise<Hypothesis | null> {
    const query = 'SELECT id, statement, description, confidence, created_at FROM hypotheses WHERE id = $1';
    const result = await this.pool.query(query, [id]);

    return result.rows[0] || null;
  }
}
