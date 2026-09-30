import type { VercelRequest, VercelResponse } from '@vercel/node';

const SYSTEM = `You are TRADE ACADEMY AI Mentor. Teach Forex and trading for beginners in clear Russian or Tajik, matching the user's language. Explain concepts, not guaranteed profits. Never present a trade as certain. Emphasize demo practice, risk management, Stop Loss, position sizing and journaling. When asked for a strategy, give explicit rules, assumptions and invalidation conditions. When the user asks about a personal trade, explain what can be inferred from the provided information and state what is missing. Keep answers practical, structured and concise. You are an educational assistant, not a broker or financial adviser.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(503).json({ error: 'AI backend is not configured' });
  const { question, lang = 'ru', history = [] } = req.body || {};
  if (typeof question !== 'string' || !question.trim()) return res.status(400).json({ error: 'Question is required' });

  const language = lang === 'tj' ? 'Tajik' : 'Russian';
  const safeHistory = Array.isArray(history) ? history.slice(-12).filter((x: unknown) => typeof x === 'string') : [];
  const input = [
    { role: 'system', content: SYSTEM + `\nAnswer in ${language}.` },
    ...safeHistory.map((x: string) => ({ role: x.startsWith('AI:') ? 'assistant' : 'user', content: x.replace(/^(AI:|YOU:)\s*/, '') })),
    { role: 'user', content: question.trim() },
  ];

  try {
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-5.6-luna', input, max_output_tokens: 700 }),
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: data?.error?.message || 'OpenAI request failed' });
    const text = data?.output_text || data?.output?.flatMap((o: any) => o.content || []).map((c: any) => c.text || '').join('') || '';
    return res.status(200).json({ text: text.trim(), model: process.env.OPENAI_MODEL || 'gpt-5.6-luna' });
  } catch (e) {
    return res.status(500).json({ error: 'AI service temporarily unavailable' });
  }
}
