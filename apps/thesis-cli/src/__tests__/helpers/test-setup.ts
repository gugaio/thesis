import { writeFileSync, unlinkSync } from 'fs';
import path from 'path';
import { ApiClient } from '../../client/api-client';
import { VerdictType } from '@thesis/protocol';

export interface TestSetupOptions {
  hypothesis?: string;
  description?: string;
  documentContent?: string;
  documentName?: string;
}

export interface TestCleanupOptions {
  cleanupDocument?: boolean;
  cleanupSession?: boolean;
}

export class TestSetupHelper {
  private apiClient: ApiClient;
  private createdSessionIds: string[] = [];
  private createdDocumentPaths: string[] = [];

  constructor(apiUrl: string = 'http://localhost:4000') {
    this.apiClient = new ApiClient(apiUrl);
  }

  async createTestSession(options: TestSetupOptions = {}): Promise<{
    sessionId: string;
    hypothesisId: string;
    status: string;
  }> {
    const hypothesis = options.hypothesis || 'E2E Test Session - Automated Testing';
    const description = options.description || 'Session for automated E2E testing of CLI analyze command';

    const result = await this.apiClient.createSession(hypothesis, description);
    
    this.createdSessionIds.push(result.sessionId);
    
    return {
      sessionId: result.sessionId,
      hypothesisId: result.hypothesisId,
      status: result.status
    };
  }

  async uploadTestDocument(
    sessionId: string,
    options: TestSetupOptions = {}
  ): Promise<{
    documentId: string;
    name: string;
    size: number;
    filePath: string;
  }> {
    const content = options.documentContent || 'This is a test document for E2E testing. It contains sample content that agents can analyze.';
    const fileName = options.documentName || `test-doc-${Date.now()}.txt`;
    const filePath = path.join(process.cwd(), fileName);

    writeFileSync(filePath, content, 'utf-8');
    this.createdDocumentPaths.push(filePath);

    const result = await this.apiClient.uploadDocument(sessionId, filePath);
    
    return {
      documentId: result.documentId,
      name: result.name,
      size: result.size,
      filePath
    };
  }

  async getSession(sessionId: string): Promise<any> {
    return await this.apiClient.getSession(sessionId);
  }

  async getAgents(sessionId: string): Promise<any[]> {
    try {
      return await this.apiClient.listAgents(sessionId);
    } catch (error) {
      console.error('Error fetching agents:', error);
      return [];
    }
  }

  async getOpinions(sessionId: string): Promise<any[]> {
    try {
      return await this.apiClient.listOpinions(sessionId);
    } catch (error) {
      console.error('Error fetching opinions:', error);
      return [];
    }
  }

  async getMessages(sessionId: string): Promise<any[]> {
    try {
      const result = await this.apiClient.listMessages(sessionId);
      return result.messages || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async getVotes(sessionId: string): Promise<any[]> {
    try {
      return await this.apiClient.listVotes(sessionId);
    } catch (error) {
      console.error('Error fetching votes:', error);
      return [];
    }
  }

  async getReport(sessionId: string): Promise<any> {
    try {
      return await this.apiClient.getReport(sessionId);
    } catch (error) {
      console.error('Error fetching report:', error);
      return null;
    }
  }

  async closeSession(
    sessionId: string,
    options: { verdict: VerdictType; rationale?: string }
  ): Promise<void> {
    await this.apiClient.closeSession(sessionId, options.verdict, options.rationale);
  }

  async cleanup(options: TestCleanupOptions = {}): Promise<void> {
    const {
      cleanupDocument = true,
      cleanupSession = false
    } = options;

    if (cleanupDocument) {
      this.cleanupDocuments();
    }

    if (cleanupSession) {
      for (const sessionId of this.createdSessionIds) {
        try {
          await this.closeSession(sessionId, {
            verdict: VerdictType.REJECT,
            rationale: 'Cleanup after E2E test'
          });
        } catch (error) {
          console.warn(`Failed to close session ${sessionId}:`, error);
        }
      }
    }

    this.createdSessionIds = [];
  }

  private cleanupDocuments(): void {
    for (const filePath of this.createdDocumentPaths) {
      try {
        unlinkSync(filePath);
      } catch (error) {
        console.warn(`Failed to delete document ${filePath}:`, error);
      }
    }
    this.createdDocumentPaths = [];
  }

  getCreatedSessionIds(): string[] {
    return [...this.createdSessionIds];
  }

  getCreatedDocumentPaths(): string[] {
    return [...this.createdDocumentPaths];
  }
}

export async function setupTestEnvironment(apiUrl: string = 'http://localhost:4000'): Promise<TestSetupHelper> {
  return new TestSetupHelper(apiUrl);
}

export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 30000, interval = 1000 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

export async function waitForSessionStatus(
  helper: TestSetupHelper,
  sessionId: string,
  expectedStatus: string,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 30000, interval = 1000 } = options;

  await waitForCondition(
    async () => {
      const session = await helper.getSession(sessionId);
      return session.session.status === expectedStatus;
    },
    { timeout, interval }
  );
}

export async function waitForAgentsCount(
  helper: TestSetupHelper,
  sessionId: string,
  expectedCount: number,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 30000, interval = 1000 } = options;

  await waitForCondition(
    async () => {
      const agents = await helper.getAgents(sessionId);
      return agents.length >= expectedCount;
    },
    { timeout, interval }
  );
}

export async function waitForVotesCount(
  helper: TestSetupHelper,
  sessionId: string,
  expectedCount: number,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 30000, interval = 1000 } = options;

  await waitForCondition(
    async () => {
      const votes = await helper.getVotes(sessionId);
      return votes.length >= expectedCount;
    },
    { timeout, interval }
  );
}
