// Vercel serverless function: keeps your API key on the server.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const prompt = (req.body && req.body.prompt) || "";
  if (!prompt || prompt.length > 30000) return res.status(400).json({ error: "Bad prompt" });
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: process.env.MODEL || "claude-haiku-5-5", max_tokens: 700, messages: [{ role: "user", content: prompt }] })
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: j });
    res.status(200).json({ text: (j.content || []).map(c => c.text || "").join("") });
  } catch (e) { res.status(500).json({ error: String(e) }); }
}
