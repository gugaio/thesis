#!/usr/bin/env node

import dotenv from 'dotenv';
import { log } from './config.js';

dotenv.config();

log.info('THESIS Agent Runtime v0.1.0');
log.info('Automated multi-agent analysis system using Worker Threads and Mono-pi');

if (process.argv.length < 3) {
  log.error('Usage: thesis-agent-runtime <command> [options]');
  log.error('Commands: analyze <session-id>');
  process.exit(1);
}

const command = process.argv[2];

switch (command) {
  case 'analyze':
    if (!process.argv[3]) {
      log.error('Error: analyze command requires <session-id>');
      process.exit(1);
    }
    const sessionId = process.argv[3];
    log.info(`Starting analysis for session: ${sessionId}`);
    log.info('This will be implemented in the CLI integration phase');
    break;

  default:
    log.error(`Unknown command: ${command}`);
    process.exit(1);
}
