import { describe, it, expect } from 'vitest';
import type { AgentProfile, ThesisSession, Document, SessionAgent } from '../types.js';

describe('Types', () => {
  it('should have valid AgentProfile types', () => {
    const profiles: AgentProfile[] = ['debt', 'tech', 'market'];
    expect(profiles).toHaveLength(3);
  });

  it('should validate ThesisSession structure', () => {
    const session: ThesisSession = {
      id: 'sess-123',
      status: 'active',
      hypothesis: 'Test hypothesis',
      documents: [],
      agents: [],
      created_at: new Date(),
      updated_at: new Date(),
    };

    expect(session.id).toBe('sess-123');
    expect(session.status).toBe('active');
  });

  it('should validate Document structure', () => {
    const doc: Document = {
      id: 'doc-456',
      session_id: 'sess-123',
      name: 'test.pdf',
      type: 'application/pdf',
      size: 1024,
      content_hash: 'abc123',
      uploaded_at: new Date(),
    };

    expect(doc.id).toBe('doc-456');
    expect(doc.name).toBe('test.pdf');
  });

  it('should validate SessionAgent structure', () => {
    const agent: SessionAgent = {
      id: 'agent-789',
      session_id: 'sess-123',
      profile_role: 'debt',
      joined_at: new Date(),
      is_active: true,
      budget: {
        credits: 100,
        max_credits: 100,
        last_refill: new Date(),
      },
    };

    expect(agent.id).toBe('agent-789');
    expect(agent.budget.credits).toBe(100);
  });
});
