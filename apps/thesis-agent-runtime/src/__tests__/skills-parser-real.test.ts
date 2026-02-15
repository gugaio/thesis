import { describe, it, expect } from 'vitest';
import { parseSkill } from '../skills-parser.js';

describe('SkillsParser - Real Skills', () => {
  it('should parse real debt skill from SKILL.md', async () => {
    const fs = await import('fs/promises');
    const skillPath = '/home/gugaime/IA/thesis/packages/skills/debt-specialist/SKILL.md';
    const content = await fs.readFile(skillPath, 'utf-8');
    
    const result = parseSkill(content, skillPath);
    const thesisMeta = result.frontmatter.thesis as Record<string, any> || {};

    expect(result.metadata.name).toBe('debt-specialist');
    expect(result.metadata.description).toBe('Analyze startup financials, burn rate, runway, and unit economics');
    expect(thesisMeta.role).toBe('debt');
    expect(thesisMeta.weight).toBe(1.0);
  });

  it('should parse real tech skill from SKILL.md', async () => {
    const fs = await import('fs/promises');
    const skillPath = '/home/gugaime/IA/thesis/packages/skills/tech-expert/SKILL.md';
    const content = await fs.readFile(skillPath, 'utf-8');
    
    const result = parseSkill(content, skillPath);
    const thesisMeta = result.frontmatter.thesis as Record<string, any> || {};

    expect(result.metadata.name).toBe('tech-expert');
    expect(thesisMeta.role).toBe('tech');
    expect(thesisMeta.weight).toBe(0.8);
  });

  it('should parse real market skill from SKILL.md', async () => {
    const fs = await import('fs/promises');
    const skillPath = '/home/gugaime/IA/thesis/packages/skills/market-analyst/SKILL.md';
    const content = await fs.readFile(skillPath, 'utf-8');
    
    const result = parseSkill(content, skillPath);
    const thesisMeta = result.frontmatter.thesis as Record<string, any> || {};

    expect(result.metadata.name).toBe('market-analyst');
    expect(thesisMeta.role).toBe('market');
    expect(thesisMeta.weight).toBe(0.9);
  });
});
