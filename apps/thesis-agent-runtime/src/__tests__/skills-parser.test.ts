import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseSkill, getRoleFromSkill } from '../skills-parser.js';
import { log } from '../config.js';

describe('SkillsParser', () => {
  const mockSkillPath = '/fake/skill.md';

  it('should parse valid debt skill', () => {
    const skillContent = `---
name: debt-specialist
description: Test description
metadata:
  thesis:
    role: debt
    weight: 1.0
---
# Content here
`;

    const result = parseSkill(skillContent, mockSkillPath);

    expect(result.metadata.name).toBe('debt-specialist');
    expect(result.metadata.description).toBe('Test description');
    const thesisMeta = result.frontmatter.thesis || {};
    expect(thesisMeta.role).toBe('debt');
    expect(thesisMeta.weight).toBe(1.0);
    expect(result.content).toBe('# Content here\n');
  });

  it('should parse valid tech skill', () => {
    const skillContent = `---
name: tech-expert
metadata:
  thesis:
    role: tech
    weight: 0.8
---
Tech content
`;

    const result = parseSkill(skillContent, mockSkillPath);
    const thesisMeta = result.frontmatter.thesis || {};

    expect(result.metadata.name).toBe('tech-expert');
    expect(thesisMeta.role).toBe('tech');
    expect(thesisMeta.weight).toBe(0.8);
  });

  it('should parse valid market skill', () => {
    const skillContent = `---
name: market-analyst
metadata:
  thesis:
    role: market
    weight: 0.9
---
Market content
`;

    const result = parseSkill(skillContent, mockSkillPath);
    const thesisMeta = result.frontmatter.thesis || {};

    expect(result.metadata.name).toBe('market-analyst');
    expect(thesisMeta.role).toBe('market');
    expect(thesisMeta.weight).toBe(0.9);
  });

  it('should throw error if no frontmatter', () => {
    const invalidContent = 'No frontmatter here';

    expect(() => parseSkill(invalidContent, mockSkillPath)).toThrow('Invalid skill format');
  });

  it('should throw error if name is missing', () => {
    const invalidContent = `---
description: Test
metadata:
  thesis:
    role: debt
    weight: 1.0
---
Content`;

    expect(() => parseSkill(invalidContent, mockSkillPath)).toThrow("Missing required field 'name'");
  });

  it('should throw error if thesis.role is missing', () => {
    const invalidContent = `---
name: test
description: Test
metadata:
  thesis:
    weight: 1.0
---
Content`;

    expect(() => parseSkill(invalidContent, mockSkillPath)).toThrow("Missing required field 'thesis.role'");
  });

  it('should throw error if thesis.weight is missing', () => {
    const invalidContent = `---
name: test
description: Test
metadata:
  thesis:
    role: debt
---
Content`;

    expect(() => parseSkill(invalidContent, mockSkillPath)).toThrow("Missing required field 'thesis.weight'");
  });

  it('should throw error if role is invalid', () => {
    const invalidContent = `---
name: test
description: Test
metadata:
  thesis:
    role: invalid
    weight: 1.0
---
Content`;

    expect(() => parseSkill(invalidContent, mockSkillPath)).toThrow("Invalid role 'invalid'");
  });

  it('should throw error if weight is invalid', () => {
    const invalidContent = `---
name: test
description: Test
metadata:
  thesis:
    role: debt
    weight: invalid
---
Content`;

    expect(() => parseSkill(invalidContent, mockSkillPath)).toThrow("Invalid weight 'invalid'");
  });

  it('should throw error if weight is out of range', () => {
    const invalidContent = `---
name: test
description: Test
metadata:
  thesis:
    role: debt
    weight: 1.5
---
Content`;

    expect(() => parseSkill(invalidContent, mockSkillPath)).toThrow("Invalid weight '1.5'");
  });

  it('should parse weight as float', () => {
    const skillContent = `---
name: test
metadata:
  thesis:
    role: debt
    weight: 0.75
---
Content`;

    const result = parseSkill(skillContent, mockSkillPath);
    const thesisMeta = result.frontmatter.thesis || {};

    expect(typeof result.metadata.weight).toBe('number');
    expect(result.metadata.weight).toBeCloseTo(0.75, 0);
  });

  it('should extract frontmatter correctly', () => {
    const skillContent = `---
name: test-skill
description: A test skill
metadata:
  thesis:
    role: debt
    weight: 1.0
  other: value
description2: Another description
---
# Skill content
`;

    const result = parseSkill(skillContent, mockSkillPath);

    expect(result.frontmatter).toHaveProperty('name');
    expect(result.frontmatter).toHaveProperty('description');
    expect(result.frontmatter).toHaveProperty('metadata');
    expect(result.frontmatter).toHaveProperty('other');
    expect(result.frontmatter).toHaveProperty('description2');
    expect(result.frontmatter.other).toBe('value');
  });

  it('should get role from path - debt', () => {
    const role = getRoleFromSkill('/some/path/debt-specialist/SKILL.md');
    expect(role).toBe('debt');
  });

  it('should get role from path - tech', () => {
    const role = getRoleFromSkill('/some/path/tech-expert/SKILL.md');
    expect(role).toBe('tech');
  });

  it('should get role from path - market', () => {
    const role = getRoleFromSkill('/some/path/market-analyst/SKILL.md');
    expect(role).toBe('market');
  });

  it('should throw error for invalid skill path', () => {
    expect(() => getRoleFromSkill('/some/path/unknown-agent/SKILL.md')).toThrow("Cannot determine role from skill path");
  });

  it('should parse number values correctly', () => {
    const skillContent = `---
name: test
metadata:
  thesis:
    role: debt
    weight: 1
---
Content`;

    const result = parseSkill(skillContent, mockSkillPath);
    const thesisMeta = result.frontmatter.thesis || {};

    expect(typeof thesisMeta.weight).toBe('number');
    expect(thesisMeta.weight).toBeCloseTo(1, 0);
  });
});
