// Local server (Node 18+): npm start  ->  http://localhost:3000
import http from "http";
import fs from "fs";
import chat from "./api/chat.js";

try {
  for (const line of fs.readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
} catch {}

http.createServer((req, res) => {
  if (req.url === "/api/chat") {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try { req.body = JSON.parse(raw || "{}"); } catch { req.body = {}; }
      const out = {
        status(c) { res.statusCode = c; return out; },
        json(o) { res.setHeader("content-type", "application/json"); res.end(JSON.stringify(o)); },
      };
      chat(req, out);
    });
  } else {
    res.setHeader("content-type", "text/html; charset=utf-8");
    res.end(fs.readFileSync("index.html"));
  }
}).listen(process.env.PORT || 3000, () => console.log("Open http://localhost:" + (process.env.PORT || 3000)));
