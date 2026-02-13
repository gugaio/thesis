import type { Event } from '@thesis/protocol';

export class LedgerService {
  private events: Map<string, Event[]> = new Map();

  async addEvent(sessionId: string, event: Event): Promise<void> {
    const sessionEvents = this.events.get(sessionId) || [];
    sessionEvents.push(event);
    this.events.set(sessionId, sessionEvents);
  }

  async getEvents(sessionId: string): Promise<Event[]> {
    return this.events.get(sessionId) || [];
  }
}
