import { spawn, spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const CONFIG = "wrangler.rsvp-time-repair.toml";
const PREFIX = "RSVP_REPAIR_19484=";

export function tailDecoder(onResult) {
  let buffer = "";
  return (chunk) => {
    buffer += chunk;
    while (true) {
      const start = buffer.indexOf("{");
      if (start < 0) { buffer = ""; return; }
      let depth = 0, quoted = false, escaped = false, end = -1;
      for (let index = start; index < buffer.length; index++) {
        const char = buffer[index];
        if (quoted) {
          if (escaped) escaped = false;
          else if (char === "\\") escaped = true;
          else if (char === '"') quoted = false;
        } else if (char === '"') quoted = true;
        else if (char === "{") depth++;
        else if (char === "}" && --depth === 0) { end = index + 1; break; }
      }
      if (end < 0) { buffer = buffer.slice(start); return; }
      const json = buffer.slice(start, end);
      buffer = buffer.slice(end);
      let event;
      try { event = JSON.parse(json); } catch { continue; }
      for (const log of event.logs || []) {
        for (const message of Array.isArray(log.message) ? log.message : [log.message]) {
          if (typeof message === "string" && message.startsWith(PREFIX)) onResult(JSON.parse(message.slice(PREFIX.length)));
        }
      }
    }
  };
}

async function run() {
  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  const cliArgs = ["--yes", "wrangler@4.111.0"];
  const command = (args) => {
    const result = spawnSync(npx, [...cliArgs, ...args], { encoding: "utf8", timeout: 120_000, env: process.env });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.status !== 0) throw new Error(`wrangler_${args[0]}_failed`);
  };
  let deployed = false;
  let tail;
  try {
    command(["deploy", "--config", CONFIG]);
    deployed = true;
    const result = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("repair_worker_result_timeout")), 300_000);
      const decode = tailDecoder((report) => {
        if (report.status === "waiting") return;
        clearTimeout(timeout);
        if (["repaired", "already_correct"].includes(report.status)) resolve(report);
        else reject(new Error(report.error || "repair_worker_failed"));
      });
      tail = spawn(npx, [...cliArgs, "tail", "--config", CONFIG, "--format", "json"], {
        env: process.env, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"],
      });
      tail.stdout.setEncoding("utf8");
      tail.stdout.on("data", decode);
      tail.stderr.on("data", (data) => process.stderr.write(data));
      tail.on("error", (error) => { clearTimeout(timeout); reject(error); });
      tail.on("exit", (code) => { clearTimeout(timeout); reject(new Error(`repair_tail_exited_${code}`)); });
    });
    console.log(JSON.stringify(result));
  } finally {
    if (tail?.pid) {
      try {
        if (process.platform === "win32") tail.kill();
        else process.kill(-tail.pid, "SIGTERM");
      } catch { /* The tail may already have exited. */ }
    }
    if (deployed) command(["delete", "--config", CONFIG, "--force"]);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
