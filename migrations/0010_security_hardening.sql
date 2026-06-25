-- Migration 0010: Security hardening helpers

CREATE TABLE IF NOT EXISTS login_attempts (
  id TEXT PRIMARY KEY,
  ipAddress TEXT NOT NULL,
  username TEXT NOT NULL,
  attemptedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON login_attempts(ipAddress, attemptedAt);
CREATE INDEX IF NOT EXISTS idx_login_attempts_username_time ON login_attempts(username, attemptedAt);

ALTER TABLE viewer_presence ADD COLUMN ipAddress TEXT;
CREATE INDEX IF NOT EXISTS idx_viewer_presence_ip_last_seen ON viewer_presence(ipAddress, lastSeenAt);

ALTER TABLE sessions ADD COLUMN ipAddress TEXT;
ALTER TABLE sessions ADD COLUMN userAgent TEXT;
