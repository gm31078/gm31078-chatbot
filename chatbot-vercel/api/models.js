const models = [];

function add(id, name, provider, free) {
  models.push({ id, name, provider, free });
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (process.env.OPENAI_API_KEY) {
    add('openai:gpt-4o-mini', 'GPT-4o Mini', 'OpenAI', true);
    add('openai:gpt-4o', 'GPT-4o', 'OpenAI', false);
  }
  if (process.env.ANTHROPIC_API_KEY) {
    add('anthropic:claude-3-haiku-20240307', 'Claude 3 Haiku', 'Anthropic', true);
    add('anthropic:claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet', 'Anthropic', false);
  }
  if (process.env.GROQ_API_KEY) {
    add('groq:llama-3.1-8b-instant', 'Llama 3.1 8B Instant', 'Groq', true);
    add('groq:llama-3.3-70b-versatile', 'Llama 3.3 70B Versatile', 'Groq', false);
  }
  if (process.env.OPENROUTER_API_KEY) {
    add('openrouter:deepseek/deepseek-chat', 'DeepSeek Chat', 'OpenRouter', true);
    add('openrouter:meta-llama/llama-3.1-8b-instruct:free', 'Llama 3.1 8B (Free)', 'OpenRouter', true);
    add('openrouter:anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 'OpenRouter', false);
  }
  // নোট: ওলামা (Ollama) লোকাল সার্ভার chord দরকার, তাই Vercel সার্ভারলেসে এটি উপলব্ধ নয়।

  res.status(200).json(models);
}
