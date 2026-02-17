import type { Pool } from 'pg';
import { randomUUID } from 'crypto';
import type { Agent } from '@thesis/protocol';
import { getAgentConfig, type AgentProfile } from '@thesis/skills';

export interface JoinSessionInput {
  sessionId: string;
  profileRole: string;
  initialCredits?: number;
}

export class AgentRepository {
  constructor(private readonly pool: Pool) {}

  private getAgentProfile(role: string): AgentProfile {
    try {
      return getAgentConfig(role as 'debt' | 'tech' | 'market' | 'capital');
    } catch {
      throw new Error(`Profile with role "${role}" not found`);
    }
  }

  async joinSession(input: JoinSessionInput): Promise<Agent> {
    const { sessionId, profileRole, initialCredits = 100 } = input;

    const profile = this.getAgentProfile(profileRole);

    const sessionCheck = await this.pool.query('SELECT id FROM sessions WHERE id = $1', [sessionId]);
    if (sessionCheck.rows.length === 0) {
      throw new Error(`Session "${sessionId}" not found`);
    }

    const id = randomUUID();
    const joinedAt = new Date();
    const now = new Date();

    const query = `
      INSERT INTO agents (id, profile_role, session_id, joined_at, is_active, budget_credits, budget_max_credits, budget_last_refill)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, joined_at, is_active, budget_credits, budget_max_credits, budget_last_refill
    `;

    const result = await this.pool.query(query, [
      id,
      profileRole,
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
      profile: { ...profile, id: profileRole },
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
        a.profile_role
      FROM agents a
      WHERE a.session_id = $1
      ORDER BY a.joined_at ASC
    `;

    const result = await this.pool.query(query, [sessionId]);

    return result.rows.map((row): Agent => {
      const profile = this.getAgentProfile(row.profile_role);
      return {
        id: row.id,
        profile: { ...profile, id: row.profile_role },
        joinedAt: new Date(row.joined_at),
        isActive: row.is_active,
        budget: {
          credits: row.budget_credits,
          maxCredits: row.budget_max_credits,
          lastRefill: new Date(row.budget_last_refill),
        },
      };
    });
  }

  async findBySessionIdAndAgentId(sessionId: string, agentId: string): Promise<Agent | null> {
    const query = `
      SELECT
        a.id,
        a.joined_at,
        a.is_active,
        a.budget_credits,
        a.budget_max_credits,
        a.budget_last_refill,
        a.profile_role
      FROM agents a
      WHERE a.session_id = $1 AND a.id = $2
    `;

    const result = await this.pool.query(query, [sessionId, agentId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const profile = this.getAgentProfile(row.profile_role);

    return {
      id: row.id,
      profile: { ...profile, id: row.profile_role },
      joinedAt: new Date(row.joined_at),
      isActive: row.is_active,
      budget: {
        credits: row.budget_credits,
        maxCredits: row.budget_max_credits,
        lastRefill: new Date(row.budget_last_refill),
      },
    };
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
        a.profile_role
      FROM agents a
      WHERE a.id = $1
    `;

    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const profile = this.getAgentProfile(row.profile_role);

    return {
      id: row.id,
      profile: { ...profile, id: row.profile_role },
      joinedAt: new Date(row.joined_at),
      isActive: row.is_active,
      budget: {
        credits: row.budget_credits,
        maxCredits: row.budget_max_credits,
        lastRefill: new Date(row.budget_last_refill),
      },
    };
  }

  async decrementBudget(agentId: string, amount: number): Promise<Agent> {
    const updateQuery = `
      UPDATE agents
      SET budget_credits = budget_credits - $1
      WHERE id = $2
      RETURNING id, budget_credits, budget_max_credits, budget_last_refill, joined_at, is_active, profile_role
    `;

    const result = await this.pool.query(updateQuery, [amount, agentId]);

    if (result.rows.length === 0) {
      throw new Error(`Agent "${agentId}" not found`);
    }

    const row = result.rows[0];
    const profile = this.getAgentProfile(row.profile_role);

    return {
      id: row.id,
      profile: { ...profile, id: row.profile_role },
      joinedAt: new Date(row.joined_at),
      isActive: row.is_active,
      budget: {
        credits: row.budget_credits,
        maxCredits: row.budget_max_credits,
        lastRefill: new Date(row.budget_last_refill),
      },
    };
  }
}
