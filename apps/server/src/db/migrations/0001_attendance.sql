CREATE TABLE IF NOT EXISTS meeting (
  id TEXT PRIMARY KEY,
  name TEXT,
  start_at INTEGER,
  end_at INTEGER,
  center_lat REAL NOT NULL,
  center_lng REAL NOT NULL,
  radius_m INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS attendee_directory (
  user_id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS used_token_nonce (
  nonce TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL,
  kiosk_id TEXT NOT NULL,
  consumed_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS checkin (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  lat REAL,
  lng REAL,
  accuracy_m REAL,
  user_agent_hash TEXT,
  ip_hash TEXT,
  kiosk_id TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS checkin_meeting_user_unique
  ON checkin (meeting_id, user_id);
