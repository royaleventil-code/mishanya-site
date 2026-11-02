import { normalizeBitrixRsvpStartsAt } from "../shared/rsvp-bitrix-time.js";

async function digest(value) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value)));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function snapshot(env, dealId) {
  if (!/^\d+$/.test(String(dealId))) throw new Error("invalid_deal_id");
  const row = await env.GIFT_DB.prepare(`SELECT e.*, m.status AS message_status, m.attempts AS message_attempts
    FROM rsvp_events e LEFT JOIN rsvp_client_messages m ON m.deal_id = e.source_id AND m.message_kind = 'rsvp_client_invitation'
    WHERE e.source_type = 'bitrix_deal' AND e.source_id = ? AND e.status = 'open' LIMIT 1`).bind(String(dealId)).first();
  if (!row) throw new Error("invitation_not_found");
  const response = await fetch("https://mishanya-show.com/api/rsvp?event=" + encodeURIComponent(row.public_slug), { cache: "no-store" });
  if (!response.ok) throw new Error("invitation_read_failed");
  const publicData = await response.json();
  if (publicData.slug !== row.public_slug) throw new Error("invitation_link_changed");
  const { startsAt, ...rest } = publicData;
  const replies = await env.GIFT_DB.prepare("SELECT * FROM rsvp_responses WHERE event_id = ? ORDER BY id").bind(row.id).all();
  return {
    dealId: String(dealId), eventId: row.id, slug: row.public_slug, startsAt,
    slugDigest: await digest(row.public_slug), payloadDigest: await digest(row.payload_ciphertext),
    privateTokenDigest: await digest(JSON.stringify([row.manage_token_hash, row.manage_token_ciphertext])),
    publicDataDigest: await digest(JSON.stringify(rest)),
    messageStatus: row.message_status, messageAttempts: row.message_attempts,
    responses: await Promise.all((replies.results || []).map(async (reply) => ({ id: reply.id, digest: await digest(JSON.stringify(reply)) }))),
  };
}

export async function enqueueTimeRepairs(env, input) {
  if (!Array.isArray(input.plan) || input.plan.length < 1 || input.plan.length > 5) throw new Error("invalid_plan_size");
  const delayOffset = Number(input.offset || 0);
  if (!Number.isInteger(delayOffset) || delayOffset < 0 || delayOffset > 100) throw new Error("invalid_delay");
  const pending = await Promise.all(input.plan.map(async (item) => {
    const from = normalizeBitrixRsvpStartsAt(item.fromStartsAt), to = normalizeBitrixRsvpStartsAt(item.toStartsAt);
    if (from.error || to.error || !/^[a-f0-9]{64}$/.test(String(item.slugDigest))) throw new Error("invalid_repair_plan");
    const current = await snapshot(env, item.dealId);
    if (current.slugDigest !== item.slugDigest) throw new Error("repair_invitation_changed");
    if (current.startsAt !== from.value && current.startsAt !== to.value) throw new Error("repair_current_time_changed");
    return { ...current, fromStartsAt: from.value, toStartsAt: to.value };
  }));
  for (let index = 0; index < pending.length; index++) {
    const current = pending[index];
    if (current.startsAt === current.toStartsAt) continue;
    await env.GIFT_SYNC_QUEUE.send({ type: "rsvp_repair_event_time", dealId: current.dealId,
      slugDigest: current.slugDigest, payloadDigest: current.payloadDigest,
      fromStartsAt: current.fromStartsAt, toStartsAt: current.toStartsAt }, { delaySeconds: (delayOffset + index) * 3 });
  }
  return { baselines: pending };
}

