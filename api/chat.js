// Vercel serverless function: keeps your API key on the server.
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const prompt = req.body?.prompt;
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 30000) {
    return res.status(400).json({ error: "Prompt must be a non-empty string of at most 30000 characters." });
  }

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return res.status(500).json({
      error: "GROQ_API_KEY is missing. Locally, add it to .env and restart npm start. On Vercel, add it in Project Settings > Environment Variables and redeploy.",
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.MODEL || "openai/gpt-oss-120b",
        max_tokens: 400,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      return res.status(504).json({ error: "Groq took too long to respond. Please try again." });
    }
    return res.status(502).json({ error: "Could not reach Groq. Check the server's network connection and try again." });
  } finally {
    clearTimeout(timeout);
  }

  let result;
  try {
    result = await response.json();
  } catch {
    return res.status(502).json({ error: "Groq returned an invalid response. Try again later." });
  }

  if (!response.ok) {
    const message = result.error?.message || "The AI provider rejected the request.";
    return res.status(502).json({ error: `Groq API error (${response.status}): ${message}` });
  }

  const text = result.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    return res.status(502).json({ error: "Groq returned an empty response." });
  }

  return res.status(200).json({ text });
}
