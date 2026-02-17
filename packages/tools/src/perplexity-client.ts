import dotenv from 'dotenv';

dotenv.config();

export interface PerplexitySearchOptions {
    model?: 'sonar' | 'sonar-pro'; // Updated models
    search_domain_filter?: string[];
    search_recency_filter?: 'month' | 'week' | 'day' | 'hour';
    return_images?: boolean;
    return_related_questions?: boolean;
}

export interface PerplexityResponse {
    id: string;
    model: string;
    created: number;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    object: string;
    choices: {
        index: number;
        finish_reason: string;
        message: {
            role: string;
            content: string;
        };
        delta: {
            role: string;
            content: string;
        };
    }[];
    citations?: string[];
}

export class PerplexityClient {
    private apiKey: string;
    private baseUrl = 'https://api.perplexity.ai';

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.PERPLEXITY_API_KEY || '';
        if (!this.apiKey) {
            console.warn('⚠️ PerplexityClient initialized without API key');
        }
    }

    async search(query: string, options: PerplexitySearchOptions = {}): Promise<string> {
        if (!this.apiKey) {
            return `[Mock Search Result] Perplexity API key not configured. Query: "${query}"`;
        }

        try {
            const model = options.model || 'sonar';

            const body: any = {
                model,
                messages: [
                    {
                        role: 'system',
                        content: 'Be precise and concise.'
                    },
                    {
                        role: 'user',
                        content: query
                    }
                ],
                stream: false
            };

            if (options.search_domain_filter) {
                body.search_domain_filter = options.search_domain_filter;
            }

            if (options.search_recency_filter) {
                body.search_recency_filter = options.search_recency_filter;
            }

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json() as PerplexityResponse;

            let content = data.choices[0]?.message?.content || '';

            if (data.citations && data.citations.length > 0) {
                content += '\n\n**Sources:**\n' + data.citations.map((url, i) => `[${i + 1}] ${url}`).join('\n');
            }

            return content;
        } catch (error) {
            console.error('❌ Perplexity search error:', error);
            return `[Error] Failed to perform search: ${error instanceof Error ? error.message : String(error)}`;
        }
    }

    async research(topic: string): Promise<string> {
        // Uses sonar-pro for deeper reasoning/research if available, otherwise sonar
        return this.search(topic, {
            model: 'sonar-pro'
        });
    }
}
