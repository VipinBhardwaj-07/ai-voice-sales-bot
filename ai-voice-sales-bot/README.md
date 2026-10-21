# Vexora – AI Voice Sales Bot (Sankar Group assignment)
Hindi/English voice sales agent: live voice call, real-time transcript, call controls + timer, consent-based recording & playback, AI summary, auto sales status, call history, profile view, analytics.

**Stack:** static HTML/CSS/JS + one Vercel serverless function (`api/chat.js`) calling Groq (`llama-3.3-70b-versatile`). Voice uses the browser Web Speech API (use Chrome/Edge). Recordings & history are stored in the browser (IndexedDB).

## Deploy
1. Push to GitHub: `git init && git add . && git commit -m "Vexora voice bot" && git branch -M main && git remote add origin https://github.com/VipinBhardwaj-07/ai-voice-sales-bot.git && git push -u origin main`
2. vercel.com → Add New Project → import the repo → **Settings → Environment Variables**: add `GROQ_API_KEY` = your key → Deploy.
3. Open the HTTPS link in Chrome, tick consent, press Start Call, allow the mic.

## Local test
`npm i -g vercel && vercel dev` (put the key in `.env.local`, already included in the zip).
Never commit your API key.
