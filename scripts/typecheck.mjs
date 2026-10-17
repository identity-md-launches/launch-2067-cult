import { spawnSync } from "node:child_process";
import { join } from "node:path";
const root = process.env.CULT_TOOLS || "/tmp/cult-toolchain";
const result = spawnSync(
  process.execPath,
  [
    join(root, "node_modules/typescript/bin/tsc"),
    "--noEmit",
    "-p",
    "tsconfig.json",
  ],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
