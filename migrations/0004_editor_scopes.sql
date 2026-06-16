-- Migration 0004: Optional branch scope for editor accounts

ALTER TABLE users ADD COLUMN editScopeRootId TEXT;
