import dotenv from 'dotenv';
import type { RuntimeConfig } from './types.js';

dotenv.config();

export const config: RuntimeConfig = {
  api_url: process.env.THESIS_API_URL || 'http://localhost:4000',
  ws_url: process.env.THESIS_WS_URL || 'ws://localhost:4000/ws',
  max_concurrent_agents: parseInt(process.env.MAX_AGENTS || '3'),
  iteration_delay_ms: parseInt(process.env.ITERATION_DELAY_MS || '5000'),
  max_iterations_per_agent: parseInt(process.env.MAX_ITERATIONS_PER_AGENT || '10'),
  iteration_timeout_ms: parseInt(process.env.ITERATION_TIMEOUT_MS || '60000'),
  min_credits_buffer: parseInt(process.env.MIN_CREDITS_BUFFER || '10'),
  log_level: (process.env.LOG_LEVEL || 'debug') as 'debug' | 'info' | 'warn' | 'error',
  pi_provider: process.env.PI_PROVIDER || 'openai',
  pi_model: process.env.PI_MODEL || 'gpt-4o-mini',
  pi_api_key: process.env.PI_API_KEY,
};

export function logger(level: 'debug' | 'info' | 'warn' | 'error'): (message: string, ...args: any[]) => void {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  const currentLevel = levels[level];
  const configLevel = levels[config.log_level];

  if (currentLevel >= configLevel) {
    return (message: string, ...args: any[]) => {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      
      switch (level) {
        case 'debug':
          console.debug(prefix, message, ...args);
          break;
        case 'info':
          console.info(prefix, message, ...args);
          break;
        case 'warn':
          console.warn(prefix, message, ...args);
          break;
        case 'error':
          console.error(prefix, message, ...args);
          break;
      }
    };
  }

  return () => {};
}

export const log = {
  debug: logger('debug'),
  info: logger('info'),
  warn: logger('warn'),
  error: logger('error'),
};
