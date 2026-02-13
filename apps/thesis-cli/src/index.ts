#!/usr/bin/env node
import { Command } from 'commander';
import { ApiClient } from './client/api-client.js';
import { existsSync } from 'fs';

const program = new Command();

program
  .name('thesis')
  .description('THESIS: The Council - Multi-agent VC analysis CLI')
  .version('0.1.0');

program
  .command('version')
  .description('Show version information')
  .action(() => {
    console.log('THESIS CLI version 0.1.0');
  });

program
  .command('help')
  .description('Show help information')
  .action(() => {
    program.help();
  });

program
  .command('init-session')
  .description('Initialize a new analysis session')
  .option('--hypothesis <statement>', 'Hypothesis statement to analyze')
  .option('--description <text>', 'Hypothesis description')
  .action(async (options) => {
    try {
      if (!options.hypothesis || options.hypothesis.trim().length === 0) {
        console.error('Error: --hypothesis is required');
        process.exit(1);
      }

      const client = new ApiClient(process.env.API_URL);
      const result = await client.createSession(options.hypothesis, options.description);

      console.log('✅ Session created successfully!');
      console.log(`Session ID: ${result.sessionId}`);
      console.log(`Hypothesis ID: ${result.hypothesisId}`);
      console.log(`Status: ${result.status}`);
      console.log('');
      console.log('Use --session flag for subsequent commands:');
      console.log(`  thesis upload-doc --session ${result.sessionId} --file <path>`);
      console.log(`  thesis join-session --session ${result.sessionId} --profile <debt|tech|market>`);
      console.log(`  thesis status --session ${result.sessionId}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('upload-doc')
  .description('Upload a document to a session')
  .option('--session <id>', 'Session ID')
  .option('--file <path>', 'File path')
  .action(async (options) => {
    try {
      if (!options.session) {
        console.error('Error: --session is required');
        process.exit(1);
      }

      if (!options.file) {
        console.error('Error: --file is required');
        process.exit(1);
      }

      if (!existsSync(options.file)) {
        console.error(`Error: File not found: ${options.file}`);
        process.exit(1);
      }

      const client = new ApiClient(process.env.API_URL);
      const result = await client.uploadDocument(options.session, options.file);

      console.log('✅ Document uploaded successfully!');
      console.log(`Document ID: ${result.documentId}`);
      console.log(`Name: ${result.name}`);
      console.log(`Size: ${result.size} bytes`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('join-session')
  .description('Join a session with an agent profile')
  .option('--session <id>', 'Session ID')
  .option('--profile <role>', 'Agent profile role (debt, tech, market)')
  .option('--credits <number>', 'Initial credits', '100')
  .action(async (options) => {
    try {
      if (!options.session) {
        console.error('Error: --session is required');
        process.exit(1);
      }

      if (!options.profile) {
        console.error('Error: --profile is required');
        console.error('Available profiles: debt, tech, market');
        process.exit(1);
      }

      const validProfiles = ['debt', 'tech', 'market'];
      if (!validProfiles.includes(options.profile)) {
        console.error(`Error: Invalid profile "${options.profile}"`);
        console.error(`Available profiles: ${validProfiles.join(', ')}`);
        process.exit(1);
      }

      const initialCredits = parseInt(options.credits, 10);
      if (isNaN(initialCredits) || initialCredits < 0) {
        console.error('Error: --credits must be a positive number');
        process.exit(1);
      }

      const client = new ApiClient(process.env.API_URL);
      const result = await client.joinSession(options.session, options.profile, initialCredits);

      console.log('✅ Agent joined session successfully!');
      console.log(`Agent ID: ${result.agentId}`);
      console.log(`Profile: ${result.profile.name} (${result.profile.role})`);
      console.log(`Weight: ${result.profile.weight}`);
      console.log(`Session ID: ${result.sessionId}`);
      console.log(`Budget: ${result.budget.credits}/${result.budget.maxCredits} credits`);
      console.log('');
      console.log('Use the agent ID to post opinions:');
      console.log(`  thesis post-opinion --session ${result.sessionId} --agent ${result.agentId} --content "Your opinion" --confidence 0.8`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('post-opinion')
  .description('Post an opinion to a session')
  .option('--session <id>', 'Session ID')
  .option('--agent <id>', 'Agent ID')
  .option('--content <text>', 'Opinion content')
  .option('--confidence <number>', 'Confidence level (0-1)', '0.5')
  .action(async (options) => {
    try {
      if (!options.session) {
        console.error('Error: --session is required');
        process.exit(1);
      }

      if (!options.agent) {
        console.error('Error: --agent is required');
        process.exit(1);
      }

      if (!options.content) {
        console.error('Error: --content is required');
        process.exit(1);
      }

      const confidence = parseFloat(options.confidence);
      if (isNaN(confidence) || confidence < 0 || confidence > 1) {
        console.error('Error: --confidence must be between 0 and 1');
        process.exit(1);
      }

      const client = new ApiClient(process.env.API_URL);
      const result = await client.postOpinion(options.session, options.agent, options.content, confidence);

      console.log('✅ Opinion posted successfully!');
      console.log(`Opinion ID: ${result.opinionId}`);
      console.log(`Agent ID: ${result.agentId}`);
      console.log(`Content: ${result.content}`);
      console.log(`Confidence: ${result.confidence}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Query session status')
  .option('--session <id>', 'Session ID')
  .action(async (options) => {
    try {
      if (!options.session) {
        console.error('Error: --session is required');
        process.exit(1);
      }

      const client = new ApiClient(process.env.API_URL);
      const result = await client.getSession(options.session);
      const agents = await client.listAgents(options.session);
      const opinions = await client.listOpinions(options.session);

      console.log('📊 Session Status');
      console.log('================');
      console.log(`Session ID: ${result.session.id}`);
      console.log(`Status: ${result.session.status}`);
      console.log(`Created At: ${result.session.createdAt}`);

      console.log('');
      console.log('📝 Hypothesis');
      console.log('-------------');
      console.log(`ID: ${result.hypothesis.id}`);
      console.log(`Statement: ${result.hypothesis.statement}`);
      if (result.hypothesis.description) {
        console.log(`Description: ${result.hypothesis.description}`);
      }
      console.log(`Confidence: ${result.hypothesis.confidence}`);

      console.log('');
      console.log('📄 Documents');
      console.log('-----------');
      if (result.documents.length === 0) {
        console.log('No documents uploaded yet.');
      } else {
        result.documents.forEach((doc, idx) => {
          console.log(`${idx + 1}. ${doc.name} (${doc.type}, ${doc.size} bytes)`);
        });
      }

      console.log('');
      console.log('🤖 Agents');
      console.log('----------');
      if (agents.length === 0) {
        console.log('No agents in session yet.');
      } else {
        agents.forEach((agent, idx) => {
          console.log(`${idx + 1}. ${agent.profile.name} (${agent.profile.role})`);
          console.log(`   ID: ${agent.id}`);
          console.log(`   Budget: ${agent.budget.credits}/${agent.budget.maxCredits} credits`);
          const joinedAt = agent.joinedAt instanceof Date ? agent.joinedAt : new Date(agent.joinedAt);
          console.log(`   Joined: ${joinedAt.toISOString()}`);
        });
      }

      console.log('');
      console.log('💬 Opinions');
      console.log('-------------');
      if (opinions.length === 0) {
        console.log('No opinions posted yet.');
      } else {
        opinions.forEach((opinion, idx) => {
          const agent = agents.find((a) => a.id === opinion.agentId);
          const agentName = agent ? agent.profile.name : 'Unknown';
          console.log(`${idx + 1}. ${agentName} (confidence: ${opinion.confidence})`);
          console.log(`   ${opinion.content}`);
          console.log(`   At: ${opinion.timestamp instanceof Date ? opinion.timestamp.toISOString() : String(opinion.timestamp)}`);
        });
      }

      console.log('');
      console.log('📜 Ledger Events');
      console.log('----------------');
      if (result.ledger.length === 0) {
        console.log('No events yet.');
      } else {
        result.ledger.forEach((event) => {
          const timestamp = event.timestamp instanceof Date ? event.timestamp.toISOString() : String(event.timestamp);
          console.log(`[${timestamp}] ${event.type}`);
        });
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
