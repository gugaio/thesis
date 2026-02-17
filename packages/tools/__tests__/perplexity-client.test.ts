import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PerplexityClient } from '../src/perplexity-client';

// Mock global fetch
global.fetch = vi.fn();

describe('PerplexityClient', () => {
    let client: PerplexityClient;
    const mockApiKey = 'test-api-key';

    beforeEach(() => {
        vi.clearAllMocks();
        client = new PerplexityClient(mockApiKey);
    });

    it('should initialize with API key', () => {
        expect(client).toBeDefined();
    });

    it('should return mock result if no API key provided', async () => {
        const noKeyClient = new PerplexityClient('');
        const result = await noKeyClient.search('test query');
        expect(result).toContain('[Mock Search Result]');
    });

    it('should call Perplexity API with correct parameters for search', async () => {
        const mockResponse = {
            choices: [
                {
                    message: {
                        content: 'Search result content'
                    }
                }
            ],
            citations: ['https://example.com']
        };

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        const result = await client.search('test query');

        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.perplexity.ai/chat/completions',
            expect.objectContaining({
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${mockApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: expect.stringContaining('"model":"sonar"')
            })
        );

        expect(result).toContain('Search result content');
        expect(result).toContain('https://example.com');
    });

    it('should use sonar-pro model for research', async () => {
        const mockResponse = {
            choices: [{ message: { content: 'Research result' } }]
        };

        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockResponse
        });

        await client.research('complex topic');

        expect(global.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                body: expect.stringContaining('"model":"sonar-pro"')
            })
        );
    });

    it('should handle API errors gracefully', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            text: async () => 'Invalid API Key'
        });

        const result = await client.search('test');
        expect(result).toContain('[Error]');
        expect(result).toContain('401 Unauthorized');
    });
});
