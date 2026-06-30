-- Migration 0011: Rename homepage primary CTA label

UPDATE settings
SET
  value = replace(value, '"primaryCtaLabel":"Khám phá gia phả"', '"primaryCtaLabel":"Xem gia phả"'),
  updatedAt = datetime('now')
WHERE key = 'site_config'
  AND value LIKE '%"primaryCtaLabel":"Khám phá gia phả"%';
