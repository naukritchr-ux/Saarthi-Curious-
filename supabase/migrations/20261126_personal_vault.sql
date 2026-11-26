-- Personal Program Vault: per-student assigned/modified quizzes with strict user isolation
CREATE TABLE IF NOT EXISTS personal_vault_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_by INT,
  program_id INT,
  title TEXT NOT NULL,
  topic TEXT,
  difficulty TEXT NOT NULL DEFAULT 'hard', -- easy | medium | hard
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  passing_score INT NOT NULL DEFAULT 75,
  time_limit_mins INT NOT NULL DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'assigned', -- assigned | completed
  best_score INT,
  attempts_count INT NOT NULL DEFAULT 0,
  action_id UUID REFERENCES agent_action_queue(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_personal_vault_target_user
  ON personal_vault_quizzes (target_user_id, created_at DESC);

