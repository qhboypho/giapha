-- Migration 0003: Add curated featured member flag

ALTER TABLE members ADD COLUMN isFeatured INTEGER NOT NULL DEFAULT 0;

UPDATE members
SET isFeatured = 1
WHERE id IN ('g1_1', 'g1_2', 'g2_5', 'g3_8');
