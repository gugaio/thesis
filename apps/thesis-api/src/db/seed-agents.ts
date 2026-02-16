import { AGENTS_CONFIG } from '@thesis/skills';
import { Pool } from 'pg';

export async function seedAgentProfiles(pool: Pool): Promise<void> {
  console.log('🌱 Seeding agent profiles...');

  try {
    for (const agent of AGENTS_CONFIG) {
      const query = `
        INSERT INTO agent_profiles (id, name, role, description, weight, soul)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (role) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          weight = EXCLUDED.weight,
          soul = EXCLUDED.soul
      `;

      await pool.query(query, [
        agent.id,
        agent.name,
        agent.role,
        agent.description,
        agent.weight,
        agent.soul
      ]);

      console.log(`✅ Seeded: ${agent.name} (${agent.role})`);
    }

    console.log('✅ Agent profiles seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding agent profiles:', error);
    throw error;
  }
}

// CLI interface for running the seed
export async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    await seedAgentProfiles(pool);
  } catch (error) {
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
