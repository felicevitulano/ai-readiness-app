import { execSync, spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
process.chdir(__dirname);

// Ensure node is in PATH
const nodePath = process.execPath;
const nodeDir = dirname(nodePath);
process.env.PATH = `${nodeDir}:${process.env.PATH || ""}`;

const port = process.env.PORT || "3000";
const child = spawn(nodePath, ["node_modules/next/dist/bin/next", "dev", "-p", port], {
  cwd: __dirname,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code || 0));
