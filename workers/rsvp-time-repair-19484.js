import { repairRsvpTime19484 } from "../scripts/repair-rsvp-time-19484.mjs";

// One fixed repair operation, protected by a random capability held only by its
// CI process. The deployment receives only its hash and a five-minute expiry.
// The temporary worker is deleted immediately after the verified operation.
const repairWorker = {
  async fetch(request, env) {
    const expiresAt = Number(env.REPAIR_EXPIRES_AT);
    const expectedHash = String(env.REPAIR_TOKEN_HASH || "");
    const supplied = request.headers.get("Authorization")?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
    if (request.method !== "POST" || new URL(request.url).pathname !== "/repair"
      || !supplied || !Number.isFinite(expiresAt) || Date.now() >= expiresAt || !/^[a-f0-9]{64}$/.test(expectedHash)) {
      return new Response("Forbidden", { status: 403 });
    }
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(supplied));
    const actualHash = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    let difference = 0;
    for (let index = 0; index < expectedHash.length; index++) difference |= expectedHash.charCodeAt(index) ^ actualHash.charCodeAt(index);
    if (difference !== 0) return new Response("Forbidden", { status: 403 });
    try {
      const result = await repairRsvpTime19484({
        token: "bound-database-runtime",
        apply: true,
        fetcher: async (url, init) => {
          if (String(url).startsWith("https://api.cloudflare.com/client/v4/accounts/")) {
            const { sql, params } = JSON.parse(init.body);
            const result = await env.GIFT_DB.prepare(sql).bind(...params).all();
            return Response.json({ success: result.success !== false, result: [result] });
          }
          return fetch(url, init);
        },
      });
      return Response.json(result);
    } catch (error) {
      return Response.json({ status: "failed", error: error instanceof Error ? error.message : "repair_failed" }, { status: 500 });
    }
  },
};

export default repairWorker;
