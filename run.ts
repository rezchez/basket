#!/usr/bin/env bun
import { spawn, execSync, type ChildProcess } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isWin = process.platform === "win32";

console.log("\x1b[1;34m=== Starting Basketball Project (Cross-Platform) ===\x1b[0m");

// 1. Free ports if already in use
function freePort(port: number) {
  try {
    if (isWin) {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" }).trim();
      for (const line of out.split("\n")) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(Number(pid))) {
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
          } catch {}
        }
      }
    } else {
      execSync(`fuser -k ${port}/tcp`, { stdio: "ignore" });
    }
  } catch {}
}

freePort(8088);
freePort(8010);

// 2. Locate PocketBase binary
const backendDir = path.join(__dirname, "backend");
const pbBinaryName = isWin ? "pocketbase.exe" : "pocketbase";
const pbPath = path.join(backendDir, pbBinaryName);

if (!fs.existsSync(pbPath)) {
  console.error(`\x1b[1;31mError: PocketBase binary not found at: ${pbPath}\x1b[0m`);
  process.exit(1);
}

if (!isWin) {
  try {
    fs.chmodSync(pbPath, 0o755);
  } catch {}
}

// 3. Start Backend
console.log("\x1b[0;32m[1/2] Starting PocketBase on port 8088...\x1b[0m");
const pbProc: ChildProcess = spawn(pbPath, ["serve", "--http=127.0.0.1:8088"], {
  cwd: backendDir,
  stdio: "inherit",
  shell: false,
});

// 4. Start Frontend
const frontendDir = path.join(__dirname, "frontend");
console.log("\x1b[0;32m[2/2] Starting Frontend on port 8010 with Bun...\x1b[0m");

const frontendProc: ChildProcess = isWin
  ? spawn("cmd.exe", ["/c", "bun", "run", "dev"], {
      cwd: frontendDir,
      stdio: "inherit",
    })
  : spawn("bun", ["run", "dev"], {
      cwd: frontendDir,
      stdio: "inherit",
    });

console.log("\n\x1b[1;32m=====================================================\x1b[0m");
console.log("\x1b[1;32m  🏀 Both services are now running!                  \x1b[0m");
console.log("\x1b[1;36m  • Frontend:    http://localhost:8010               \x1b[0m");
console.log("\x1b[1;36m  • PocketBase:  http://127.0.0.1:8088               \x1b[0m");
console.log("\x1b[1;36m  • Admin Panel: http://127.0.0.1:8088/_/            \x1b[0m");
console.log("\x1b[1;32m=====================================================\x1b[0m");
console.log("\x1b[0;33mPress Ctrl+C anytime to stop both services.\x1b[0m\n");

// Graceful shutdown handling
let isShuttingDown = false;
function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log("\n\x1b[0;33mShutting down services...\x1b[0m");

  try {
    if (isWin) {
      if (pbProc.pid) execSync(`taskkill /F /T /PID ${pbProc.pid}`, { stdio: "ignore" });
      if (frontendProc.pid) execSync(`taskkill /F /T /PID ${frontendProc.pid}`, { stdio: "ignore" });
    } else {
      if (pbProc.pid) pbProc.kill("SIGTERM");
      if (frontendProc.pid) frontendProc.kill("SIGTERM");
    }
  } catch {}

  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

pbProc.on("exit", (code, signal) => {
  if (!isShuttingDown && code !== 0 && signal !== "SIGTERM" && signal !== "SIGINT") {
    console.error(`\x1b[1;31mPocketBase stopped (code: ${code}, signal: ${signal})\x1b[0m`);
    shutdown();
  }
});

frontendProc.on("exit", (code, signal) => {
  if (!isShuttingDown && code !== 0 && signal !== "SIGTERM" && signal !== "SIGINT") {
    console.error(`\x1b[1;31mFrontend stopped (code: ${code}, signal: ${signal})\x1b[0m`);
    shutdown();
  }
});
