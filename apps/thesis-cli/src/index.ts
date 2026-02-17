#!/usr/bin/env node
import { Command } from 'commander';
import { ApiClient } from './client/api-client.js';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { AGENT_ROLES } from '@thesis/skills';

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
      console.log(`  thesis join-session --session ${result.sessionId} --profile <${AGENT_ROLES.join('|')}>`);
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
  .command('read-doc')
  .description('Read document content')
  .option('--session <id>', 'Session ID')
  .option('--doc <id>', 'Document ID')
  .option('--output <path>', 'Save content to file (optional)')
  .action(async (options) => {
    try {
      if (!options.session) {
        console.error('Error: --session is required');
        process.exit(1);
      }

      if (!options.doc) {
        console.error('Error: --doc is required');
        process.exit(1);
      }

      const client = new ApiClient(process.env.API_URL);
      const result = await client.getDocumentContent(options.session, options.doc);

      if (options.output) {
        const fs = (await import('fs')).default;
        fs.writeFileSync(options.output, result.text, 'utf-8');
        console.log('✅ Document content saved to:', options.output);
        console.log(`Type: ${result.type}`);
      } else {
        console.log('📄 Document Content');
        console.log(`Type: ${result.type}`);
        console.log('---');
        console.log(result.text);
      }
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
        console.error(`Available profiles: ${AGENT_ROLES.join(', ')}`);
        process.exit(1);
      }

      if (!AGENT_ROLES.includes(options.profile as any)) {
        console.error(`Error: Invalid profile "${options.profile}"`);
        console.error(`Available profiles: ${AGENT_ROLES.join(', ')}`);
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
          console.log(`${idx + 1}. ${doc.name}`);
          console.log(`   ID: ${doc.id}`);
          console.log(`   Type: ${doc.type}`);
          console.log(`   Size: ${doc.size} bytes`);
          console.log(`   Uploaded: ${doc.uploadedAt}`);
          if (idx < result.documents.length - 1) {
            console.log('');
          }
        });
      }

      console.log('');
      console.log('🤖 Agents');
      console.log('----------');
      if (agents.length === 0) {
        console.log('No agents in session yet.');
      } else {
        agents.forEach((agent, idx) => {
          const joinedAt = agent.joinedAt instanceof Date ? agent.joinedAt : new Date(agent.joinedAt);
          console.log(`${idx + 1}. ${agent.profile.name} (${agent.profile.role})`);
          console.log(`   ID: ${agent.id}`);
          console.log(`   Budget: ${agent.budget.credits}/${agent.budget.maxCredits} credits`);
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
          const timestamp = opinion.timestamp instanceof Date ? opinion.timestamp.toISOString() : String(opinion.timestamp);
          console.log(`${idx + 1}. ${agentName} (confidence: ${opinion.confidence})`);
          console.log(`   ${opinion.content}`);
          console.log(`   At: ${timestamp}`);
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

program
  .command('ask')
  .description('Send a message to another agent')
  .option('--session <id>', 'Session ID')
  .option('--from <agent-id>', 'Sender agent ID')
  .option('--to <agent-id>', 'Recipient agent ID')
  .option('--content <text>', 'Message content')
  .action(async (options) => {
    try {
      if (!options.session) {
        console.error('Error: --session is required');
        process.exit(1);
      }

      if (!options.from) {
        console.error('Error: --from is required');
        process.exit(1);
      }

      if (!options.to) {
        console.error('Error: --to is required');
        process.exit(1);
      }

      if (!options.content) {
        console.error('Error: --content is required');
        process.exit(1);
      }

      const client = new ApiClient(process.env.API_URL);
      const result = await client.sendMessage(
        options.session,
        options.from,
        options.to,
        options.content
      );

      console.log('✅ Message sent successfully!');
      console.log(`Message ID: ${result.messageId}`);
      console.log(`Remaining credits: ${result.remainingCredits}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('listen')
  .description('Listen for new messages (polling)')
  .option('--session <id>', 'Session ID')
  .option('--agent <agent-id>', 'Agent ID to listen for')
  .option('--interval <seconds>', 'Polling interval in seconds', '5')
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

      const interval = parseInt(options.interval, 10);
      if (isNaN(interval) || interval < 1) {
        console.error('Error: --interval must be a positive number');
        process.exit(1);
      }

      const client = new ApiClient(process.env.API_URL);

      console.log(`👂 Listening for messages to agent ${options.agent}...`);
      console.log(`Polling every ${interval} seconds. Press Ctrl+C to stop.`);
      console.log('');

      const markAsRead = async (messages: Array<{ id: string }>) => {
        if (messages.length > 0) {
          const messageIds = messages.map((m) => m.id);
          await client.markMessagesAsRead(options.agent!, messageIds);
        }
      };

      for (;;) {
        const result = await client.listMessages(options.session, options.agent!, true);

        if (result.messages.length === 0) {
          process.stdout.write('.');
        } else {
          process.stdout.write('\n');
          console.log(`📨 ${result.messages.length} new message(s):`);
          console.log('----------------');
          result.messages.forEach((msg, idx) => {
            const sentAt = new Date(msg.sentAt);
            console.log(`${idx + 1}. From: ${msg.fromAgentId}`);
            console.log(`   ${msg.content}`);
            console.log(`   At: ${sentAt.toLocaleString()}`);
          });
          console.log('');

          await markAsRead(result.messages);
        }

        await new Promise((resolve) => setTimeout(resolve, interval * 1000));
      }
    } catch (error) {
      if ((error as any).code === 'ECONNREFUSED') {
        console.error('Error: Could not connect to API. Is it running?');
      } else {
        console.error('Error:', error instanceof Error ? error.message : error);
      }
      process.exit(1);
    }
  });

program
  .command('cast-vote')
  .description('Cast a vote on a session')
  .option('--session <id>', 'Session ID')
  .option('--agent <id>', 'Agent ID')
  .option('--verdict <approve|reject|abstain>', 'Verdict')
  .option('--rationale <text>', 'Rationale for the vote')
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

      if (!options.verdict) {
        console.error('Error: --verdict is required');
        console.error('Available verdicts: approve, reject, abstain');
        process.exit(1);
      }

      if (!['approve', 'reject', 'abstain'].includes(options.verdict)) {
        console.error(`Error: Invalid verdict "${options.verdict}"`);
        console.error('Available verdicts: approve, reject, abstain');
        process.exit(1);
      }

      if (!options.rationale) {
        console.error('Error: --rationale is required');
        process.exit(1);
      }

      const client = new ApiClient(process.env.API_URL);
      const result = await client.castVote(
        options.session,
        options.agent,
        options.verdict,
        options.rationale
      );

      console.log('✅ Vote cast successfully!');
      console.log(`Vote ID: ${result.voteId}`);
      console.log(`Agent ID: ${result.agentId}`);
      console.log(`Verdict: ${result.verdict}`);
      console.log(`Rationale: ${result.rationale}`);
      console.log(`Voted At: ${result.votedAt}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('close-session')
  .description('Close a session with final verdict')
  .option('--session <id>', 'Session ID')
  .option('--verdict <approve|reject>', 'Final verdict')
  .option('--rationale <text>', 'Rationale for the verdict')
  .action(async (options) => {
    try {
      if (!options.session) {
        console.error('Error: --session is required');
        process.exit(1);
      }

      if (!options.verdict) {
        console.error('Error: --verdict is required');
        console.error('Available verdicts: approve, reject');
        process.exit(1);
      }

      if (!['approve', 'reject'].includes(options.verdict)) {
        console.error(`Error: Invalid verdict "${options.verdict}"`);
        console.error('Available verdicts: approve, reject');
        process.exit(1);
      }

      const client = new ApiClient(process.env.API_URL);
      const result = await client.closeSession(options.session, options.verdict, options.rationale);

      console.log('✅ Session closed successfully!');
      console.log(`Session ID: ${result.sessionId}`);
      console.log(`Status: ${result.status}`);
      console.log(`Final Verdict: ${result.finalVerdict}`);
      console.log(`Closed At: ${result.closedAt}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('generate-report')
  .description('Generate and save session report')
  .option('--session <id>', 'Session ID')
  .option('--output <path>', 'Output file path (JSON)', 'report.json')
  .action(async (options) => {
    try {
      if (!options.session) {
        console.error('Error: --session is required');
        process.exit(1);
      }

      const client = new ApiClient(process.env.API_URL);
      const report = await client.getReport(options.session);

      const fs = (await import('fs')).default;
      fs.writeFileSync(options.output, JSON.stringify(report, null, 2));

      console.log('✅ Report generated successfully!');
      console.log(`Output: ${options.output}`);
      console.log('');
      console.log('Report Summary:');
      console.log(`- Session ID: ${report.session.id}`);
      console.log(`- Status: ${report.session.status}`);
      console.log(`- Final Verdict: ${report.session.finalVerdict || 'Not closed'}`);
      console.log(`- Agents: ${report.agents.length}`);
      console.log(`- Votes: ${report.votes.length} (${report.voteCounts.approve} approve, ${report.voteCounts.reject} reject, ${report.voteCounts.abstain} abstain)`);
      console.log(`- Opinions: ${report.opinions.length}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('orchestr-ask')
  .description('Send a human instruction to a specific agent role via orchestrator')
  .option('--session <id>', 'Session ID')
  .option('--target <role>', `Target agent role (${AGENT_ROLES.join(', ')})`)
  .option('--content <text>', 'Instruction content')
  .option('--issued-by <name>', 'Issuer name', 'human')
  .action(async (options) => {
    try {
      if (!options.session) {
        console.error('Error: --session is required');
        process.exit(1);
      }

      if (!options.target) {
        console.error('Error: --target is required');
        process.exit(1);
      }

      if (!AGENT_ROLES.includes(options.target)) {
        console.error(`Error: Invalid --target "${options.target}"`);
        console.error(`Available targets: ${AGENT_ROLES.join(', ')}`);
        process.exit(1);
      }

      if (!options.content || options.content.trim().length === 0) {
        console.error('Error: --content is required');
        process.exit(1);
      }

      const client = new ApiClient(process.env.API_URL);
      const result = await client.issueOrchestratorCommand(
        options.session,
        'ask',
        options.issuedBy,
        options.target,
        options.content
      );

      console.log('✅ Orchestrator command sent!');
      console.log(`Command ID: ${result.commandId}`);
      console.log(`Type: ${result.commandType}`);
      console.log(`Issued by: ${result.issuedBy}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('orchestr-resume')
  .description('Resume orchestrator loop for a session')
  .option('--session <id>', 'Session ID')
  .option('--issued-by <name>', 'Issuer name', 'human')
  .action(async (options) => {
    try {
      if (!options.session) {
        console.error('Error: --session is required');
        process.exit(1);
      }

      const client = new ApiClient(process.env.API_URL);
      const result = await client.issueOrchestratorCommand(
        options.session,
        'resume',
        options.issuedBy
      );

      console.log('✅ Orchestrator resume command sent!');
      console.log(`Command ID: ${result.commandId}`);
      console.log(`Issued by: ${result.issuedBy}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('orchestr-vote')
  .description('Trigger a voting round in orchestrator')
  .option('--session <id>', 'Session ID')
  .option('--issued-by <name>', 'Issuer name', 'human')
  .action(async (options) => {
    try {
      if (!options.session) {
        console.error('Error: --session is required');
        process.exit(1);
      }

      const client = new ApiClient(process.env.API_URL);
      const result = await client.issueOrchestratorCommand(
        options.session,
        'vote',
        options.issuedBy
      );

      console.log('✅ Orchestrator vote command sent!');
      console.log(`Command ID: ${result.commandId}`);
      console.log(`Issued by: ${result.issuedBy}`);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Run automated multi-agent analysis on a session')
  .option('--session <id>', 'Session ID to analyze')
  .option('--iterations <number>', 'Maximum iterations per agent', '10')
  .option('--timeout <ms>', 'Iteration timeout in milliseconds', '60000')
  .action(async (options) => {
    try {
      if (!options.session) {
        console.error('Error: --session is required');
        process.exit(1);
      }

      const iterations = parseInt(options.iterations, 10);
      if (isNaN(iterations) || iterations < 1) {
        console.error('Error: --iterations must be a positive number');
        process.exit(1);
      }

      const timeout = parseInt(options.timeout, 10);
      if (isNaN(timeout) || timeout < 1000) {
        console.error('Error: --timeout must be at least 1000ms');
        process.exit(1);
      }

      console.log('🚀 Starting automated multi-agent analysis...');
      console.log(`Session ID: ${options.session}`);
      console.log(`Max iterations: ${iterations}`);
      console.log(`Timeout: ${timeout}ms`);
      console.log('');

      const client = new ApiClient(process.env.API_URL);

      const session = await client.getSession(options.session);
      if (session.session.status === 'closed') {
        console.error('Error: Session is already closed');
        process.exit(1);
      }

      console.log('✅ Session found and active');
      console.log(`Hypothesis: ${session.hypothesis.statement}`);
      console.log('');

      console.log('🏃 Running analysis...');
      console.log('The gateway will create 3 agents (debt, tech, market) and run them in parallel.');
      console.log('');

      const gatewayPath = join(dirname(fileURLToPath(import.meta.url)), '../../thesis-gateway/dist/index.js');

      const { spawn } = await import('child_process');

      const gatewayProcess = spawn('node', [gatewayPath, options.session], {
        stdio: 'inherit',
        env: {
          ...process.env,
          API_URL: process.env.API_URL || 'http://localhost:4000',
          WS_URL: process.env.WS_URL || 'ws://localhost:4000',
          MAX_ITERATIONS: String(options.iterations),
          ITERATION_TIMEOUT: String(options.timeout),
          ITERATION_DELAY: '2000',
          PI_PROVIDER: process.env.PI_PROVIDER || 'openai',
          PI_MODEL: process.env.PI_MODEL || 'gpt-4o-mini',
          PI_API_KEY: process.env.PI_API_KEY,
        },
      });

      gatewayProcess.on('exit', (code) => {
        if (code === 0) {
          console.log('\n✅ Analysis completed successfully!');
          console.log('');
          console.log('📊 Check results:');
          console.log(`  thesis status --session ${options.session}`);
          console.log(`  thesis generate-report --session ${options.session} --output report.json`);
        } else {
          console.error(`\n❌ Analysis failed with code ${code}`);
          process.exit(1);
        }
      });

    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

  program.parse();
