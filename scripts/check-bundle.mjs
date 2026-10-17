import { readdir, stat, readFile } from "node:fs/promises";
import { join } from "node:path";
const forbidden =
  /^(node_modules|\.cache|\.npm|\.pnpm-store|out|cache|vendor)$/;
const generated = new Set(["node_modules", ".cache", ".npm", ".pnpm-store", "out", "cache"]);
let bytes = 0,
  count = 0;
const excluded = new Set([
  ".git",
  ".github",
  ".imd",
  ".agents",
  ".codex",
  "test/scratch",
]);
async function walk(dir = ".") {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (excluded.has(path) || entry.name.startsWith(".env")) continue;
    // These directories are excluded recursively by the budgeted .gitignore.
    // Do not modify protected dependency directories when checking the bundle.
    if (entry.isDirectory() && generated.has(entry.name)) continue;
    if (entry.isSymbolicLink())
      throw new Error(`No symlinks or submodules in deliverables: ${path}`);
    if (forbidden.test(entry.name) || /\.(tgz|tar|zip)$/.test(entry.name))
      throw new Error(
        `Unnecessary generated dependency/cache artifact: ${path}`,
      );
    if (entry.isDirectory()) await walk(path);
    else {
      bytes += (await stat(path)).size;
      count++;
    }
  }
}
await walk();
const ignore = await readFile(".gitignore", "utf8");
if (Buffer.byteLength(ignore) > 256) throw new Error(".gitignore exceeds its explicit 256-byte path budget");
for (const name of generated) if (!ignore.includes(`**/${name}/`)) throw new Error(`Missing recursive cache exclusion: ${name}`);
if (bytes >= 8388608) throw new Error(`Submission exceeds 8 MiB: ${bytes}`);
const manifest = JSON.parse(await readFile("launch.json", "utf8"));
const equal = (actual, expected) =>
  JSON.stringify(actual) === JSON.stringify(expected);
if (
  !equal(Object.keys(manifest), [
    "kind",
    "token",
    "contracts",
    "pool",
    "economics",
    "notes",
  ])
)
  throw new Error("Manifest keys differ");
if (
  manifest.token.totalSupply !== "1000000000000000000000000000" ||
  manifest.token.contract !== "CULTToken"
)
  throw new Error("Wrong token supply or contract");
if (
  !equal(manifest.economics, {
    poolBps: 9000,
    initialMarketCapWei: "2500000000000000000000",
    remainderTo: "0x000000000000000000000000000000000000dead",
  })
)
  throw new Error("Economics mismatch");
if (
  !equal(manifest.pool, {
    pairedCurrency: "0xd34a99bc0f67ae1bbd63c660e6d0b0dd03e263b7",
    fee: 12500,
    tickSpacing: 60,
    initialPrice: "125270724187523965593206900",
  })
)
  throw new Error("Pool mismatch");
console.log(
  `Submission files: ${count}; raw bytes: ${bytes.toLocaleString()} / 8,388,608. No dependency caches, archives, or links. Manifest matches the order.`,
);
