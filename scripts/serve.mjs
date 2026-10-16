import { legacyRedirect } from "./legacy-redirects.mjs";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createGzip } from "node:zlib";
const root = path.resolve("out");
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".wasm": "application/wasm",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
};
http
  .createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL((req.url || "/").replace(/^\/+/, "/"), "http://localhost").pathname);
    } catch {
      res.writeHead(400).end("Invalid URL");
      return;
    }
    const target=legacyRedirect(pathname);
    if(target){res.writeHead(308,{Location:target}).end();return;}
    let file = path.resolve(root, "." + pathname);
    if (!file.startsWith(root + path.sep) && file !== root) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory())
      file = path.join(file, "index.html");
    if (!fs.existsSync(file)) {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end(fs.readFileSync(path.join(root, "404.html")));
      return;
    }
    res.setHeader(
      "Content-Type",
      types[path.extname(file)] ??
        (pathname.startsWith("/og/") || pathname.startsWith("/icons/")
          ? "image/png"
          : "application/octet-stream"),
    );
    if (file.endsWith("sw.js")) res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Vary", "Accept-Encoding");
    const compress =
      /\.(html|css|js|mjs|json|txt|svg|xml|webmanifest)$/.test(file) &&
      req.headers["accept-encoding"]?.includes("gzip");
    if (compress) {
      res.setHeader("Content-Encoding", "gzip");
      fs.createReadStream(file).pipe(createGzip()).pipe(res);
    } else fs.createReadStream(file).pipe(res);
  })
  .listen(Number(process.env.PORT || 3000), "127.0.0.1", () => console.log(`Iwons: http://127.0.0.1:${process.env.PORT || 3000}`));
