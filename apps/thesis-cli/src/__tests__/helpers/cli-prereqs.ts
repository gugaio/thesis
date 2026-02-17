import { existsSync } from 'fs';
import path from 'path';

const DEFAULT_API_URL = 'http://localhost:4000';

function normalizeBaseUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export async function ensureCliIntegrationPrerequisites(): Promise<void> {
  const cliPath = path.join(__dirname, '../../dist/index.js');
  if (!existsSync(cliPath)) {
    throw new Error(
      [
        `CLI build not found at ${cliPath}.`,
        'Run: pnpm --filter @thesis/cli build',
      ].join(' ')
    );
  }

  const apiBaseUrl = normalizeBaseUrl(process.env.API_URL || DEFAULT_API_URL);
  const healthUrl = `${apiBaseUrl}/health`;

  let response: Response;
  try {
    response = await fetch(healthUrl);
  } catch {
    throw new Error(
      [
        `API is not reachable at ${healthUrl}.`,
        'Run: pnpm --filter @thesis/api dev',
      ].join(' ')
    );
  }

  if (!response.ok) {
    throw new Error(`API healthcheck failed at ${healthUrl} with status ${response.status}.`);
  }
}
