import { describe, it, expect } from 'vitest';
import { SessionStatus } from '../types/session';
import { LedgerEntryType, Verdict, LogLevel } from '../types/ledger';
import { EventType } from '../types/events';
import { CommandType } from '../types/commands';

describe('Protocol Types', () => {
  describe('Session Types', () => {
    it('should have all session status values', () => {
      expect(SessionStatus.CREATED).toBe('created');
      expect(SessionStatus.ACTIVE).toBe('active');
      expect(SessionStatus.PAUSED).toBe('paused');
      expect(SessionStatus.CLOSED).toBe('closed');
    });

    it('should create valid session object', () => {
      const session = {
        id: 'sess-001',
        status: SessionStatus.CREATED,
        hypothesis: {
          id: 'hyp-001',
          statement: 'Test hypothesis',
          description: 'Test description',
          confidence: 0.5
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        documents: [],
        agents: []
      };

      expect(session.id).toBe('sess-001');
      expect(session.status).toBe(SessionStatus.CREATED);
      expect(session.hypothesis.confidence).toBe(0.5);
    });
  });

  describe('Ledger Types', () => {
    it('should have all ledger entry types', () => {
      expect(LedgerEntryType.OPINION).toBe('opinion');
      expect(LedgerEntryType.VOTE).toBe('vote');
      expect(LedgerEntryType.ACTION).toBe('action');
      expect(LedgerEntryType.SYSTEM).toBe('system');
    });

    it('should have all verdict values', () => {
      expect(Verdict.APPROVE).toBe('approve');
      expect(Verdict.REJECT).toBe('reject');
      expect(Verdict.ABSTAIN).toBe('abstain');
    });

    it('should have all log levels', () => {
      expect(LogLevel.INFO).toBe('info');
      expect(LogLevel.WARN).toBe('warn');
      expect(LogLevel.ERROR).toBe('error');
    });
  });

  describe('Event Types', () => {
    it('should have all event types', () => {
      expect(EventType.SESSION_CREATED).toBe('session.created');
      expect(EventType.DOC_UPLOADED).toBe('doc.uploaded');
      expect(EventType.AGENT_JOINED).toBe('agent.joined');
      expect(EventType.OPINION_POSTED).toBe('opinion.posted');
      expect(EventType.VOTE_CAST).toBe('vote.cast');
      expect(EventType.SESSION_CLOSED).toBe('session.closed');
      expect(EventType.BUPDATED).toBe('budget.updated');
      expect(EventType.MESSAGE_SENT).toBe('message.sent');
    });
  });

  describe('Command Types', () => {
    it('should have all command types', () => {
      expect(CommandType.INIT_SESSION).toBe('init_session');
      expect(CommandType.UPLOAD_DOC).toBe('upload_doc');
      expect(CommandType.JOIN_SESSION).toBe('join_session');
      expect(CommandType.POST_OPINION).toBe('post_opinion');
      expect(CommandType.CAST_VOTE).toBe('cast_vote');
      expect(CommandType.CLOSE_SESSION).toBe('close_session');
      expect(CommandType.SEND_MESSAGE).toBe('send_message');
      expect(CommandType.QUERY_STATUS).toBe('query_status');
    });
  });
});
