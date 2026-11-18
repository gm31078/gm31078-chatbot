const MULTILINGUAL_SYSTEM = {
  role: 'system',
  content: 'You are a helpful multilingual assistant. CRITICAL: Always detect the language of the user\'s message and reply in exactly the same language. Support Bengali (বাংলা), English, Hindi, Arabic, Chinese, Spanish, French, German, Japanese, Korean, Russian, Urdu and all world languages fluently. Never refuse to reply because of the language. If the user writes in Bengali, reply in Bengali. If English, reply in English.',
};

// Brain (Auto Select): free/fast models first, paid models last.
// Order matters — Brain tries them in this order until one works.
const BRAIN_CANDIDATES = [
  // --- FREE: Groq (fast, generous free tier) ---
  'groq:openai/gpt-oss-20b',
  'groq:openai/gpt-oss-120b',
  'groq:qwen/qwen3-32b',
  // --- FREE: Gemini direct API (generous free tier) ---
  // NOTE: gemini-2.0-flash shut down 2026-06-01, gemini-1.5-flash long dead.
  // Current live IDs (Nov 2026): gemini-3.8-flash, gemini-3.6-flash, gemini-2.5-flash-lite
  'gemini:gemini-3.8-flash',
  'gemini:gemini-2.5-flash-lite',
  // --- FREE: OpenRouter free endpoints (verified Nov 2026, may rotate) ---
  'openrouter:nvidia/nemotron-3.5-lightning:free',
  'openrouter:cohere/north-mini-code:free',
  'openrouter:nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  // --- FREE: Mistral La Plateforme (free tier) ---
  'mistral:mistral-small-latest',
  // --- FREE: Together AI ($5 free credits, OpenAI-compatible) ---
  'together:meta-llama/Llama-3.3-70B-Instruct-Turbo',
  'together:mistralai/Mixtral-8x7B-Instruct-v0.1',
  // --- PAID (work once billing/key fixed) ---
  'openai:gpt-4o-mini',
  'openai:gpt-4o',
  'openai:gpt-5-mini',
  'anthropic:claude-haiku-4-5-20251001',
  'anthropic:claude-sonnet-4-5-20250929',
];

function keyFor(provider) {
  const v = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    groq: process.env.GROQ_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    gemini: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    mistral: process.env.MISTRAL_API_KEY,
    together: process.env.TOGETHER_API_KEY,
  }[provider];
  return v ? String(v).trim() : v;
}

// Client sends {role, text}; upstream APIs need {role, content} with role 'assistant'
function normalizeMessages(messages) {
  return (messages || [])
    .filter(m => m && (m.text || m.content))
    .map(m => ({
      role: (m.role === 'model' || m.role === 'assistant') ? 'assistant' : (m.role === 'system' ? 'system' : 'user'),
      content: String(m.content != null ? m.content : m.text),
    }));
}

function splitId(modelId) {
  const s = String(modelId);
  const i = s.indexOf(':');
  if (i === -1) return [s, ''];
  return [s.slice(0, i), s.slice(i + 1)];
}

function upstreamUrl(provider, model) {
  switch (provider) {
    case 'openai': return 'https://api.openai.com/v1/chat/completions';
    case 'groq': return 'https://api.groq.com/openai/v1/chat/completions';
    case 'openrouter': return 'https://openrouter.ai/api/v1/chat/completions';
    case 'mistral': return 'https://api.mistral.ai/v1/chat/completions';
    case 'together': return 'https://api.together.xyz/v1/chat/completions';
    case 'anthropic': return 'https://api.anthropic.com/v1/messages';
    case 'gemini':
      return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(keyFor('gemini'))}`;
    default: throw new Error('Unknown provider');
  }
}

function upstreamHeaders(provider) {
  const common = { 'Content-Type': 'application/json' };
  switch (provider) {
    case 'openai':
      return { ...common, 'Authorization': `Bearer ${keyFor('openai')}` };
    case 'groq':
      return { ...common, 'Authorization': `Bearer ${keyFor('groq')}` };
    case 'mistral':
      return { ...common, 'Authorization': `Bearer ${keyFor('mistral')}` };
    case 'together':
      return { ...common, 'Authorization': `Bearer ${keyFor('together')}` };
    case 'openrouter':
      return {
        ...common,
        'Authorization': `Bearer ${keyFor('openrouter')}`,
        'HTTP-Referer': 'https://gm31078-chatbot.vercel.app',
        'X-Title': 'gm31078_Chatbot',
      };
    case 'anthropic':
      return {
        ...common,
        'x-api-key': keyFor('anthropic'),
        'anthropic-version': '2023-06-01',
      };
    case 'gemini':
      return { ...common };
    default:
      return common;
  }
}

function buildUpstreamBody(provider, model, messages) {
  const normalized = normalizeMessages(messages);
  const upstreamMessages = [MULTILINGUAL_SYSTEM, ...normalized];
  if (provider === 'anthropic') {
    return {
      model,
      max_tokens: 4096,
      system: MULTILINGUAL_SYSTEM.content,
      messages: normalized,
      stream: false,
    };
  }
  if (provider === 'gemini') {
    // Gemini generateContent format
    return {
      system_instruction: { parts: [{ text: MULTILINGUAL_SYSTEM.content }] },
      contents: normalized.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
    };
  }
  return { model, messages: upstreamMessages, stream: false };
}

function extractFullText(provider, json) {
  if (provider === 'anthropic') {
    if (json.content && Array.isArray(json.content)) {
      return json.content.map(c => (c.type === 'text' ? c.text : '')).join('');
    }
    return '';
  }
  if (provider === 'gemini') {
    try {
      const parts = json?.candidates?.[0]?.content?.parts || [];
      return parts.map(p => p.text || '').join('');
    } catch { return ''; }
  }
  return json.choices?.[0]?.message?.content || '';
}

async function callUpstream(provider, model, messages) {
  const upstream = await fetch(upstreamUrl(provider, model), {
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
  if (errText) return `${provider.toUpperCase()} upstream error (${status}): ` + errText.slice(0, 500);
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
      res.status(401).send('No API keys configured. Add at least one key (GEMINI_API_KEY / GROQ_API_KEY / OPENROUTER_API_KEY / MISTRAL_API_KEY / TOGETHER_API_KEY / OPENAI_API_KEY / ANTHROPIC_API_KEY) in Vercel Environment Variables, then Redeploy.');
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
    const hints = {
      gemini: 'GEMINI_API_KEY not configured. Get a free key at https://aistudio.google.com/app/apikey then add it in Vercel Environment Variables and Redeploy.',
      mistral: 'MISTRAL_API_KEY not configured. Get a free-tier key at https://console.mistral.ai/api-keys then add it in Vercel and Redeploy.',
      together: 'TOGETHER_API_KEY not configured. Get a key (free credits) at https://api.together.ai/settings/api-keys then add it in Vercel and Redeploy.',
    };
    const hint = hints[provider] || `${provider.toUpperCase()} API key not configured in Vercel Environment Variables. Use the Brain (Auto) option or add the key.`;
    res.status(401).send(hint);
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
