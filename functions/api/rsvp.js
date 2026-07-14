import {
  createOpaqueToken,
  sanitizeManageToken,
  sanitizeRsvpSlug,
  validateRsvpEventPayload,
  validateRsvpResponsePayload,
} from "../../shared/rsvp-core.js";
import {
  decryptPayload,
  encryptPayload,
  phoneHash,
} from "../../shared/gift-core.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function dataSecret(env) {
  return String(env.RSVP_DATA_SECRET || env.GIFT_DATA_SECRET || "").trim();
}

async function validateTurnstile(token, request, secret, expectedAction) {
  if (!secret) return true;
  if (!token) return false;
  const body = new URLSearchParams({
    secret,
    response: token,
    remoteip: request.headers.get("CF-Connecting-IP") || "",
  });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true && (!result.action || result.action === expectedAction);
}

async function withinRateLimit(env, request, secret) {
  const ip = request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "";
  if (!ip) return true;
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / 3_600_000) * 3_600_000).toISOString();
  const key = await phoneHash(`rsvp-ip:${ip.split(",")[0].trim()}`, secret);
  await env.GIFT_DB.prepare(
    "INSERT INTO rsvp_rate_limits (rate_key, window_start, attempts) VALUES (?, ?, 1) ON CONFLICT(rate_key, window_start) DO UPDATE SET attempts = attempts + 1",
  ).bind(key, windowStart).run();
  const row = await env.GIFT_DB.prepare(
    "SELECT attempts FROM rsvp_rate_limits WHERE rate_key = ? AND window_start = ?",
  ).bind(key, windowStart).first();
  return Number(row?.attempts || 0) <= 30;
}

function publicEvent(payload, slug) {
  const { organizerPhone, ...safe } = payload;
  return {
    ...safe,
    slug,
    contactPhone: payload.contactEnabled ? organizerPhone : undefined,
  };
}

async function createEvent(env, request, raw, secret) {
  const checked = validateRsvpEventPayload(raw);
  if (checked.error) return json({ error: checked.error }, 400);
  const verified = await validateTurnstile(
    raw.turnstileToken,
    request,
    env.TURNSTILE_SECRET_KEY,
    "rsvp_create",
  ).catch(() => false);
  if (!verified) return json({ error: "verification_failed" }, 400);

  const id = crypto.randomUUID();
  const slug = createOpaqueToken(9);
  const manageToken = createOpaqueToken(32);
  const manageHash = await phoneHash(`rsvp-manage:${manageToken}`, secret);
  const encrypted = await encryptPayload(checked.value, secret);
  const createdAt = new Date().toISOString();
  await env.GIFT_DB.prepare(
    "INSERT INTO rsvp_events (id, public_slug, manage_token_hash, payload_ciphertext, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'open', ?, ?)",
  ).bind(id, slug, manageHash, encrypted, createdAt, createdAt).run();
  return json({ slug, manageToken }, 201);
}

async function saveResponse(env, request, raw, secret) {
  const checked = validateRsvpResponsePayload(raw);
  if (checked.error) return json({ error: checked.error }, 400);
  const verified = await validateTurnstile(
    raw.turnstileToken,
    request,
    env.TURNSTILE_SECRET_KEY,
    "rsvp_response",
  ).catch(() => false);
  if (!verified) return json({ error: "verification_failed" }, 400);

  const event = await env.GIFT_DB.prepare(
    "SELECT id, status FROM rsvp_events WHERE public_slug = ? LIMIT 1",
  ).bind(checked.value.eventSlug).first();
  if (!event || event.status !== "open") return json({ error: "event_not_found" }, 404);

  const now = new Date().toISOString();
  const scopedResponseHash = await phoneHash(
    `rsvp-response:${event.id}:${checked.value.respondentKey}`,
    secret,
  );
  const encrypted = await encryptPayload(
    {
      respondentName: checked.value.respondentName,
      comment: checked.value.comment,
    },
    secret,
  );
  await env.GIFT_DB.prepare(
    `INSERT INTO rsvp_responses (id, event_id, phone_hash, status, adults, children, payload_ciphertext, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(event_id, phone_hash) DO UPDATE SET
       status = excluded.status,
       adults = excluded.adults,
       children = excluded.children,
       payload_ciphertext = excluded.payload_ciphertext,
       updated_at = excluded.updated_at`,
  ).bind(
    crypto.randomUUID(),
    event.id,
    scopedResponseHash,
    checked.value.status,
    checked.value.adults,
    checked.value.children,
    encrypted,
    now,
    now,
  ).run();
  return json({ status: "saved" });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const secret = dataSecret(env);
  if (!env.GIFT_DB || !secret) return json({ error: "rsvp_service_not_configured" }, 503);
  if (Number(request.headers.get("content-length") || 0) > 24_000) {
    return json({ error: "payload_too_large" }, 413);
  }
  let raw;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (String(raw?.website || "").trim()) return json({ error: "invalid_submission" }, 400);
  const allowed = await withinRateLimit(env, request, secret).catch(() => false);
  if (!allowed) return json({ error: "rate_limited" }, 429);
  if (raw.action === "create") return createEvent(env, request, raw, secret);
  if (raw.action === "respond") return saveResponse(env, request, raw, secret);
  return json({ error: "invalid_action" }, 400);
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const secret = dataSecret(env);
  if (!env.GIFT_DB || !secret) return json({ error: "rsvp_service_not_configured" }, 503);
  const url = new URL(request.url);
  const slug = sanitizeRsvpSlug(url.searchParams.get("event"));
  if (slug) {
    const row = await env.GIFT_DB.prepare(
      "SELECT public_slug, payload_ciphertext, status FROM rsvp_events WHERE public_slug = ? LIMIT 1",
    ).bind(slug).first();
    if (!row || row.status !== "open") return json({ error: "event_not_found" }, 404);
    const payload = await decryptPayload(row.payload_ciphertext, secret);
    return json(publicEvent(payload, row.public_slug));
  }

  if (url.searchParams.get("manage") === "1") {
    const authorization = request.headers.get("Authorization") || "";
    const token = sanitizeManageToken(authorization.replace(/^Bearer\s+/i, ""));
    if (!token) return json({ error: "unauthorized" }, 401);
    const tokenHash = await phoneHash(`rsvp-manage:${token}`, secret);
    const event = await env.GIFT_DB.prepare(
      "SELECT id, public_slug, payload_ciphertext, status FROM rsvp_events WHERE manage_token_hash = ? LIMIT 1",
    ).bind(tokenHash).first();
    if (!event) return json({ error: "event_not_found" }, 404);
    const payload = await decryptPayload(event.payload_ciphertext, secret);
    const rows = await env.GIFT_DB.prepare(
      "SELECT id, status, adults, children, payload_ciphertext, updated_at FROM rsvp_responses WHERE event_id = ? ORDER BY updated_at DESC",
    ).bind(event.id).all();
    const responses = await Promise.all((rows.results || []).map(async (row) => {
      const privatePayload = await decryptPayload(row.payload_ciphertext, secret);
      return {
        id: row.id,
        status: row.status,
        adults: Number(row.adults),
        children: Number(row.children),
        respondentName: privatePayload.respondentName,
        comment: privatePayload.comment,
        updatedAt: row.updated_at,
      };
    }));
    return json({ event: publicEvent(payload, event.public_slug), responses });
  }

  return json({ error: "invalid_request" }, 400);
}
