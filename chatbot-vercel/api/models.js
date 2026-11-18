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
    add('groq:openai/gpt-oss-20b', 'GPT-OSS 20B (fastest) [Free]', 'Groq', true);
    add('groq:openai/gpt-oss-120b', 'GPT-OSS 120B [Free]', 'Groq', true);
    add('groq:qwen/qwen3-32b', 'Qwen3 32B [Free]', 'Groq', true);
  }
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
    add('gemini:gemini-2.0-flash', 'Gemini 2.0 Flash [Free]', 'Gemini', true);
    add('gemini:gemini-1.5-flash', 'Gemini 1.5 Flash [Free]', 'Gemini', true);
  }
  if (process.env.OPENAI_API_KEY) {
    add('openai:gpt-4o-mini', 'GPT-4o Mini', 'OpenAI', false);
    add('openai:gpt-4o', 'GPT-4o', 'OpenAI', false);
    add('openai:gpt-5-mini', 'GPT-5 Mini', 'OpenAI', false);
  }
  if (process.env.ANTHROPIC_API_KEY) {
    add('anthropic:claude-haiku-4-5-20251001', 'Claude Haiku 4.5', 'Anthropic', false);
    add('anthropic:claude-sonnet-4-5-20250929', 'Claude Sonnet 4.5', 'Anthropic', false);
  }
  if (process.env.MISTRAL_API_KEY) {
    add('mistral:mistral-small-latest', 'Mistral Small [Free tier]', 'Mistral', true);
    add('mistral:mistral-medium-latest', 'Mistral Medium', 'Mistral', false);
  }
  if (process.env.TOGETHER_API_KEY) {
    add('together:meta-llama/Llama-3.3-70B-Instruct-Turbo', 'Llama 3.3 70B Turbo [Free credits]', 'Together', true);
    add('together:mistralai/Mixtral-8x7B-Instruct-v0.1', 'Mixtral 8x7B [Free credits]', 'Together', true);
  }
  if (process.env.OPENROUTER_API_KEY) {
    // NOTE: OpenRouter :free catalog rotates every few weeks.
    // These 3 answered 3/3 live tests in Nov 2026. If one 404s, replace from https://openrouter.ai/models?q=free
    add('openrouter:nvidia/nemotron-3.5-lightning:free', 'Nemotron Lightning (Free)', 'OpenRouter', true);
    add('openrouter:cohere/north-mini-code:free', 'North Mini Code (Free)', 'OpenRouter', true);
    add('openrouter:nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', 'Nemotron Nano Reasoning (Free)', 'OpenRouter', true);
  }
  // Note: Ollama needs a local server, so it is not available on Vercel serverless.

  res.status(200).json(models);
}
