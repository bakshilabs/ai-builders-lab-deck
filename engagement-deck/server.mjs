/* ==========================================================================
   Tiny zero-dependency static server for the deck.

   Serves the PARENT folder (computer-xplorers-proposal/) so the deck at
   /engagement-deck/ can embed the live prototype at /ai-builders-lab/.

     npm run dev                 → http://localhost:8790/engagement-deck/
     PORT=9000 npm run dev       → another port
     node server.mjs --no-open   → don't open a browser
   ========================================================================== */
import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";

const DECK = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DECK, "..");
const PORT = parseInt(process.env.PORT || "8790", 10);
const OPEN = !process.argv.includes("--no-open") && process.env.NO_OPEN !== "1";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".mp4": "video/mp4",
};

const server = http.createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (urlPath === "/") {
      res.writeHead(302, { Location: "/engagement-deck/" });
      return res.end();
    }
    let file = path.normalize(path.join(ROOT, urlPath));
    if (!file.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    let info = await stat(file).catch(() => null);
    if (info && info.isDirectory()) {
      if (!urlPath.endsWith("/")) {
        res.writeHead(301, { Location: urlPath + "/" });
        return res.end();
      }
      file = path.join(file, "index.html");
      info = await stat(file).catch(() => null);
    }
    if (!info || !info.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found: " + urlPath);
    }
    res.writeHead(200, {
      "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Content-Length": info.size,
      "Cache-Control": "no-store",
    });
    if (req.method === "HEAD") return res.end();
    createReadStream(file).pipe(res);
  } catch (err) {
    res.writeHead(500);
    res.end("Server error");
  }
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") console.error("Port " + PORT + " is busy. Try: PORT=8791 npm run dev");
  else console.error(err);
  process.exit(1);
});

server.listen(PORT, "127.0.0.1", () => {
  const url = "http://localhost:" + PORT + "/engagement-deck/";
  console.log("\n  AI Builders Lab · engagement deck");
  console.log("  " + url);
  console.log("  Live prototype: http://localhost:" + PORT + "/ai-builders-lab/");
  console.log("  Press Ctrl+C to stop.\n");
  if (OPEN) {
    const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start \"\"" : "xdg-open";
    exec(cmd + " " + JSON.stringify(url), () => {});
  }
});
