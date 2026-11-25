-- 1. Tier-3 Human-in-the-Loop Approval Queue
CREATE TABLE IF NOT EXISTS agent_action_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,            -- approve_user | update_user_role | deactivate_dormant | book_meeting
  summary TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  diff_preview JSONB DEFAULT '{}'::jsonb,
  engine_source TEXT NOT NULL DEFAULT 'ai', -- ai | deterministic_backup
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | executed | rejected | failed
  requested_by TEXT,
  reviewed_by TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_queue_status
  ON agent_action_queue (status, created_at DESC);

-- 2. Immutable Audit & Tier-2 Cooldown Ledger
CREATE TABLE IF NOT EXISTS agent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID REFERENCES agent_action_queue(id) ON DELETE SET NULL,
  tier INT NOT NULL,                    -- 1 | 2 | 3
  tool_name TEXT NOT NULL,
  target_user_id TEXT,
  actor_id TEXT,
  engine_source TEXT NOT NULL DEFAULT 'ai',
  result_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_audit_cooldown
  ON agent_audit_log (tool_name, target_user_id, created_at DESC);

-- 3. In-App Live Notifications (Tab Alerts, Nudges, Approvals)
CREATE TABLE IF NOT EXISTS agent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,                         -- NULL = broadcast to admins
  severity TEXT NOT NULL DEFAULT 'info',-- info | warning | action_required | success
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  route_target TEXT DEFAULT '/reports',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_notif_unread
  ON agent_notifications (is_read, created_at DESC);

-- Enable Supabase Realtime so Bell & Approval Drawer update live
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE agent_action_queue;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE agent_notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

