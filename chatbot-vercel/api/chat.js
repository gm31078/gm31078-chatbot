const MULTILINGUAL_SYSTEM = {
  role: 'system',
  content: 'You are a helpful multilingual assistant. CRITICAL: Always detect the language of the user\'s message and reply in exactly the same language. Support Bengali (বাংলা), English, Hindi, Arabic, Chinese, Spanish, French, German, Japanese, Korean, Russian, Urdu and all world languages fluently. Never refuse to reply because of the language. If the user writes in Bengali, reply in Bengali. If English, reply in English.',
};

// Brain (Auto Select): order of models to try, free/fast ones first
const BRAIN_CANDIDATES = [
  'groq:llama-3.1-8b-instant',
  'openrouter:meta-llama/llama-3.1-8b-instruct:free',
  'openai:gpt-4o-mini',
  'anthropic:claude-3-haiku-20240307',
  'openrouter:deepseek/deepseek-chat',
  'groq:llama-3.3-70b-versatile',
  'openai:gpt-4o',
  'anthropic:claude-3-5-sonnet-20241022',
  'openrouter:anthropic/claude-3.5-sonnet',
];

function keyFor(provider) {
  return {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    groq: process.env.GROQ_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
  }[provider];
}

function splitId(modelId) {
  const i = String(modelId).indexOf(':');
  return [String(modelId).slice(0, i), String(modelId).slice(i + 1)];
}

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
  return json.choices?.[0]?.message?.content || '';
}

async function callUpstream(provider, model, messages) {
  const upstream = await fetch(upstreamUrl(provider), {
    method: 'POST',
    headers: upstreamHeaders(provider),
    body: JSON.stringify(buildUpstreamBody(provider, model, messages)),
  });
  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    return { ok: false, status: upstream.status, errText };
  }
  const data = await upstream.json();
  const reply = extractFullText(provider, data);
  return { ok: true, status: 200, reply };
}

function friendlyError(provider, status, errText) {
  if (status === 401 || status === 403)
    return `The ${provider.toUpperCase()} API key saved in Vercel was rejected (HTTP ${status}). Fix: Vercel Dashboard -> Settings -> Environment Variables -> edit the key -> paste the FULL key (copy it completely, no spaces or line breaks) -> Save -> Redeploy.`;
  if (status === 402)
    return `${provider.toUpperCase()}: credit exhausted or payment required for this model. Try another model or the Brain (Auto) option.`;
  if (status === 429)
    return `${provider.toUpperCase()}: rate limit / free quota exceeded (HTTP 429). Try the Brain (Auto) option or wait a moment.`;
  if (errText) return `${provider.toUpperCase()} upstream error (${status}): ` + errText.slice(0, 300);
  return `${provider.toUpperCase()} upstream error (${status}).`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'x-model-used');
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

  // ---------- Brain (Auto Select) ----------
  if (modelId === 'auto') {
    const available = BRAIN_CANDIDATES.filter(id => keyFor(splitId(id)[0]));
    if (!available.length) {
      res.status(401).send('No API keys configured. Add at least one key (OPENAI_API_KEY / GROQ_API_KEY / OPENROUTER_API_KEY / ANTHROPIC_API_KEY) in Vercel Environment Variables, then Redeploy.');
      return;
    }
    const errors = [];
    for (const id of available) {
      const [provider, model] = splitId(id);
      try {
        const result = await callUpstream(provider, model, messages);
        if (result.ok && result.reply) {
          res.setHeader('x-model-used', id);
          res.status(200).send(result.reply);
          return;
        }
        errors.push(id + ': ' + (result.ok ? 'empty reply' : friendlyError(provider, result.status, result.errText)));
      } catch (e) {
        errors.push(id + ': ' + e.message);
      }
    }
    res.status(502).send('Brain tried every available model but none worked:\n- ' + errors.join('\n- '));
    return;
  }

  // ---------- Specific model ----------
  const [provider, model] = splitId(modelId);
  if (!provider || !model) {
    res.status(400).send('Invalid model format.');
    return;
  }
  if (!keyFor(provider)) {
    res.status(401).send(`${provider.toUpperCase()} API key not configured in Vercel Environment Variables. Use the Brain (Auto) option or add the key.`);
    return;
  }

  try {
    const result = await callUpstream(provider, model, messages);
    if (!result.ok) {
      res.status(result.status).send(friendlyError(provider, result.status, result.errText));
      return;
    }
    res.setHeader('x-model-used', modelId);
    res.status(200).send(result.reply || 'No response received.');
  } catch (err) {
    res.status(502).send('Connection error: ' + err.message);
  }
}
