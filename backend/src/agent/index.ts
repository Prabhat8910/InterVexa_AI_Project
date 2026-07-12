import dotenv from 'dotenv';
dotenv.config();

import { InterviewAgent } from './handler';

// Enable direct standalone invocation from CLI for troubleshooting/scaling
if (require.main === module) {
  const roomName = process.argv[2] || 'test-room';
  const token = process.argv[3];

  if (!token) {
    console.error('Error: LiveKit agent token is required.');
    console.error('Usage: npm run agent:dev <roomName> <agentToken>');
    process.exit(1);
  }

  console.log(`[Standalone Agent] Starting for room: ${roomName}...`);
  const agent = new InterviewAgent(roomName, token);
  agent.start().then(() => {
    console.log('[Standalone Agent] Session loop active.');
  }).catch((err) => {
    console.error('[Standalone Agent] Start error:', err);
  });
}

export { InterviewAgent };
