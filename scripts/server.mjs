import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};
export async function serve(root = "dist", port = 0) {
  const directory = resolve(root);
  const server = createServer(async (request, response) => {
    try {
      let path = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      if (path.startsWith("/preview/")) path = path.slice("/preview".length);
      if (path === "/") path = "/index.html";
      const file = resolve(directory, "." + path);
      if (!file.startsWith(directory + "/")) {
        response.writeHead(403);
        response.end();
        return;
      }
      const data = await readFile(file);
      response.writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      response.end(data);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain" });
      response.end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  return { server, url };
}
