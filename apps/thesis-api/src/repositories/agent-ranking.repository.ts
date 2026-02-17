import type { Pool } from 'pg';
import { randomUUID } from 'crypto';
import type { AgentRanking } from '@thesis/protocol';
import { getAgentConfig, type AgentProfile } from '@thesis/skills';

export interface UpdateRankingInput {
  agentId: string;
  sessionId: string;
  votedCorrectly?: boolean;
}

export class AgentRankingRepository {
  constructor(private readonly pool: Pool) {}

  async findByAgentId(agentId: string): Promise<AgentRanking | null> {
    const query = `
      SELECT id, agent_id, score, total_votes, correct_votes, total_opinions, avg_confidence, last_updated
      FROM agent_rankings
      WHERE agent_id = $1
    `;

    const result = await this.pool.query(query, [agentId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      id: row.id,
      agentId: row.agent_id,
      score: parseFloat(row.score),
      totalVotes: row.total_votes,
      correctVotes: row.correct_votes,
      totalOpinions: row.total_opinions,
      avgConfidence: row.avg_confidence,
      lastUpdated: row.last_updated,
    };
  }

  async update(input: UpdateRankingInput): Promise<AgentRanking> {
    const { agentId, sessionId, votedCorrectly } = input;

    const checkAgent = await this.pool.query('SELECT id, profile_role FROM agents WHERE id = $1', [agentId]);
    if (checkAgent.rows.length === 0) {
      throw new Error(`Agent "${agentId}" not found`);
    }

    const profileRole = checkAgent.rows[0].profile_role;
    const profile = getAgentConfig(profileRole as 'debt' | 'tech' | 'market' | 'capital');
    const weight = profile.weight;

    const opinionsQuery = `
      SELECT COUNT(*) as count, AVG(confidence) as avg_conf
      FROM opinions o
      JOIN agents a ON o.agent_id = a.id
      WHERE a.id = $1 AND o.session_id = $2
    `;
    const opinionsResult = await this.pool.query(opinionsQuery, [agentId, sessionId]);
    const totalOpinions = parseInt(opinionsResult.rows[0]?.count || '0', 10);
    const avgConfidence = parseFloat(opinionsResult.rows[0]?.avg_conf || '0');

    const existing = await this.findByAgentId(agentId);

    if (existing) {
      const totalVotes = existing.totalVotes + 1;
      const correctVotes = votedCorrectly ? existing.correctVotes + 1 : existing.correctVotes;
      const correctRate = totalVotes > 0 ? correctVotes / totalVotes : 0;
      const score = (correctRate * 10) + (totalOpinions * avgConfidence * weight);

      const updateQuery = `
        UPDATE agent_rankings
        SET score = $1, total_votes = $2, correct_votes = $3, total_opinions = $4, avg_confidence = $5, last_updated = NOW()
        WHERE agent_id = $6
        RETURNING id, agent_id, score, total_votes, correct_votes, total_opinions, avg_confidence, last_updated
      `;

      const result = await this.pool.query(updateQuery, [
        score,
        totalVotes,
        correctVotes,
        totalOpinions,
        avgConfidence,
        agentId,
      ]);

      const row = result.rows[0];

      return {
        id: row.id,
        agentId: row.agent_id,
        score: parseFloat(row.score),
        totalVotes: row.total_votes,
        correctVotes: row.correct_votes,
        totalOpinions: row.total_opinions,
        avgConfidence: row.avg_confidence,
        lastUpdated: row.last_updated,
      };
    } else {
      const totalVotes = 1;
      const correctVotes = votedCorrectly ? 1 : 0;
      const correctRate = correctVotes / totalVotes;
      const score = (correctRate * 10) + (totalOpinions * avgConfidence * weight);

      const id = randomUUID();
      const lastUpdated = new Date();

      const insertQuery = `
        INSERT INTO agent_rankings (id, agent_id, score, total_votes, correct_votes, total_opinions, avg_confidence, last_updated)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, agent_id, score, total_votes, correct_votes, total_opinions, avg_confidence, last_updated
      `;

      const result = await this.pool.query(insertQuery, [
        id,
        agentId,
        score,
        totalVotes,
        correctVotes,
        totalOpinions,
        avgConfidence,
        lastUpdated,
      ]);

      const row = result.rows[0];

      return {
        id: row.id,
        agentId: row.agent_id,
        score: parseFloat(row.score),
        totalVotes: row.total_votes,
        correctVotes: row.correct_votes,
        totalOpinions: row.total_opinions,
        avgConfidence: row.avg_confidence,
        lastUpdated: row.last_updated,
      };
    }
  }

  async listBySessionId(sessionId: string): Promise<AgentRanking[]> {
    const query = `
      SELECT ar.id, ar.agent_id, ar.score, ar.total_votes, ar.correct_votes, ar.total_opinions, ar.avg_confidence, ar.last_updated
      FROM agent_rankings ar
      JOIN agents a ON ar.agent_id = a.id
      WHERE a.session_id = $1
      ORDER BY ar.score DESC
    `;

    const result = await this.pool.query(query, [sessionId]);

    return result.rows.map((row): AgentRanking => ({
      id: row.id,
      agentId: row.agent_id,
      score: parseFloat(row.score),
      totalVotes: row.total_votes,
      correctVotes: row.correct_votes,
      totalOpinions: row.total_opinions,
      avgConfidence: row.avg_confidence,
      lastUpdated: row.last_updated,
    }));
  }

  async listTopAgents(limit: number = 10): Promise<AgentRanking[]> {
    const query = `
      SELECT id, agent_id, score, total_votes, correct_votes, total_opinions, avg_confidence, last_updated
      FROM agent_rankings
      ORDER BY score DESC
      LIMIT $1
    `;

    const result = await this.pool.query(query, [limit]);

    return result.rows.map((row): AgentRanking => ({
      id: row.id,
      agentId: row.agent_id,
      score: parseFloat(row.score),
      totalVotes: row.total_votes,
      correctVotes: row.correct_votes,
      totalOpinions: row.total_opinions,
      avgConfidence: row.avg_confidence,
      lastUpdated: row.last_updated,
    }));
  }
}
