import type { Event } from '@thesis/protocol';
import { LedgerRepository } from '../repositories/ledger.repository.js';

export class LedgerService {
  private ledgerRepo: LedgerRepository;

  constructor(ledgerRepo: LedgerRepository) {
    this.ledgerRepo = ledgerRepo;
  }

  async addEvent(sessionId: string, event: Event): Promise<void> {
    await this.ledgerRepo.addEvent(sessionId, event);
  }

  async getEvents(sessionId: string): Promise<Event[]> {
    return this.ledgerRepo.getEvents(sessionId);
  }
}
