import { spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";

const CONFIG = "wrangler.rsvp-time-repair.toml";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
function command(args) {
  const result = spawnSync(npx, ["--yes", "wrangler@4.111.0", ...args], { encoding: "utf8", timeout: 120_000, env: process.env });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) throw new Error("wrangler_" + args[0] + "_failed");
  return result.stdout;
}

async function run() {
  const capability = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(capability).digest("hex");
  let deployed = false;
  try {
    const output = command(["deploy", "--config", CONFIG,
      "--var", "REPAIR_TOKEN_HASH:" + hash, "--var", "REPAIR_EXPIRES_AT:" + (Date.now() + 300_000)]);
    deployed = true;
    const url = output.match(/https:\/\/mishanya-rsvp-repair-19484-20261102\.[a-z0-9-]+\.workers\.dev\b/)?.[0];
    if (!url) throw new Error("temporary_repair_url_not_found");
    let ready = false;
    for (let attempt = 0; attempt < 15; attempt++) {
      try {
        const probe = await fetch(url + "/repair", { signal: AbortSignal.timeout(5000) });
        if (probe.status === 403 && await probe.text() === "Forbidden") { ready = true; break; }
      } catch { /* Only read-only readiness probes are retried. */ }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    if (!ready) throw new Error("temporary_repair_route_not_ready");
    const response = await fetch(url + "/repair", {
      method: "POST", headers: { Authorization: "Bearer " + capability }, signal: AbortSignal.timeout(240_000),
    });
    const result = await response.json();
    if (!response.ok || !["repaired", "already_correct"].includes(result.status)) throw new Error(result.error || "repair_failed");
    console.log(JSON.stringify(result));
  } finally {
    if (deployed) command(["delete", "--config", CONFIG, "--force"]);
  }
}

run().catch((error) => { console.error(error.message); process.exitCode = 1; });
