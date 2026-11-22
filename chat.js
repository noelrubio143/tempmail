// Simpleng public chat room. Walang dependency (plain Node), SSE + POST.
const http = require("http");
const PORT = process.env.PORT || 3000;
const MAX_HISTORY = 100, MAX_LEN = 300, MAX_NICK = 20, COOLDOWN_MS = 1000;

const history = [];
const clients = new Set();
const lastSent = new Map();
let nextId = 1;

const clean = (s, n) => String(s ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, n);
const ipOf = req => (req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
const json = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };

function broadcast(msg) {
  const data = `data: ${JSON.stringify(msg)}\n\n`;
  for (const c of clients) c.write(data);
}

http.createServer((req, res) => {
  const url = req.url.split("?")[0];

  if (req.method === "GET" && url === "/chat/api/stream") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.write(`event: history\ndata: ${JSON.stringify(history)}\n\n`);
    clients.add(res);
    const ping = setInterval(() => res.write(": ping\n\n"), 25000);
    req.on("close", () => { clearInterval(ping); clients.delete(res); });
    return;
  }

  if (req.method === "POST" && url === "/chat/api/send") {
    let body = "";
    req.on("data", c => { body += c; if (body.length > 4096) req.destroy(); });
    req.on("end", () => {
      let p; try { p = JSON.parse(body); } catch { return json(res, 400, { error: "bad json" }); }
      const text = clean(p.text, MAX_LEN), nick = clean(p.nick, MAX_NICK) || "guest";
      if (!text) return json(res, 400, { error: "empty" });
      const ip = ipOf(req), now = Date.now();
      if (now - (lastSent.get(ip) || 0) < COOLDOWN_MS) return json(res, 429, { error: "bagalan lang" });
      lastSent.set(ip, now);
      const msg = { id: nextId++, nick, text, t: now };
      history.push(msg);
      if (history.length > MAX_HISTORY) history.shift();
      broadcast(msg);
      json(res, 200, { ok: true });
    });
    return;
  }

  json(res, 404, { error: "not found" });
}).listen(PORT, () => console.log("chat on", PORT));

setInterval(() => { const cut = Date.now() - 600000; for (const [k, v] of lastSent) if (v < cut) lastSent.delete(k); }, 300000);
