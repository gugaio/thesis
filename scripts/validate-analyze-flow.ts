#!/usr/bin/env node

import { ApiClient } from '../apps/thesis-cli/src/client/api-client.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ValidateOptions {
  hypothesis?: string;
  description?: string;
  documentFile?: string;
  iterations?: number;
  timeout?: number;
  generateReport?: boolean;
  reportPath?: string;
}

async function validateAnalyzeFlow(options: ValidateOptions = {}): Promise<void> {
  console.log('🚀 THESIS - Validating CLI analyze Flow with Real LLM\n');

  const apiUrl = process.env.API_URL || 'http://localhost:4000';
  const piApiKey = process.env.PI_API_KEY;

  if (!piApiKey || piApiKey === 'sk-your-api-key-here' || piApiKey === '') {
    console.error('❌ Error: PI_API_KEY not configured in .env');
    console.error('Please add your OpenAI API key to the .env file:');
    console.error('PI_API_KEY=sk-your-real-api-key-here\n');
    process.exit(1);
  }

  const client = new ApiClient(apiUrl);

  try {
    console.log('Step 1: Creating test session...');
    const hypothesis = options.hypothesis || 'Real LLM Test: AI-powered SaaS startup with strong market fit';
    const description = options.description || 'Validation test for CLI analyze command with real LLM integration';
    
    const sessionResult = await client.createSession(hypothesis, description);
    const sessionId = sessionResult.sessionId;
    
    console.log('✅ Session created successfully!');
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   Hypothesis: ${hypothesis}\n`);

    console.log('Step 2: Uploading test document...');
    let documentId: string | undefined;
    
    if (options.documentFile) {
      const docResult = await client.uploadDocument(sessionId, options.documentFile);
      documentId = docResult.documentId;
      console.log('✅ Document uploaded successfully!');
      console.log(`   Document ID: ${documentId}`);
      console.log(`   File: ${options.documentFile}\n`);
    } else {
      console.log('ℹ️  No document file provided, skipping upload\n');
    }

    console.log('Step 3: Running analyze command with real LLM...');
    console.log(`   API URL: ${apiUrl}`);
    console.log(`   PI Provider: ${process.env.PI_PROVIDER || 'openai'}`);
    console.log(`   PI Model: ${process.env.PI_MODEL || 'gpt-4o-mini'}`);
    console.log(`   Max Iterations: ${options.iterations || 5}`);
    console.log(`   Timeout: ${options.timeout || 60000}ms\n`);

    const cliPath = join(__dirname, '../apps/thesis-cli/dist/index.js');
    const iterations = options.iterations || 5;
    const timeout = options.timeout || 60000;

    console.log('='.repeat(80));
    console.log('Gateway Output (Real-time):');
    console.log('='.repeat(80) + '\n');

    const gatewayProcess = spawn('node', [cliPath, 'analyze', '--session', sessionId, '--iterations', String(iterations), '--timeout', String(timeout)], {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
        API_URL: apiUrl,
        WS_URL: process.env.WS_URL || 'ws://localhost:4000',
        MAX_ITERATIONS: String(iterations),
        ITERATION_TIMEOUT: String(timeout),
        ITERATION_DELAY: '2000',
        PI_PROVIDER: process.env.PI_PROVIDER || 'openai',
        PI_MODEL: process.env.PI_MODEL || 'gpt-4o-mini',
        PI_API_KEY: piApiKey,
      },
    });

    const gatewayExitCode = await new Promise<number>((resolve) => {
      gatewayProcess.on('exit', (code) => resolve(code || 0));
    });

    console.log('\n' + '='.repeat(80));
    console.log('Gateway Execution Complete');
    console.log('='.repeat(80) + '\n');

    if (gatewayExitCode !== 0) {
      console.error(`❌ Gateway process exited with code ${gatewayExitCode}`);
      console.error('Analyze command failed\n');
      process.exit(1);
    }

    console.log('✅ Analyze command completed successfully!\n');

    console.log('Step 4: Validating results...');
    
    const session = await client.getSession(sessionId);
    console.log('✅ Session status:', session.session.status);
    console.log(`   Final Verdict: ${session.session.finalVerdict || 'N/A'}`);
    
    const agents = await client.listAgents(sessionId);
    console.log(`   Agents registered: ${agents.length}`);
    
    const opinions = await client.listOpinions(sessionId);
    console.log(`   Opinions posted: ${opinions.length}`);
    
    const messagesResult = await client.listMessages(sessionId);
    const messages = messagesResult.messages || [];
    console.log(`   Messages exchanged: ${messages.length}`);
    
    const votes = await client.listVotes(sessionId);
    console.log(`   Votes cast: ${votes.length}`);
    console.log();

    console.log('Step 5: Analyzing agent behavior...');
    
    opinions.forEach((opinion: any, idx: number) => {
      const agent = agents.find((a: any) => a.id === opinion.agentId);
      const agentName = agent ? agent.profile.name : `Agent ${opinion.agentId.substring(0, 8)}`;
      console.log(`   Opinion ${idx + 1} (${agentName}):`);
      console.log(`     Confidence: ${opinion.confidence}`);
      console.log(`     Content: ${opinion.content.substring(0, 100)}...`);
    });
    console.log();

    messages.forEach((message: any, idx: number) => {
      const fromAgent = agents.find((a: any) => a.id === message.fromAgentId);
      const toAgent = agents.find((a: any) => a.id === message.toAgentId);
      const fromName = fromAgent ? fromAgent.profile.name : `Agent ${message.fromAgentId.substring(0, 8)}`;
      const toName = toAgent ? toAgent.profile.name : `Agent ${message.toAgentId.substring(0, 8)}`;
      console.log(`   Message ${idx + 1} (${fromName} → ${toName}):`);
      console.log(`     Content: ${message.content.substring(0, 100)}...`);
    });
    console.log();

    votes.forEach((vote: any, idx: number) => {
      const agent = agents.find((a: any) => a.id === vote.agentId);
      const agentName = agent ? agent.profile.name : `Agent ${vote.agentId.substring(0, 8)}`;
      console.log(`   Vote ${idx + 1} (${agentName}):`);
      console.log(`     Verdict: ${vote.verdict}`);
      console.log(`     Rationale: ${vote.rationale.substring(0, 100)}...`);
    });
    console.log();

    if (options.generateReport !== false) {
      console.log('Step 6: Generating final report...');
      
      const reportPath = options.reportPath || join(process.cwd(), `validation-report-${Date.now()}.json`);
      const report = await client.getReport(sessionId);
      
      const fs = await import('fs');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      
      console.log('✅ Report generated successfully!');
      console.log(`   File: ${reportPath}\n`);
      
      console.log('Report Summary:');
      console.log(`   Session ID: ${report.session.id}`);
      console.log(`   Status: ${report.session.status}`);
      console.log(`   Final Verdict: ${report.session.finalVerdict}`);
      console.log(`   Vote Counts:`);
      console.log(`     Approve: ${report.voteCounts.approve}`);
      console.log(`     Reject: ${report.voteCounts.reject}`);
      console.log(`     Abstain: ${report.voteCounts.abstain}`);
      console.log();
      
      console.log('Agent Rankings:');
      report.rankings.forEach((ranking: any, idx: number) => {
        const agent = agents.find((a: any) => a.id === ranking.agentId);
        const agentName = agent ? agent.profile.name : `Agent ${ranking.agentId.substring(0, 8)}`;
        console.log(`   ${idx + 1}. ${agentName}:`);
        console.log(`      Score: ${ranking.score}`);
        console.log(`      Total Votes: ${ranking.totalVotes}`);
        console.log(`      Correct Votes: ${ranking.correctVotes}`);
        console.log(`      Total Opinions: ${ranking.totalOpinions}`);
        console.log(`      Avg Confidence: ${ranking.avgConfidence.toFixed(2)}`);
      });
      console.log();
    }

    console.log('='.repeat(80));
    console.log('✅ VALIDATION COMPLETE - All checks passed!');
    console.log('='.repeat(80));
    console.log();
    console.log('Summary:');
    console.log(`  Session ID: ${sessionId}`);
    console.log(`  Status: ${session.session.status}`);
    console.log(`  Final Verdict: ${session.session.finalVerdict}`);
    console.log(`  Agents: ${agents.length}`);
    console.log(`  Opinions: ${opinions.length}`);
    console.log(`  Messages: ${messages.length}`);
    console.log(`  Votes: ${votes.length}`);
    console.log();

  } catch (error) {
    console.error('\n❌ Validation failed with error:');
    console.error(error instanceof Error ? error.message : error);
    console.error();
    process.exit(1);
  }
}

function parseArgs(args: string[]): ValidateOptions {
  const options: ValidateOptions = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--hypothesis':
        options.hypothesis = args[++i];
        break;
      case '--description':
        options.description = args[++i];
        break;
      case '--document':
        options.documentFile = args[++i];
        break;
      case '--iterations':
        options.iterations = parseInt(args[++i], 10);
        break;
      case '--timeout':
        options.timeout = parseInt(args[++i], 10);
        break;
      case '--no-report':
        options.generateReport = false;
        break;
      case '--report':
        options.reportPath = args[++i];
        break;
      case '--help':
        console.log(`
THESIS CLI analyze Flow Validation Script

Usage: node scripts/validate-analyze-flow.ts [options]

Options:
  --hypothesis <text>    Hypothesis statement (default: real LLM test)
  --description <text>   Hypothesis description (default: validation test)
  --document <path>      Path to document file to upload
  --iterations <number>  Max iterations per agent (default: 5)
  --timeout <ms>         Iteration timeout in milliseconds (default: 60000)
  --no-report            Skip generating final report
  --report <path>        Custom report file path
  --help                 Show this help message

Environment Variables (required):
  PI_API_KEY            OpenAI API key (required for real LLM)
  API_URL               API URL (default: http://localhost:4000)
  WS_URL                WebSocket URL (default: ws://localhost:4000)
  PI_PROVIDER           LLM provider (default: openai)
  PI_MODEL              LLM model (default: gpt-4o-mini)

Examples:
  # Basic validation with default parameters
  node scripts/validate-analyze-flow.ts

  # Custom hypothesis and iterations
  node scripts/validate-analyze-flow.ts --hypothesis "Custom test" --iterations 3

  # With document upload
  node scripts/validate-analyze-flow.ts --document ./test-doc.txt --iterations 5

  # With custom report path
  node scripts/validate-analyze-flow.ts --report ./custom-report.json
        `);
        process.exit(0);
    }
  }
  
  return options;
}

const args = parseArgs(process.argv.slice(2));
validateAnalyzeFlow(args).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
