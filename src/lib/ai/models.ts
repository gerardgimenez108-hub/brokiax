import type { LLMProvider } from "@/lib/types";
import { X402_AVAILABLE_MODELS } from "@/lib/x402/types";

export interface ModelOption {
  id: string;
  name: string;
}

export interface ProviderOption {
  id: LLMProvider;
  name: string;
  url: string;
  credentialLabel: string;
  placeholder: string;
  helperText: string;
}

export const LLM_PROVIDER_OPTIONS: ProviderOption[] = [
  { id: "openrouter", name: "OpenRouter (Recomendado)", url: "https://openrouter.ai/keys", credentialLabel: "API Key", placeholder: "sk-or-...", helperText: "Gateway unificado para múltiples modelos." },
  { id: "openai", name: "OpenAI", url: "https://platform.openai.com/api-keys", credentialLabel: "API Key", placeholder: "sk-...", helperText: "Acceso directo a GPT." },
  { id: "anthropic", name: "Anthropic", url: "https://console.anthropic.com/settings/keys", credentialLabel: "API Key", placeholder: "sk-ant-...", helperText: "Acceso directo a Claude." },
  { id: "deepseek", name: "DeepSeek", url: "https://platform.deepseek.com/api_keys", credentialLabel: "API Key", placeholder: "sk-...", helperText: "Proveedor OpenAI-compatible." },
  { id: "gemini", name: "Google Gemini", url: "https://aistudio.google.com/app/apikey", credentialLabel: "API Key", placeholder: "AIza...", helperText: "Acceso directo a Gemini." },
  { id: "grok", name: "xAI (Grok)", url: "https://console.x.ai/", credentialLabel: "API Key", placeholder: "xai-...", helperText: "Proveedor OpenAI-compatible." },
  { id: "qwen", name: "Alibaba Qwen", url: "https://dashscope.console.aliyun.com/", credentialLabel: "API Key", placeholder: "sk-...", helperText: "Proveedor OpenAI-compatible." },
  { id: "kimi", name: "Moonshot (Kimi)", url: "https://platform.moonshot.cn/console/api-keys", credentialLabel: "API Key", placeholder: "sk-...", helperText: "Proveedor OpenAI-compatible." },
  { id: "minimax", name: "MiniMax", url: "https://platform.minimaxi.com/", credentialLabel: "API Key", placeholder: "sk-...", helperText: "Proveedor OpenAI-compatible." },
  { id: "x402", name: "x402 / Claw402 (USDC en Base)", url: "https://claw402.ai", credentialLabel: "Private Key del wallet", placeholder: "0x... o hex sin 0x", helperText: "Pago por uso con USDC sin API key del proveedor LLM." },
];

export const MODELS_BY_PROVIDER: Record<LLMProvider, ModelOption[]> = {
  openrouter: [
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
    { id: "openai/gpt-4o", name: "GPT-4o" },
    { id: "openai/gpt-4o-mini", name: "GPT-4o mini" },
    { id: "deepseek/deepseek-chat", name: "DeepSeek Chat" },
    { id: "google/gemini-2.0-flash", name: "Gemini 2.0 Flash" },
    { id: "google/gemini-pro-1.5", name: "Gemini 1.5 Pro" },
  ],
  openai: [
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o mini" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
  ],
  anthropic: [
    { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet" },
    { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
  ],
  deepseek: [
    { id: "deepseek-chat", name: "DeepSeek Chat" },
  ],
  gemini: [
    { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
    { id: "gemini-pro-1.5", name: "Gemini 1.5 Pro" },
  ],
  grok: [
    { id: "grok-2-1212", name: "Grok 2" },
  ],
  qwen: [
    { id: "qwen-max", name: "Qwen Max" },
  ],
  kimi: [
    { id: "kimi-k2", name: "Kimi K2" },
  ],
  minimax: [
    { id: "MiniMax-M1", name: "MiniMax M1" },
  ],
  x402: X402_AVAILABLE_MODELS.map((model) => ({
    id: model.id,
    name: `${model.name} (${model.provider})`,
  })),
};

export function getProviderModels(provider?: string | null): ModelOption[] {
  if (!provider) return [];
  return MODELS_BY_PROVIDER[provider as LLMProvider] || [];
}

export function getProviderOption(provider?: string | null): ProviderOption | undefined {
  return LLM_PROVIDER_OPTIONS.find((option) => option.id === provider);
}
