-- Hypotheses table
CREATE TABLE IF NOT EXISTS hypotheses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement TEXT NOT NULL,
  description TEXT,
  confidence FLOAT DEFAULT 0.5,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status VARCHAR(50) NOT NULL DEFAULT 'created',
  hypothesis_id UUID NOT NULL REFERENCES hypotheses(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Agent Profiles table (predefined profiles)
CREATE TABLE IF NOT EXISTS agent_profiles (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  weight FLOAT NOT NULL,
  soul TEXT NOT NULL,
  UNIQUE(role)
);

-- Agents table (agents in sessions)
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES agent_profiles(id),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  budget_credits INT NOT NULL,
  budget_max_credits INT NOT NULL,
  budget_last_refill TIMESTAMP DEFAULT NOW(),
  UNIQUE(profile_id, session_id)
);

-- Opinions table
CREATE TABLE IF NOT EXISTS opinions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  confidence FLOAT NOT NULL,
  posted_at TIMESTAMP DEFAULT NOW()
);

-- Messages table (agent communication)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  from_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  to_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_hypothesis ON sessions(hypothesis_id);
CREATE INDEX IF NOT EXISTS idx_documents_session ON documents(session_id);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(content_hash);
CREATE INDEX IF NOT EXISTS idx_agents_session ON agents(session_id);
CREATE INDEX IF NOT EXISTS idx_opinions_session ON opinions(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_agent ON messages(to_agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(to_agent_id, read_at) WHERE read_at IS NULL;

-- Insert predefined agent profiles
INSERT INTO agent_profiles (id, name, role, description, weight, soul)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001',
    'Debt Specialist',
    'debt',
    'Especialista em finanças de startups',
    1.0,
    'Especialista em finanças de startups. Foca em: burn rate, runway, unit economics, e sinais de distress financeiro.'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    'Tech Expert',
    'tech',
    'Arquiteto de software',
    0.8,
    'Arquiteto de software. Avalia: stack tecnológica, debt técnico, escalabilidade, e práticas de engenharia.'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    'Market Analyst',
    'market',
    'Estrategista de mercado',
    0.9,
    'Estrategista de mercado. Analisa: TAM/SAM/SOM, competition, product-market fit, e tendências de mercado.'
  )
ON CONFLICT (role) DO NOTHING;
