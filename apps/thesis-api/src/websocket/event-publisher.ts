import type { Event } from '@thesis/protocol';
import { broadcastService } from './broadcast.service.js';

export function publishEvent(sessionId: string, event: Event): void {
  broadcastService.broadcast(sessionId, event);
}