export async function verifyTimeRepairs(env, input) {
  if (!Array.isArray(input.baselines) || input.baselines.length < 1 || input.baselines.length > 5) throw new Error("invalid_verify_size");
  const results = await Promise.all(input.baselines.map(async (before) => {
    const current = await snapshot(env, before.dealId);
    for (const field of ["eventId", "slug", "slugDigest", "privateTokenDigest", "publicDataDigest", "messageStatus", "messageAttempts"]) {
      if (current[field] !== before[field]) throw new Error("repair_changed_" + field);
    }
    const answers = new Map(current.responses.map((item) => [item.id, item.digest]));
    if (!before.responses.every((item) => answers.get(item.id) === item.digest)) throw new Error("guest_response_changed_during_repair");
    return { dealId: current.dealId, slug: current.slug, startsAt: current.startsAt, target: before.toStartsAt,
      status: current.startsAt === before.toStartsAt ? "verified" : "pending",
      responseCount: current.responses.length, linksPreserved: true, answersPreserved: true, clientMessageUnchanged: true };
  }));
  return { results };
}

export async function auditPage(env, input) {
  const asOf = new Date(input.asOf).toISOString();
  const after = String(input.after || "");
  if (!/^[a-zA-Z0-9_-]{0,80}$/.test(after)) throw new Error("invalid_cursor");
  const rows = await env.GIFT_DB.prepare(`SELECT e.id, e.public_slug, e.source_type, e.source_id,
    e.created_at, e.updated_at, e.payload_ciphertext, e.manage_token_hash, e.manage_token_ciphertext,
    e.source_payload_hash, m.status AS message_status,
    (SELECT COUNT(*) FROM rsvp_responses r WHERE r.event_id = e.id) AS response_count
    FROM rsvp_events e
    LEFT JOIN rsvp_client_messages m ON m.deal_id = e.source_id AND m.message_kind = 'rsvp_client_invitation'
    WHERE e.status = 'open' AND e.created_at <= ? AND e.id > ?
    ORDER BY e.id LIMIT 11`).bind(asOf, after).all();
  const selected = (rows.results || []).slice(0, 10);
  const events = await Promise.all(selected.map(async (row) => {
    let publicData = {};
    let error;
    try {
      const response = await fetch("https://mishanya-show.com/api/rsvp?event=" + encodeURIComponent(row.public_slug), { cache: "no-store" });
      if (!response.ok) throw new Error("public_http_" + response.status);
      publicData = await response.json();
      if (publicData.slug !== row.public_slug) throw new Error("public_slug_mismatch");
    } catch (cause) { error = cause instanceof Error ? cause.message : "public_read_failed"; }
    return {
      eventId: row.id, slug: row.public_slug, sourceType: row.source_type, dealId: row.source_id,
      startsAt: publicData.startsAt, childName: publicData.childName,
      responseCount: row.response_count, messageStatus: row.message_status,
      payloadDigest: await digest(row.payload_ciphertext),
      privateTokenDigest: await digest(JSON.stringify([row.manage_token_hash, row.manage_token_ciphertext])),
      sourcePayloadHash: row.source_payload_hash, updatedAt: row.updated_at, error,
    };
  }));
  return { asOf, events, next: (rows.results || []).length > 10 ? selected.at(-1).id : null };
}

const worker = {
  async fetch(request, env) {
    const expires = Number(env.REPAIR_EXPIRES_AT);
    const supplied = request.headers.get("Authorization")?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
    const path = new URL(request.url).pathname;
    if (request.method !== "POST" || !["/audit", "/enqueue", "/verify"].includes(path)
      || !supplied || !Number.isFinite(expires) || Date.now() >= expires
      || !/^[a-f0-9]{64}$/.test(String(env.REPAIR_TOKEN_HASH || ""))) return new Response("Forbidden", { status: 403 });
    const hash = await digest(supplied);
    let difference = 0;
    for (let index = 0; index < hash.length; index++) difference |= hash.charCodeAt(index) ^ env.REPAIR_TOKEN_HASH.charCodeAt(index);
    if (difference) return new Response("Forbidden", { status: 403 });
    try {
      const input = await request.json();
      return Response.json(path === "/enqueue" ? await enqueueTimeRepairs(env, input)
        : path === "/verify" ? await verifyTimeRepairs(env, input) : await auditPage(env, input));
    }
    catch { return Response.json({ error: "audit_failed" }, { status: 500 }); }
  },
};

export default worker;
