interface GatewayLogContext {
  sessionId: string;
  iteration?: number;
  action?: string;
}

function contextToPrefix(context: GatewayLogContext): string {
  const parts = [`session=${context.sessionId}`];
  if (context.iteration !== undefined) {
    parts.push(`iter=${context.iteration}`);
  }
  if (context.action) {
    parts.push(`action=${context.action}`);
  }
  return `[Gateway ${parts.join(' ')}]`;
}

export function logInfo(context: GatewayLogContext, message: string): void {
  console.log(`${contextToPrefix(context)} ${message}`);
}

export function logWarn(context: GatewayLogContext, message: string): void {
  console.warn(`${contextToPrefix(context)} ${message}`);
}

export function logError(context: GatewayLogContext, message: string, error?: unknown): void {
  if (error) {
    console.error(`${contextToPrefix(context)} ${message}`, error);
    return;
  }
  console.error(`${contextToPrefix(context)} ${message}`);
}
