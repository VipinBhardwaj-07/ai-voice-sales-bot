# AI Voice Sales Bot (Aria)

A working AI voice bot that sells any SaaS product through a live voice conversation in **English or Hindi**.

## Requirements checklist (Sankar Group assignment)
| # | Requirement | Where |
|---|-------------|-------|
| 1 | Voice conversation (speaks, listens, answers, converts) | Browser speech recognition + speech synthesis, AI replies via `/api/chat` |
| 2 | Language | English and Hindi (dropdown) |
| 3 | Live chat screen | "Live Transcript" panel, updates in real time |
| 4 | Start / End Call, duration, status | Start Call and End Call buttons, timer, status pill |
| 5 | Call recording with consent | Consent checkbox required; recording saved and playable after the call |
| 6 | AI summary | Summary, requirements, objections, next steps, lead score |
| 7 | Sales status | Converted, Interested, Follow-up Required, Not Interested, Demo Requested, No Response |
| 8 | Call history | Call History page: recording, summary, full transcript, status |

Extras: live buy-intent gauge, sentiment, stage tracker, Sales Radar, analytics, CSV export, mute/hold/speaker, microphone check, product setup for any SaaS.

## Run locally
1. Install Node 18+.
2. Copy `.env.example` to `.env` and put your Anthropic API key in it.
3. `npm start` and open http://localhost:3000 in **Chrome or Edge**.

## Deploy for the "working website link" (free, Vercel)
1. Push this folder to a GitHub repo, import it in Vercel.
2. In Project Settings > Environment Variables add `ANTHROPIC_API_KEY`.
3. Deploy. The site is served over HTTPS, which the microphone needs.

## How it works
1. The customer ticks consent and presses Start Call. The browser records the microphone (MediaRecorder).
2. Aria greets in the chosen language (speech synthesis). Then speech recognition turns the customer's words into text.
3. Each turn, the transcript goes to `/api/chat`, which asks Claude for the next sales line plus live insights (sentiment, buy intent, stage, key point).
4. On End Call, Claude produces the summary, requirements, objections, next steps, lead score and one of the six statuses.
5. The call (audio, transcript, summary, status) is saved in the browser's IndexedDB and shown in Call History.

## Notes
- Use headphones so the bot voice does not echo into the recording.
- Call history is stored per browser. For shared history, add a database.
- Hindi speech voices depend on what is installed on the device.
