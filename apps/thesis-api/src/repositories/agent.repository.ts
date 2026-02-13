import type { Pool } from 'pg';
import { randomUUID } from 'crypto';
import type { Agent } from '@thesis/protocol';
import { AgentProfileRepository } from './agent-profile.repository.js';

export interface JoinSessionInput {
  sessionId: string;
  profileRole: string;
  initialCredits?: number;
}

export class AgentRepository {
  constructor(
    private readonly pool: Pool,
    private readonly profileRepo: AgentProfileRepository
  ) {}

  async joinSession(input: JoinSessionInput): Promise<Agent> {
    const { sessionId, profileRole, initialCredits = 100 } = input;

    const profile = await this.profileRepo.findByRole(profileRole);
    if (!profile) {
      throw new Error(`Profile with role "${profileRole}" not found`);
    }

    const sessionCheck = await this.pool.query('SELECT id FROM sessions WHERE id = $1', [sessionId]);
    if (sessionCheck.rows.length === 0) {
      throw new Error(`Session "${sessionId}" not found`);
    }

    const id = randomUUID();
    const joinedAt = new Date();
    const now = new Date();

    const query = `
      INSERT INTO agents (id, profile_id, session_id, joined_at, is_active, budget_credits, budget_max_credits, budget_last_refill)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, joined_at, is_active, budget_credits, budget_max_credits, budget_last_refill
    `;

    const result = await this.pool.query(query, [
      id,
      profile.id,
      sessionId,
      joinedAt,
      true,
      initialCredits,
      initialCredits,
      now,
    ]);

    const row = result.rows[0];

    return {
      id: row.id,
      profile,
      joinedAt: row.joined_at,
      isActive: row.is_active,
      budget: {
        credits: row.budget_credits,
        maxCredits: row.budget_max_credits,
        lastRefill: row.budget_last_refill,
      },
    };
  }

  async findBySessionId(sessionId: string): Promise<Agent[]> {
    const query = `
      SELECT 
        a.id,
        a.joined_at,
        a.is_active,
        a.budget_credits,
        a.budget_max_credits,
        a.budget_last_refill,
        p.id as profile_id,
        p.name as profile_name,
        p.role as profile_role,
        p.description as profile_description,
        p.weight as profile_weight,
        p.soul as profile_soul
      FROM agents a
      JOIN agent_profiles p ON a.profile_id = p.id
      WHERE a.session_id = $1
      ORDER BY a.joined_at ASC
    `;

    const result = await this.pool.query(query, [sessionId]);

    return result.rows.map((row): Agent => ({
      id: row.id,
      profile: {
        id: row.profile_id,
        name: row.profile_name,
        role: row.profile_role,
        description: row.profile_description,
        weight: row.profile_weight,
        soul: row.profile_soul,
      },
      joinedAt: new Date(row.joined_at),
      isActive: row.is_active,
      budget: {
        credits: row.budget_credits,
        maxCredits: row.budget_max_credits,
        lastRefill: new Date(row.budget_last_refill),
      },
    }));
  }

  async findById(id: string): Promise<Agent | null> {
    const query = `
      SELECT 
        a.id,
        a.joined_at,
        a.is_active,
        a.budget_credits,
        a.budget_max_credits,
        a.budget_last_refill,
        p.id as profile_id,
        p.name as profile_name,
        p.role as profile_role,
        p.description as profile_description,
        p.weight as profile_weight,
        p.soul as profile_soul
      FROM agents a
      JOIN agent_profiles p ON a.profile_id = p.id
      WHERE a.id = $1
    `;

    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    const agent: Agent = {
      id: row.id,
      profile: {
        id: row.profile_id,
        name: row.profile_name,
        role: row.profile_role,
        description: row.profile_description,
        weight: row.profile_weight,
        soul: row.profile_soul,
      },
      joinedAt: new Date(row.joined_at),
      isActive: row.is_active,
      budget: {
        credits: row.budget_credits,
        maxCredits: row.budget_max_credits,
        lastRefill: new Date(row.budget_last_refill),
      },
    };

    return agent;
  }
}
