-- 1. OAuth2 Token Vault for External Integrations (Google Calendar)
CREATE TABLE IF NOT EXISTS integration_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'google_calendar',
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_uri TEXT DEFAULT 'https://oauth2.googleapis.com/token',
  scopes TEXT,
  expiry TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (admin_id, provider)
);

-- 2. Tracked Coaching & Retention Meetings
CREATE TABLE IF NOT EXISTS coaching_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID REFERENCES agent_action_queue(id) ON DELETE SET NULL,
  admin_id TEXT NOT NULL,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  agenda TEXT,
  meet_link TEXT,
  calendar_event_id TEXT,
  delivery_mode TEXT NOT NULL DEFAULT 'google_calendar', -- google_calendar | ics_fallback
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coaching_meetings_time
  ON coaching_meetings (start_time DESC);

