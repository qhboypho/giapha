-- Migration 0009: Add encrypted AI provider configuration placeholder

INSERT INTO settings (key, value)
SELECT 'ai_config', '{"provider":"openai","model":"gpt-5.5","encryptedApiKey":null,"keyPreview":"","updatedAt":""}'
WHERE NOT EXISTS (
  SELECT 1 FROM settings WHERE key = 'ai_config'
);
