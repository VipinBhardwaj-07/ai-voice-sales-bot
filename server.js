// Local server (Node 18+): npm start -> http://localhost:3000
import http from "node:http";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import chat from "./api/chat.js";

const projectDir = fileURLToPath(new URL(".", import.meta.url));
for (const envFile of [".env.local", ".env"]) {
  const envPath = fileURLToPath(new URL(envFile, import.meta.url));
  if (!fs.existsSync(envPath)) continue;
  for (const line of fs.readFileSync(envPath, "utf8").replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.replace(/^export\s+/, "").match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2").trim();
    }
  }
}

const sendJson = (res, statusCode, body) => {
  res.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
};

export const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname;

  if (pathname === "/api/chat") {
    if (req.method !== "POST") {
      res.setHeader("allow", "POST");
      return sendJson(res, 405, { error: "POST only" });
    }

    let raw = "";
    for await (const chunk of req) {
      raw += chunk;
      if (raw.length > 35000) {
        return sendJson(res, 413, { error: "Request body is too large." });
      }
    }

    try {
      req.body = JSON.parse(raw || "{}");
    } catch {
      return sendJson(res, 400, { error: "Request body must be valid JSON." });
    }

    const response = {
      status(statusCode) {
        res.statusCode = statusCode;
        return this;
      },
      json(body) {
        res.setHeader("content-type", "application/json; charset=utf-8");
        res.end(JSON.stringify(body));
      },
    };

    try {
      await chat(req, response);
    } catch (error) {
      console.error("Local chat API failed:", error);
      if (!res.headersSent) {
        sendJson(res, 500, { error: "The local chat API failed. Check the server console." });
      }
    }
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("allow", "GET, HEAD");
    return sendJson(res, 405, { error: "Only GET and HEAD are supported for this path." });
  }

  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  if (req.method === "HEAD") return res.end();
  res.end(fs.readFileSync(`${projectDir}index.html`));
});

const port = Number(process.env.PORT || 3000);
server.listen(port, () => {
  console.log(`Aria is running at http://localhost:${server.address().port}`);
  if (process.env.GROQ_API_KEY) {
    console.log("GROQ_API_KEY is configured.");
  } else {
    console.warn("GROQ_API_KEY is missing. Copy .env.example to .env, add your key, then restart npm start.");
  }
});
