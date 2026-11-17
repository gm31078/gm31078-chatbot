const models = [];

function add(id, name, provider, free) {
  models.push({ id, name, provider, free });
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (process.env.GROQ_API_KEY) {
    // Groq retired llama-3.1-8b-instant / llama-3.3-70b-versatile on 2026-08-16
    add('groq:openai/gpt-oss-20b', 'GPT-OSS 20B (fastest)', 'Groq', true);
    add('groq:openai/gpt-oss-120b', 'GPT-OSS 120B', 'Groq', true);
    add('groq:qwen/qwen3.6-27b', 'Qwen3.6 27B', 'Groq', true);
  }
  if (process.env.OPENAI_API_KEY) {
    add('openai:gpt-5-mini', 'GPT-5 Mini', 'OpenAI', false);
    add('openai:gpt-4o-mini', 'GPT-4o Mini', 'OpenAI', false);
    add('openai:gpt-4o', 'GPT-4o', 'OpenAI', false);
  }
  if (process.env.ANTHROPIC_API_KEY) {
    add('anthropic:claude-haiku-4-5-20251001', 'Claude Haiku 4.5', 'Anthropic', false);
    add('anthropic:claude-sonnet-4-5-20250929', 'Claude Sonnet 4.5', 'Anthropic', false);
  }
  if (process.env.OPENROUTER_API_KEY) {
    add('openrouter:meta-llama/llama-3.1-8b-instruct:free', 'Llama 3.1 8B (Free)', 'OpenRouter', true);
    add('openrouter:deepseek/deepseek-chat', 'DeepSeek Chat', 'OpenRouter', true);
    add('openrouter:anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 'OpenRouter', false);
  }
  // Note: Ollama needs a local server, so it is not available on Vercel serverless.

  res.status(200).json(models);
}
