// Vercel serverless function: keeps your Groq key on the server (never in the browser).
const MODEL = 'llama-3.3-70b-versatile';
const PRODUCT = `Product: "FlowDesk" - a SaaS CRM + helpdesk for small businesses. Plans: Starter Rs 999/mo, Growth Rs 2,499/mo (most popular), Pro Rs 4,999/mo. Features: WhatsApp inbox, automated follow-ups, sales pipeline, analytics, Hindi/English support. 14-day free trial, live demo available, 20% off on annual plans.`;

async function groq(messages, json) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.6, max_tokens: 400, ...(json && { response_format: { type: 'json_object' } }) })
  });
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()).choices[0].message.content;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { mode, messages = [], lang = 'en-IN' } = req.body;
    const L = lang.startsWith('hi') ? 'Hindi (Devanagari script)' : 'English';
    if (mode === 'summary') {
      const t = messages.map(m => `${m.role === 'ai' ? 'Vexora' : 'Customer'}: ${m.text}`).join('\n');
      const out = await groq([
        { role: 'system', content: 'You analyse sales calls. Reply ONLY with JSON: {"summary":"2-3 sentences","requirements":["..."],"objections":["..."],"nextSteps":["..."],"sentiment":"Positive|Neutral|Negative","status":"Converted|Interested|Follow-up Required|Not Interested|Demo Requested|No Response"}. Use English. Use "No Response" if the customer said nothing meaningful.' },
        { role: 'user', content: t || '(no conversation)' }], true);
      return res.json(JSON.parse(out));
    }
    const sys = `You are Vexora, a friendly, persuasive AI sales agent on a live phone call for Sankar Group. ${PRODUCT}
Speak ONLY in ${L}. Keep replies to 1-3 short spoken sentences, no emojis, no lists. Greet, ask about their business needs, explain relevant features, handle objections politely, and try to close: offer the free trial or a demo and ask for a name/time. Never invent features. If they want to end the call, thank them and say goodbye.`;
    const hist = messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));
    if (!hist.length) hist.push({ role: 'user', content: '(The call just connected. Greet the customer and introduce yourself.)' });
    res.json({ reply: (await groq([{ role: 'system', content: sys }, ...hist])).trim() });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
}
