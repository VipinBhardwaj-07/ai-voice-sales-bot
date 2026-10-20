# AI Voice Sales Bot

Aria is a browser-based AI sales assistant for live product conversations. It can speak and listen in English or Hindi, send the conversation to Claude for responses and sales insights, and save call records in the browser.

## Features

- Live voice conversations with browser speech recognition and speech synthesis
- English and Hindi language options, plus text input when speech recognition is unavailable
- Live transcript, call timer, sentiment, buying intent, and sales-stage indicators
- Configurable product name, pitch, and price
- Optional call recording and AI-generated call summaries
- Call history with recordings, transcripts, summaries, and sales outcomes
- Sales analytics and CSV export
- Call controls including mute, hold, and speaker options

## Requirements

- Node.js 18 or later
- An Anthropic API key for AI replies and summaries
- A current version of Chrome or Edge for the best speech-recognition support
- Microphone access; browsers generally require HTTPS for microphone access on deployed sites (localhost is permitted)

## Run locally

1. Clone the repository and open its directory:

   ```bash
   git clone https://github.com/VipinBhardwaj-07/ai-voice-sales-bot.git
   cd ai-voice-sales-bot
   ```

2. Create a local environment file from the example:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell, use `Copy-Item .env.example .env` instead.

3. Edit `.env` and set your key:

   ```dotenv
   ANTHROPIC_API_KEY=your_anthropic_api_key
   MODEL=claude-haiku-5-5
   ```

   Keep `.env` private; it is excluded from Git.

4. Start the application:

   ```bash
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) in Chrome or Edge.

No additional npm packages are required.

## Deploy to Vercel

1. Import this GitHub repository into Vercel.
2. Add `ANTHROPIC_API_KEY` to the project's environment variables. Optionally set `MODEL` to choose a different Anthropic model.
3. Deploy the project and open the generated HTTPS URL.
4. Allow microphone access in the browser before starting a call.

The `api/chat.js` serverless function calls Anthropic without exposing the API key to the browser.

## Using Aria

1. Open **Product Setup** to customize the product name, pitch, and price.
2. Choose English or Hindi and enable microphone access. If speech recognition is unavailable, use the text input.
3. Tick the recording and transcription consent checkbox before starting a call.
4. Start the call and use the live transcript and sales indicators to follow the conversation.
5. End the call to view its summary and sales outcome, then find saved calls under **Call History**.

Auto recording and AI summaries can be changed in the call controls. Calls can still be recorded only when the consent checkbox is selected.

## How it works

- `index.html` contains the single-page interface, browser voice features, call controls, and local call history.
- `server.js` serves the interface and exposes `/api/chat` for local development.
- `api/chat.js` validates requests and sends prompts to the Anthropic Messages API. The API key is read from the server environment.
- Speech recognition, speech synthesis, and microphone recording use browser APIs.
- Call recordings and call history are stored in the browser using IndexedDB. Product settings are stored in local storage.

## Privacy and limitations

- Call history and recordings are stored in the current browser on the current device; they are not synchronized to a central database.
- Conversation text is sent to the configured Anthropic API to generate replies and summaries. Do not use real customer information unless your organization's policies and applicable consent requirements permit it.
- Recording requires the in-app consent checkbox. Follow applicable laws and obtain any additional consent required in your location.
- Speech-recognition availability and Hindi voice quality depend on the browser, operating system, and installed voices. Use the text input if speech recognition is unavailable.
- Use headphones to reduce the chance that Aria's voice will be picked up by the microphone.

## Project files

```text
.
├── api/
│   └── chat.js
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── README.md
├── server.js
└── VIDEO_SCRIPT.md
```
