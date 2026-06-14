-- Migration 0001: Schema Initialization

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT NOT NULL,
  generation INTEGER NOT NULL,
  isDeceased INTEGER NOT NULL DEFAULT 0, -- 0 for false, 1 for true
  birthDate TEXT,
  deathDate TEXT,
  birthPlace TEXT,
  restingPlace TEXT,
  occupation TEXT,
  bio TEXT,
  phone TEXT,
  address TEXT,
  avatar TEXT, -- Base64 encoded image
  isFeatured INTEGER NOT NULL DEFAULT 0, -- 0 for false, 1 for featured homepage member
  spouseIds TEXT, -- JSON array of strings: e.g. '["g1_2"]'
  fatherId TEXT,
  motherId TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL, -- PBKDF2 Hash format: pbkdf2:salt:hash
  role TEXT NOT NULL, -- admin, editor, member, guest
  fullName TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
