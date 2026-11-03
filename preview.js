#!/usr/bin/env node
/* Tiny local web server for checking the built site before publishing.
   Run:  npm run preview   then open http://localhost:8080  (Ctrl+C to stop) */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "public");
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".xml": "application/xml", ".txt": "text/plain",
};

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  let file = path.normalize(path.join(DIR, p));
  if (!file.startsWith(DIR)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory() && fs.existsSync(path.join(file, "index.html"))) file = path.join(file, "index.html");
  else if (fs.existsSync(file + ".html")) file += ".html";
  if (!fs.existsSync(file) && fs.existsSync(file + ".html")) file += ".html";
  if (!fs.existsSync(file)) {
    res.writeHead(404, { "Content-Type": TYPES[".html"] });
    return res.end(fs.readFileSync(path.join(DIR, "404.html")));
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Preview running at http://localhost:${PORT}  (press Ctrl+C to stop)`));
