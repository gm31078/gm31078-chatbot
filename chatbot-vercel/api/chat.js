const MULTILINGUAL_SYSTEM = {
  role: 'system',
  content: 'You are a helpful multilingual assistant. CRITICAL: Always detect the language of the user\'s message and reply in exactly the same language. Support Bengali (বাংলা), English, Hindi, Arabic, Chinese, Spanish, French, German, Japanese, Korean, Russian, Urdu and all world languages fluently. Never refuse to reply because of the language. If the user writes in Bengali, reply in Bengali. If English, reply in English.',
};

function upstreamUrl(provider) {
  switch (provider) {
    case 'openai': return 'https://api.openai.com/v1/chat/completions';
    case 'groq': return 'https://api.groq.com/openai/v1/chat/completions';
    case 'openrouter': return 'https://openrouter.ai/api/v1/chat/completions';
    case 'anthropic': return 'https://api.anthropic.com/v1/messages';
    default: throw new Error('Unknown provider');
  }
}

function upstreamHeaders(provider) {
  const common = { 'Content-Type': 'application/json' };
  switch (provider) {
    case 'openai':
      return { ...common, 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` };
    case 'groq':
      return { ...common, 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` };
    case 'openrouter':
      return {
        ...common,
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://gm31078-chatbot.vercel.app',
        'X-Title': 'gm31078_Chatbot',
      };
    case 'anthropic':
      return {
        ...common,
        'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
        'anthropic-version': '2023-06-01',
      };
    default:
      return common;
  }
}

function buildUpstreamBody(provider, model, messages) {
  const upstreamMessages = [MULTILINGUAL_SYSTEM, ...messages];
  switch (provider) {
    case 'openai':
      return { model, messages: upstreamMessages, stream: false };
    case 'groq':
    case 'openrouter':
      return { model, messages: upstreamMessages, stream: false };
    case 'anthropic':
      return {
        model,
        max_tokens: 4096,
        system: MULTILINGUAL_SYSTEM.content,
        messages,
        stream: false,
      };
    default:
      return { model, messages: upstreamMessages, stream: false };
  }
}

function extractFullText(provider, json) {
  if (provider === 'anthropic') {
    if (json.content && Array.isArray(json.content)) {
      return json.content.map(c => (c.type === 'text' ? c.text : '')).join('');
    }
    return '';
  }
  // OpenAI-compatible (OpenAI, Groq, OpenRouter)
  return json.choices?.[0]?.message?.content || '';
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  const { messages, model: modelId } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).send('No messages provided.');
    return;
  }
  if (!modelId) {
    res.status(400).send('Please select a model.');
    return;
  }

  const [provider, model] = String(modelId).split(':');
  if (!provider || !model) {
    res.status(400).send('Invalid model format.');
    return;
  }

  const keyMissing = {
    openai: !process.env.OPENAI_API_KEY,
    anthropic: !process.env.ANTHROPIC_API_KEY,
    groq: !process.env.GROQ_API_KEY,
    openrouter: !process.env.OPENROUTER_API_KEY,
  }[provider];
  if (keyMissing) {
    res.status(401).send(`${provider.toUpperCase()} API key not configured in Vercel Environment Variables.`);
    return;
  }

  try {
    const upstream = await fetch(upstreamUrl(provider), {
      method: 'POST',
      headers: upstreamHeaders(provider),
      body: JSON.stringify(buildUpstreamBody(provider, model, messages)),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      let friendly = `Upstream error (${upstream.status})`;
      if (upstream.status === 401 || upstream.status === 403)
        friendly = 'API key is missing or invalid. Add it to Vercel Environment Variables.';
      else if (upstream.status === 402)
        friendly = 'Credit exhausted or payment required for this model.';
      else if (errText) friendly += ': ' + errText.slice(0, 300);
      res.status(upstream.status).send(friendly);
      return;
    }

    const data = await upstream.json();
    const reply = extractFullText(provider, data);
    res.status(200).send(reply || 'No response received.');
  } catch (err) {
    res.status(502).send('Connection error: ' + err.message);
  }
}
