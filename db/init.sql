-- iC-PM Datenbank Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Benutzer
CREATE TABLE IF NOT EXISTS users (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name          TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Projekte
CREATE TABLE IF NOT EXISTS projects (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT DEFAULT '#3B82F6',
  status      TEXT DEFAULT 'active' CHECK (status IN ('active','archived','completed')),
  owner       TEXT,
  start_date  DATE,
  end_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Aufgaben
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  status      TEXT DEFAULT 'new' CHECK (status IN ('new','in_progress','done','overdue','blocked')),
  priority    TEXT DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  assignee    TEXT,
  start_date  DATE,
  deadline    DATE,
  progress    INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  position    INTEGER DEFAULT 0,
  depends_on  UUID[] DEFAULT '{}',   -- Task-IDs von denen diese Aufgabe abhängt
  checklist   JSONB DEFAULT '[]',    -- [{id, text, done, sub: [{...}]}]
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Automatisch Status auf 'overdue' setzen
CREATE OR REPLACE FUNCTION update_overdue_status()
RETURNS void AS $$
  UPDATE tasks
  SET status = 'overdue', updated_at = NOW()
  WHERE deadline < CURRENT_DATE
    AND status NOT IN ('done', 'overdue');
$$ LANGUAGE SQL;

-- Indizes
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status  ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);

-- Demo-Daten
INSERT INTO projects (name, description, color, start_date, end_date, owner) VALUES
('Website Relaunch Q2', 'Komplette Überarbeitung der Marketing-Website', '#3B82F6', '2026-04-01', '2026-06-30', 'Anna Müller'),
('Social Media Kampagne', 'LinkedIn + Instagram Frühjahrskampagne', '#10B981', '2026-04-01', '2026-05-15', 'Tom Schmidt')
ON CONFLICT DO NOTHING;
