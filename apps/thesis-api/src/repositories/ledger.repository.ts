import type { Pool } from 'pg';
import type { Event } from '@thesis/protocol';

export class LedgerRepository {
  constructor(private pool: Pool) {}

  async addEvent(sessionId: string, event: Event): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        'INSERT INTO events (id, session_id, event_type, event_data) VALUES ($1, $2, $3, $4)',
        [event.id, sessionId, event.type, JSON.stringify(event)]
      );
    } finally {
      client.release();
    }
  }

  async getEvents(sessionId: string): Promise<Event[]> {
    const result = await this.pool.query(
      'SELECT event_data FROM events WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    );

    return result.rows.map((row) => row.event_data as Event);
  }

  async getLatestEvent(sessionId: string, eventType: string): Promise<Event | null> {
    const result = await this.pool.query(
      `SELECT event_data FROM events 
       WHERE session_id = $1 AND event_type = $2 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [sessionId, eventType]
    );

    return result.rows[0]?.event_data as Event || null;
  }
}
