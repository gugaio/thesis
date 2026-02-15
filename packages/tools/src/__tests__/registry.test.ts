import { describe, it, expect } from 'vitest';
import { ToolRegistry } from '../registry.js';
import type { ToolConfig } from '../types.js';

describe('ToolRegistry', () => {
  describe('initialization', () => {
    it('should initialize with default tools', () => {
      const registry = new ToolRegistry();
      const allowedTools = registry.getAllowedTools();

      expect(allowedTools.length).toBeGreaterThan(0);
      expect(allowedTools.find(t => t.name === 'ls')).toBeDefined();
      expect(allowedTools.find(t => t.name === 'cat')).toBeDefined();
      expect(allowedTools.find(t => t.name === 'rg')).toBeDefined();
    });

    it('should have all default tools allowed', () => {
      const registry = new ToolRegistry();
      const defaultToolNames = ['ls', 'cat', 'rg', 'wc', 'head', 'tail', 'jq'];

      defaultToolNames.forEach(toolName => {
        expect(registry.isToolAllowed(toolName)).toBe(true);
      });
    });
  });

  describe('isToolAllowed', () => {
    it('should return true for allowed tools', () => {
      const registry = new ToolRegistry();

      expect(registry.isToolAllowed('ls')).toBe(true);
      expect(registry.isToolAllowed('cat')).toBe(true);
    });

    it('should return false for unknown tools', () => {
      const registry = new ToolRegistry();

      expect(registry.isToolAllowed('rm')).toBe(false);
      expect(registry.isToolAllowed('sudo')).toBe(false);
    });
  });

  describe('getToolConfig', () => {
    it('should return config for existing tools', () => {
      const registry = new ToolRegistry();
      const config = registry.getToolConfig('ls');

      expect(config).toBeDefined();
      expect(config?.name).toBe('ls');
      expect(config?.description).toBeDefined();
      expect(config?.allowed).toBe(true);
      expect(config?.timeoutMs).toBeGreaterThan(0);
    });

    it('should return undefined for unknown tools', () => {
      const registry = new ToolRegistry();
      const config = registry.getToolConfig('unknown');

      expect(config).toBeUndefined();
    });
  });

  describe('allowTool', () => {
    it('should allow a previously disallowed tool', () => {
      const registry = new ToolRegistry();
      registry.disallowTool('ls');

      expect(registry.isToolAllowed('ls')).toBe(false);

      const result = registry.allowTool('ls');

      expect(result).toBe(true);
      expect(registry.isToolAllowed('ls')).toBe(true);
    });

    it('should return false for unknown tools', () => {
      const registry = new ToolRegistry();
      const result = registry.allowTool('unknown');

      expect(result).toBe(false);
    });
  });

  describe('disallowTool', () => {
    it('should disallow a tool', () => {
      const registry = new ToolRegistry();
      const result = registry.disallowTool('ls');

      expect(result).toBe(true);
      expect(registry.isToolAllowed('ls')).toBe(false);
    });

    it('should return false for unknown tools', () => {
      const registry = new ToolRegistry();
      const result = registry.disallowTool('unknown');

      expect(result).toBe(false);
    });
  });

  describe('registerTool', () => {
    it('should register a new tool', () => {
      const registry = new ToolRegistry();
      const newTool: ToolConfig = {
        name: 'echo',
        description: 'Print text',
        allowed: true,
        timeoutMs: 5000,
        maxOutputBytes: 1024
      };

      registry.registerTool(newTool);

      expect(registry.isToolAllowed('echo')).toBe(true);
      expect(registry.getToolConfig('echo')).toEqual(newTool);
    });

    it('should overwrite existing tool', () => {
      const registry = new ToolRegistry();
      const newTool: ToolConfig = {
        name: 'ls',
        description: 'Updated description',
        allowed: false,
        timeoutMs: 10000,
        maxOutputBytes: 2048
      };

      registry.registerTool(newTool);

      expect(registry.isToolAllowed('ls')).toBe(false);
      expect(registry.getToolConfig('ls')).toEqual(newTool);
    });
  });

  describe('getAllowedTools', () => {
    it('should return only allowed tools', () => {
      const registry = new ToolRegistry();
      registry.disallowTool('ls');
      registry.disallowTool('cat');

      const allowed = registry.getAllowedTools();
      const toolNames = allowed.map(t => t.name);

      expect(toolNames).not.toContain('ls');
      expect(toolNames).not.toContain('cat');
      expect(toolNames).toContain('rg');
    });
  });
});
