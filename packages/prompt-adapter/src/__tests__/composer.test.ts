import { describe, it, expect } from 'vitest';
import { composePrompt, buildConstraints, parseMarkdownContent } from '../composer.js';
import type { PromptConstraints } from '../types.js';

describe('PromptComposer', () => {
  const baseSystem = 'You are a helpful AI assistant.';
  const soul = 'Respect other agents and collaborate.';
  const profile = 'You are a debt specialist.';
  const skill = 'Analyze burn rate and runway.';
  const constraints = 'Use 1 credit per action.';

  describe('composePrompt', () => {
    it('should compose prompt with all parts', () => {
      const result = composePrompt(baseSystem, soul, profile, skill, constraints);

      expect(result).toContain('Base System');
      expect(result).toContain(baseSystem);
      expect(result).toContain('SOUL');
      expect(result).toContain(soul);
      expect(result).toContain('Profile');
      expect(result).toContain(profile);
      expect(result).toContain('Skill');
      expect(result).toContain(skill);
      expect(result).toContain('Constraints');
      expect(result).toContain(constraints);
    });

    it('should maintain correct order', () => {
      const result = composePrompt(baseSystem, soul, profile, skill, constraints);

      const baseIndex = result.indexOf('Base System');
      const soulIndex = result.indexOf('SOUL');
      const profileIndex = result.indexOf('Profile');
      const skillIndex = result.indexOf('Skill');
      const constraintsIndex = result.indexOf('Constraints');

      expect(baseIndex).toBeLessThan(soulIndex);
      expect(soulIndex).toBeLessThan(profileIndex);
      expect(profileIndex).toBeLessThan(skillIndex);
      expect(skillIndex).toBeLessThan(constraintsIndex);
    });
  });

  describe('buildConstraints', () => {
    it('should build constraints with budget', () => {
      const constraints: PromptConstraints = {
        budget: {
          credits: 100,
          minBuffer: 10
        },
        toolPolicy: ['Use ls for listing files'],
        sessionRules: ['Be concise']
      };

      const result = buildConstraints(constraints);

      expect(result).toContain('Budget Constraints');
      expect(result).toContain('Current Credits: 100');
      expect(result).toContain('Minimum Buffer: 10');
      expect(result).toContain('Stop Condition: When credits < 10');
    });

    it('should build constraints with tool policy', () => {
      const constraints: PromptConstraints = {
        budget: { credits: 100, minBuffer: 10 },
        toolPolicy: ['Use ls', 'Use cat'],
        sessionRules: []
      };

      const result = buildConstraints(constraints);

      expect(result).toContain('Tool Policy');
      expect(result).toContain('- Use ls');
      expect(result).toContain('- Use cat');
    });

    it('should build constraints with session rules', () => {
      const constraints: PromptConstraints = {
        budget: { credits: 100, minBuffer: 10 },
        toolPolicy: [],
        sessionRules: ['Be concise', 'Use Markdown']
      };

      const result = buildConstraints(constraints);

      expect(result).toContain('Session Rules');
      expect(result).toContain('- Be concise');
      expect(result).toContain('- Use Markdown');
    });
  });

  describe('parseMarkdownContent', () => {
    it('should trim whitespace', () => {
      const content = '  Test content  ';
      const result = parseMarkdownContent(content);

      expect(result).toBe('Test content');
    });

    it('should handle empty strings', () => {
      const result = parseMarkdownContent('  \n  ');

      expect(result).toBe('');
    });
  });
});
