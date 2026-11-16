export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  const models = [];
  
  if (process.env.OPENAI_API_KEY) {
    models.push({ id: 'openai:gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', free: true });
    models.push({ id: 'openai:gpt-4o', name: 'GPT-4o', provider: 'OpenAI', free: false });
  }
  if (process.env.ANTHROPIC_API_KEY) {
    models.push({ id: 'anthropic:claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'Anthropic', free: true });
    models.push({ id: 'anthropic:claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', free: false });
  }
  if (process.env.GROQ_API_KEY) {
    models.push({ id: 'groq:llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: 'Groq', free: true });
    models.push({ id: 'groq:llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', provider: 'Groq', free: false });
  }
  if (process.env.OPENROUTER_API_KEY) {
    models.push({ id: 'openrouter:deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'OpenRouter', free: true });
    models.push({ id: 'openrouter:meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Free)', provider: 'OpenRouter', free: true });
    models.push({ id: 'openrouter:anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'OpenRouter', free: false });
  }

  res.status(200).json(models);
}
