import type { ToolConfig } from './types.js';

export class ToolRegistry {
  private tools: Map<string, ToolConfig> = new Map();

  constructor() {
    this.initializeDefaultTools();
  }

  private initializeDefaultTools(): void {
    const defaultTools: ToolConfig[] = [
      {
        name: 'ls',
        description: 'List directory contents',
        allowed: true,
        timeoutMs: 5000,
        maxOutputBytes: 10240
      },
      {
        name: 'cat',
        description: 'Read file contents',
        allowed: true,
        timeoutMs: 10000,
        maxOutputBytes: 51200
      },
      {
        name: 'rg',
        description: 'Search file contents (ripgrep)',
        allowed: true,
        timeoutMs: 15000,
        maxOutputBytes: 51200
      },
      {
        name: 'wc',
        description: 'Count lines, words, bytes',
        allowed: true,
        timeoutMs: 5000,
        maxOutputBytes: 1024
      },
      {
        name: 'head',
        description: 'Output first part of files',
        allowed: true,
        timeoutMs: 5000,
        maxOutputBytes: 10240
      },
      {
        name: 'tail',
        description: 'Output last part of files',
        allowed: true,
        timeoutMs: 5000,
        maxOutputBytes: 10240
      },
      {
        name: 'jq',
        description: 'Process JSON data',
        allowed: true,
        timeoutMs: 5000,
        maxOutputBytes: 10240
      }
    ];

    defaultTools.forEach(tool => {
      this.tools.set(tool.name, tool);
    });
  }

  isToolAllowed(toolName: string): boolean {
    const tool = this.tools.get(toolName);
    return tool?.allowed ?? false;
  }

  getToolConfig(toolName: string): ToolConfig | undefined {
    return this.tools.get(toolName);
  }

  getAllowedTools(): ToolConfig[] {
    return Array.from(this.tools.values()).filter(tool => tool.allowed);
  }

  allowTool(toolName: string): boolean {
    const tool = this.tools.get(toolName);
    if (tool) {
      tool.allowed = true;
      return true;
    }
    return false;
  }

  disallowTool(toolName: string): boolean {
    const tool = this.tools.get(toolName);
    if (tool) {
      tool.allowed = false;
      return true;
    }
    return false;
  }

  registerTool(tool: ToolConfig): void {
    this.tools.set(tool.name, tool);
  }
}
