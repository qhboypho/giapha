-- Migration 0012: Online incense offerings for anniversary memorials

CREATE TABLE IF NOT EXISTS incense_offerings (
  id TEXT PRIMARY KEY,
  memberId TEXT NOT NULL,
  viewerId TEXT NOT NULL,
  anniversaryKey TEXT NOT NULL,
  giftItems TEXT,
  ipAddress TEXT,
  ipHash TEXT,
  userAgent TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(memberId, viewerId, anniversaryKey),
  FOREIGN KEY (memberId) REFERENCES members(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_incense_offerings_member_key
  ON incense_offerings(memberId, anniversaryKey);

CREATE INDEX IF NOT EXISTS idx_incense_offerings_created_at
  ON incense_offerings(createdAt);

CREATE UNIQUE INDEX IF NOT EXISTS idx_incense_offerings_client_once
  ON incense_offerings(memberId, anniversaryKey, ipHash)
  WHERE ipHash IS NOT NULL;
