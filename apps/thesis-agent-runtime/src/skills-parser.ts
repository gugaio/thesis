import type { ParsedSkill, SkillMetadata } from './types.js';
import { log } from './config.js';
import fs from 'fs/promises';

export function parseSkill(skillContent: string, skillPath: string): ParsedSkill {
  log.debug(`[SkillsParser] Parsing skill: ${skillPath}`);

  const startMarker = '---';
  const endMarker = '---';
  const startIndex = skillContent.indexOf(startMarker);
  const endIndex = skillContent.indexOf(endMarker, startIndex + 3);

  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`Invalid skill format: no frontmatter found in ${skillPath}`);
  }

  const frontmatterText = skillContent.substring(startIndex, endIndex);
  const content = skillContent.substring(endIndex + 4);

  // Parse YAML frontmatter line by line
  const lines = frontmatterText.split('\n');
  const metadata: Record<string, any> = {
    name: '',
    description: '',
    thesis: { role: '', weight: 1.0 },
  };

  let currentKey: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    if (trimmed === '---') {
      continue;
    }

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0) {
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();
      
      if (currentKey) {
        metadata[currentKey] = '';
      }
      currentKey = null;
    } else {
      if (currentKey && metadata[currentKey]) {
        metadata[currentKey] += '\n' + line;
      }
    }
  }

  // Get name from metadata
  const name = metadata.name;

  // Validate required fields
  if (!name) {
    throw new Error(`Missing required field 'name' in skill: ${skillPath}`);
  }

  if (!metadata.thesis) {
    throw new Error(`Missing required field 'thesis' in skill: ${skillPath}`);
  }

  if (!metadata.thesis.role) {
    throw new Error(`Missing required field 'thesis.role' in skill: ${skillPath}`);
  }

  if (!metadata.thesis.weight) {
    throw new Error(`Missing required field 'thesis.weight' in skill: ${skillPath}`);
  }

  // Validate role
  const validRoles: Array<'debt' | 'tech' | 'market'> = ['debt', 'tech', 'market'];
  if (!validRoles.includes(metadata.thesis.role)) {
    throw new Error(`Invalid role '${metadata.thesis.role}' in skill: ${skillPath}. Must be one of: ${validRoles.join(', ')}`);
  }

  // Validate weight
  const weight = parseFloat(metadata.thesis.weight);
  if (isNaN(weight) || weight <= 0 || weight > 1.0) {
    throw new Error(`Invalid weight '${metadata.thesis.weight}' in skill: ${skillPath}. Must be between 0 and 1.0`);
  }

  const skillMetadata: SkillMetadata = {
    name,
    description: metadata.description || '',
    role: metadata.thesis.role,
    weight,
  };

  log.debug(`[SkillsParser] Parsed skill: ${skillMetadata.name} (role: ${skillMetadata.role}, weight: ${skillMetadata.weight})`);

  return {
    metadata: skillMetadata,
    content,
    frontmatter: metadata,
  };
}

function parseYamlValue(value: string): any {
  value = value.trim();

  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  if (/^\d+\.?\d*$/.test(value)) {
    return parseFloat(value);
  }

  if (value === 'true' || value === 'false') {
    return value === 'true';
  }

  return value;
}

export async function loadSkill(skillPath: string): Promise<ParsedSkill> {
  const content = await fs.readFile(skillPath, 'utf-8');
  return parseSkill(content, skillPath);
}

export function getRoleFromSkill(skillPath: string): 'debt' | 'tech' | 'market' {
  const match = skillPath.match(/(debt-specialist|tech-expert|market-analyst)/);
  
  if (!match) {
    throw new Error(`Cannot determine role from skill path: ${skillPath}`);
  }

  const role = match[1];
  const roleMap: Record<string, 'debt' | 'tech' | 'market'> = {
    'debt-specialist': 'debt',
    'tech-expert': 'tech',
    'market-analyst': 'market',
  };

  return roleMap[role] || 'debt';
}
