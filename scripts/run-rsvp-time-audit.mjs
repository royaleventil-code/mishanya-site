import { spawnSync } from "node:child_process";
import { createCipheriv, createHash, createPublicKey, publicEncrypt, randomBytes, constants } from "node:crypto";

const config = "wrangler.rsvp-time-audit.toml";
function command(args) {
  const result = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["--yes", "wrangler@4.111.0", ...args], {
    encoding: "utf8", timeout: 120_000, env: process.env,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) throw new Error("wrangler_" + args[0] + "_failed");
  return result.stdout;
}

async function run() {
  const publicKey = createPublicKey(process.env.RSVP_RECIPIENT_KEY || "");
  const capability = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(capability).digest("hex");
  let deployed = false;
  try {
    const output = command(["deploy", "--config", config, "--var", "REPAIR_TOKEN_HASH:" + hash,
      "--var", "REPAIR_EXPIRES_AT:" + (Date.now() + 600_000)]);
    deployed = true;
    const url = output.match(/https:\/\/mishanya-rsvp-time-audit-20261102\.[a-z0-9-]+\.workers\.dev\b/)?.[0];
    if (!url) throw new Error("audit_url_not_found");
    let ready = false;
    for (let attempt = 0; attempt < 15; attempt++) {
      try { const r = await fetch(url + "/audit", { signal: AbortSignal.timeout(5000) }); if (r.status === 403 && await r.text() === "Forbidden") { ready = true; break; } }
      catch { /* Only read-only readiness probes are retried. */ }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    if (!ready) throw new Error("audit_route_not_ready");
    async function call(path, body) {
      const response = await fetch(url + path, {
        method: "POST", headers: { Authorization: "Bearer " + capability, "Content-Type": "application/json" },
        body: JSON.stringify(body), signal: AbortSignal.timeout(60_000),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error("audit_operation_failed");
      return data;
    }
    const asOf = new Date().toISOString();
    const events = [];
    let after = "";
    let report;
    if (process.env.RSVP_OPERATION === "repair") {
      const plan = JSON.parse(process.env.RSVP_REPAIRS_JSON || "[]");
      if (!Array.isArray(plan) || plan.length < 1 || plan.length > 100) throw new Error("invalid_repair_plan");
      const baselines = [];
      for (let index = 0; index < plan.length; index += 5) baselines.push(...(await call("/enqueue", { plan: plan.slice(index, index + 5), offset: index })).baselines);
      let verified = [];
      for (let attempt = 0; attempt < 48; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        verified = [];
        for (let index = 0; index < baselines.length; index += 5) verified.push(...(await call("/verify", { baselines: baselines.slice(index, index + 5) })).results);
        if (verified.every((item) => item.status === "verified")) break;
      }
      if (!verified.every((item) => item.status === "verified")) throw new Error("repairs_not_fully_verified");
      report = { asOf, operation: "repair", repairs: verified };
    } else {
      for (let page = 0; page < 1000; page++) {
      const response = await fetch(url + "/audit", {
        method: "POST", headers: { Authorization: "Bearer " + capability, "Content-Type": "application/json" },
        body: JSON.stringify({ asOf, after }), signal: AbortSignal.timeout(60_000),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error("audit_page_failed");
      events.push(...data.events);
      if (!data.next) break;
      if (data.next === after || page === 999) throw new Error("audit_pagination_failed");
        after = data.next;
      }
      report = { asOf, operation: "audit", events };
    }
    const key = randomBytes(32), iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(report), "utf8"), cipher.final()]).toString("base64");
    const wrappedKey = publicEncrypt({ key: publicKey, oaepHash: "sha256", padding: constants.RSA_PKCS1_OAEP_PADDING }, key).toString("base64");
    const parts = Math.ceil(encrypted.length / 8000);
    console.log("RSVP_AUDIT_ENVELOPE=" + JSON.stringify({ wrappedKey, iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), parts }));
    for (let index = 0; index < parts; index++) console.log("RSVP_AUDIT_PART=" + JSON.stringify({ index, data: encrypted.slice(index * 8000, (index + 1) * 8000) }));
  } finally {
    if (deployed) command(["delete", "--config", config, "--force"]);
  }
}

run().catch(() => { console.error("audit_run_failed"); process.exitCode = 1; });
