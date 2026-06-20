export const AI_CONFIG_SETTING_KEY = "ai_config";

export const AI_PROVIDERS = {
  openai: {
    label: "OpenAI",
    defaultModel: "gpt-5.5"
  },
  gemini: {
    label: "Gemini",
    defaultModel: "gemini-2.5-flash"
  },
  claude: {
    label: "Claude",
    defaultModel: "claude-sonnet-4-5"
  }
};

export const DEFAULT_AI_CONFIG = {
  provider: "openai",
  model: AI_PROVIDERS.openai.defaultModel,
  encryptedApiKey: null,
  keyPreview: "",
  updatedAt: ""
};

export function getAiProviderConfig(provider) {
  return AI_PROVIDERS[provider] || AI_PROVIDERS.openai;
}

export function normalizeAiProvider(provider) {
  const normalized = String(provider || "").trim().toLowerCase();
  return AI_PROVIDERS[normalized] ? normalized : DEFAULT_AI_CONFIG.provider;
}

export function normalizeAiConfig(value = {}) {
  const provider = normalizeAiProvider(value.provider);
  const model = String(value.model || getAiProviderConfig(provider).defaultModel).trim() || getAiProviderConfig(provider).defaultModel;

  return {
    provider,
    model,
    encryptedApiKey: value.encryptedApiKey || null,
    keyPreview: String(value.keyPreview || "").trim(),
    updatedAt: String(value.updatedAt || "").trim()
  };
}

export function parseAiConfigValue(value) {
  try {
    return normalizeAiConfig(value ? JSON.parse(value) : {});
  } catch {
    return normalizeAiConfig();
  }
}

export function serializeAiConfig(config) {
  return JSON.stringify(normalizeAiConfig(config));
}

export function buildKeyPreview(apiKey = "") {
  const value = String(apiKey || "").trim();
  if (!value) return "";
  if (value.length <= 8) return "••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export function buildPublicAiConfig(config = {}, options = {}) {
  const normalized = normalizeAiConfig(config);
  return {
    provider: normalized.provider,
    providerLabel: getAiProviderConfig(normalized.provider).label,
    model: normalized.model,
    hasApiKey: Boolean(normalized.encryptedApiKey || options.hasEnvApiKey),
    keyPreview: normalized.keyPreview,
    updatedAt: normalized.updatedAt,
    encryptionReady: Boolean(options.encryptionReady),
    envFallback: Boolean(options.hasEnvApiKey && !normalized.encryptedApiKey)
  };
}

export function validateAiConfigInput(input = {}, existing = {}) {
  const provider = normalizeAiProvider(input.provider);
  const model = String(input.model || getAiProviderConfig(provider).defaultModel).trim();

  if (!model) {
    throw new Error("Vui lòng nhập model AI.");
  }

  return {
    ...normalizeAiConfig(existing),
    provider,
    model
  };
}
