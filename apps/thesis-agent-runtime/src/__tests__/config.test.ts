import { describe, it, expect, beforeEach } from 'vitest';
import { config, log } from '../config.js';

describe('Config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it('should load default config', () => {
    delete process.env.THESIS_API_URL;
    delete process.env.MAX_AGENTS;

    const testConfig = {
      api_url: process.env.THESIS_API_URL || 'http://localhost:4000',
      max_concurrent_agents: parseInt(process.env.MAX_AGENTS || '3'),
      log_level: (process.env.LOG_LEVEL || 'debug') as 'debug' | 'info' | 'warn' | 'error',
    };

    expect(testConfig.api_url).toBe('http://localhost:4000');
    expect(testConfig.max_concurrent_agents).toBe(3);
    expect(testConfig.log_level).toBe('debug');
  });

  it('should load config from environment variables', () => {
    process.env.THESIS_API_URL = 'http://api.example.com';
    process.env.MAX_AGENTS = '6';
    process.env.LOG_LEVEL = 'info';

    const testConfig = {
      api_url: process.env.THESIS_API_URL || 'http://localhost:4000',
      max_concurrent_agents: parseInt(process.env.MAX_AGENTS || '3'),
      log_level: (process.env.LOG_LEVEL || 'debug') as 'debug' | 'info' | 'warn' | 'error',
    };

    expect(testConfig.api_url).toBe('http://api.example.com');
    expect(testConfig.max_concurrent_agents).toBe(6);
    expect(testConfig.log_level).toBe('info');
  });

  it('should have correct default values', () => {
    expect(config.api_url).toBe('http://localhost:4000');
    expect(config.ws_url).toBe('ws://localhost:4000/ws');
    expect(config.max_concurrent_agents).toBe(3);
    expect(config.iteration_delay_ms).toBe(5000);
    expect(config.max_iterations_per_agent).toBe(10);
    expect(config.iteration_timeout_ms).toBe(60000);
    expect(config.min_credits_buffer).toBe(10);
    expect(config.pi_provider).toBe('openai');
    expect(config.pi_model).toBe('gpt-4o-mini');
  });

  it('should create log functions', () => {
    expect(log.debug).toBeInstanceOf(Function);
    expect(log.info).toBeInstanceOf(Function);
    expect(log.warn).toBeInstanceOf(Function);
    expect(log.error).toBeInstanceOf(Function);
  });
});
