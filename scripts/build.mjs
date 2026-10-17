import { cp, mkdir, readFile, readdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";

// A deterministic static export: there is no compilation, bundling, or generated runtime.
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await cp("site", "dist", { recursive: true });
let files = 0,
  bytes = 0;
async function inspect(dir) {
  for (const file of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, file.name);
    if (file.isDirectory()) await inspect(path);
    else {
      files++;
      bytes += (await stat(path)).size;
    }
  }
}
await inspect("dist");
const html = await readFile("dist/index.html", "utf8");
for (const attribute of ["src", "href"]) {
  for (const match of html.matchAll(
    new RegExp(`${attribute}="([^"]+)"`, "g"),
  )) {
    if (match[1].startsWith("./")) await stat(join("dist", match[1]));
  }
}
console.log(
  `Static production export: ${files} files, ${bytes.toLocaleString()} bytes. All HTML assets resolve.`,
);
