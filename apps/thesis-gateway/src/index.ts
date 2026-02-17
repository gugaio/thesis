import dotenv from 'dotenv';
import { SessionRunner } from './session-runner.js';
import { logError, logInfo } from './logger.js';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:4000';
const WS_URL = process.env.WS_URL || 'ws://localhost:4000';
const MAX_ITERATIONS = parseInt(process.env.MAX_ITERATIONS || '10', 10);
const ITERATION_TIMEOUT = parseInt(process.env.ITERATION_TIMEOUT || '60000', 10);
const ITERATION_DELAY = parseInt(process.env.ITERATION_DELAY || '2000', 10);
const PI_PROVIDER = process.env.PI_PROVIDER || 'openai';
const PI_MODEL = process.env.PI_MODEL || 'gpt-4o-mini';

async function main(): Promise<void> {
  const sessionId = process.argv[2];
  if (!sessionId) {
    console.error('❌ Error: Missing session ID');
    console.error('Usage: node dist/index.js <session-id>');
    process.exit(1);
  }

  const runner = new SessionRunner(sessionId, {
    apiUrl: API_URL,
    wsUrl: WS_URL,
    maxIterations: MAX_ITERATIONS,
    iterationTimeout: ITERATION_TIMEOUT,
    iterationDelay: ITERATION_DELAY,
    piProvider: PI_PROVIDER,
    piModel: PI_MODEL,
  });

  process.on('SIGTERM', () => {
    logInfo({ sessionId }, 'Received SIGTERM, stopping runner');
    runner.stop();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logInfo({ sessionId }, 'Received SIGINT, stopping runner');
    runner.stop();
    process.exit(0);
  });

  try {
    await runner.start();
    process.exit(0);
  } catch (error) {
    logError({ sessionId }, 'Fatal runner error', error);
    process.exit(1);
  }
}

main();
