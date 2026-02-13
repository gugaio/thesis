import type { Pool } from 'pg';
import type { AgentProfile } from '@thesis/protocol';

export class AgentProfileRepository {
  constructor(private readonly pool: Pool) {}

  async findByRole(role: string): Promise<AgentProfile | null> {
    const query = `
      SELECT id, name, role, description, weight, soul
      FROM agent_profiles
      WHERE role = $1
    `;

    const result = await this.pool.query(query, [role]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  async findById(id: string): Promise<AgentProfile | null> {
    const query = `
      SELECT id, name, role, description, weight, soul
      FROM agent_profiles
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  async listAll(): Promise<AgentProfile[]> {
    const query = `
      SELECT id, name, role, description, weight, soul
      FROM agent_profiles
      ORDER BY weight DESC
    `;

    const result = await this.pool.query(query);

    return result.rows;
  }
}
