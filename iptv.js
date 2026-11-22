// Auto-updating PH IPTV list. Plain Node 20+, walang dependency.
// Kada INTERVAL_MIN: kukunin ang mga playlist, susubukan ang bawat stream,
// at ang gumagana lang ang ilalabas. Bago = auto-add, patay = auto-alis.
const http = require("http");
const fs = require("fs");

const SOURCES = (process.env.SOURCES || [
  "https://iptv-org.github.io/iptv/countries/ph.m3u",
  "https://iptv-org.github.io/iptv/languages/fil.m3u",
  "https://raw.githubusercontent.com/Free-TV/IPTV/master/playlists/playlist_philippines.m3u8",
].join(",")).split(",").map(s => s.trim()).filter(Boolean);
const INTERVAL = (+process.env.INTERVAL_MIN || 30) * 60000;
const CONCURRENCY = +process.env.CONCURRENCY || 20;
const TIMEOUT = +process.env.TIMEOUT_MS || 8000;
const CACHE = process.env.CACHE_FILE || "/data/cache.json";
const PORT = process.env.PORT || 3001;

let state = { updated: null, checking: false, total: 0, channels: [] };
try { state = { ...state, ...JSON.parse(fs.readFileSync(CACHE, "utf8")), checking: false }; } catch {}

function parse(txt) {
  const out = []; let meta = null;
  for (const line of txt.split(/\r?\n/)) {
    if (line.startsWith("#EXTINF")) {
      meta = {
        name: (line.split(/,(.*)$/s)[1] || "").trim(),
        logo: (line.match(/tvg-logo="([^"]*)"/) || [])[1] || "",
        group: (line.match(/group-title="([^"]*)"/) || [])[1] || "",
      };
    } else if (meta && /^https?:\/\//.test(line.trim())) {
      meta.url = line.trim(); if (meta.name) out.push(meta); meta = null;
    }
  }
  return out;
}

async function getText(url) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 30000);
  try { const r = await fetch(url, { signal: ac.signal }); if (!r.ok) throw new Error(r.status); return await r.text(); }
  finally { clearTimeout(t); }
}

async function alive(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), TIMEOUT);
    try {
      const r = await fetch(url, { signal: ac.signal, redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0", "Range": "bytes=0-2047" } });
      if (r.status !== 200 && r.status !== 206) { r.body && r.body.cancel().catch(() => {}); continue; }
      const reader = r.body.getReader();
      const { value } = await reader.read();
      reader.cancel().catch(() => {});
      if (!value || !value.length) continue;
      const head = Buffer.from(value).toString("utf8", 0, 512).trimStart();
      if (head.startsWith("<")) continue;                       // HTML / error page
      if (/\.m3u8?(\?|$)/i.test(url) && !head.startsWith("#EXTM3U")) continue;
      return true;
    } catch { /* retry */ } finally { clearTimeout(t); }
  }
  return false;
}

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; await fn(items[k], k); } }));
}

let running = false;
async function refresh() {
  if (running) return; running = true; state.checking = true;
  try {
    const res = await Promise.allSettled(SOURCES.map(getText));
    const ok = res.filter(r => r.status === "fulfilled");
    res.forEach((r, i) => { if (r.status === "rejected") console.log("source failed:", SOURCES[i]); });
    if (!ok.length) { console.log("walang nakuhang source; hawak ang lumang listahan"); return; }
    const seen = new Map();
    for (const r of ok) for (const c of parse(r.value)) if (!seen.has(c.url)) seen.set(c.url, c);
    const all = [...seen.values()], good = [];
    await pool(all, CONCURRENCY, async c => { if (await alive(c.url)) good.push(c); });
    good.sort((a, b) => a.name.localeCompare(b.name));
    state = { updated: Date.now(), checking: false, total: all.length, channels: good };
    try { fs.mkdirSync(require("path").dirname(CACHE), { recursive: true }); fs.writeFileSync(CACHE, JSON.stringify(state)); } catch {}
    console.log(`check tapos: ${good.length}/${all.length} gumagana`);
  } catch (e) { console.log("error:", e.message); }
  finally { running = false; state.checking = false; }
}

http.createServer((req, res) => {
  const u = req.url.split("?")[0];
  if (u === "/iptv/api/channels.json") {
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-cache" });
    return res.end(JSON.stringify(state));
  }
  if (u === "/iptv/api/channels.m3u") {
    res.writeHead(200, { "Content-Type": "audio/x-mpegurl", "Cache-Control": "no-cache" });
    return res.end("#EXTM3U\n" + state.channels.map(c =>
      `#EXTINF:-1 tvg-logo="${c.logo}" group-title="${c.group}",${c.name}\n${c.url}`).join("\n") + "\n");
  }
  res.writeHead(404); res.end("not found");
}).listen(PORT, () => console.log("iptv on", PORT));

refresh();
setInterval(refresh, INTERVAL);
