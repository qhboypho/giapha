import assert from "node:assert/strict";
import {
  AI_PROVIDERS,
  buildKeyPreview,
  buildPublicAiConfig,
  normalizeAiConfig,
  parseAiConfigValue,
  serializeAiConfig,
  validateAiConfigInput
} from "../src/utils/aiConfigUtils.js";

const normalized = normalizeAiConfig({
  provider: "gemini",
  model: " gemini-2.5-pro ",
  encryptedApiKey: { version: 1, iv: "iv", data: "data" },
  keyPreview: "AIza••••1234"
});

assert.equal(normalized.provider, "gemini");
assert.equal(normalized.model, "gemini-2.5-pro");
assert.deepEqual(normalized.encryptedApiKey, { version: 1, iv: "iv", data: "data" });

assert.equal(normalizeAiConfig({ provider: "unknown" }).provider, "openai");
assert.equal(normalizeAiConfig({ provider: "claude", model: "" }).model, AI_PROVIDERS.claude.defaultModel);
assert.equal(buildKeyPreview("sk-test-abcdef123456"), "sk-t••••3456");
assert.equal(buildKeyPreview("short"), "••••");

const serialized = serializeAiConfig(normalized);
assert.deepEqual(parseAiConfigValue(serialized), normalized);

const publicConfig = buildPublicAiConfig(normalized, {
  encryptionReady: true,
  hasEnvApiKey: false
});
assert.equal(publicConfig.hasApiKey, true);
assert.equal(publicConfig.keyPreview, "AIza••••1234");
assert.equal(Object.prototype.hasOwnProperty.call(publicConfig, "encryptedApiKey"), false);

const validated = validateAiConfigInput({ provider: "claude", model: " claude-sonnet-4-5 " }, normalized);
assert.equal(validated.provider, "claude");
assert.equal(validated.model, "claude-sonnet-4-5");
assert.deepEqual(validated.encryptedApiKey, normalized.encryptedApiKey);

console.log("aiConfigUtils tests passed");
