import {
  addOneYearIso,
  encryptPayload,
  phoneHash,
  readClaimByPhoneHash,
  validateGiftPayload,
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

async function validateTurnstile(token, request, secret) {
  if (!secret || !token) return false;
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
  return result.success === true && (!result.action || result.action === "gift_form");
}

async function enqueueClaim(env, claimId) {
  try {
    await env.GIFT_SYNC_QUEUE.send({ claimId });
    await env.GIFT_DB.prepare(
      "UPDATE gift_claims SET status = 'queued', last_error = NULL, updated_at = ? WHERE id = ?",
    )
      .bind(new Date().toISOString(), claimId)
      .run();
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "queue_send_failed";
    await env.GIFT_DB.prepare(
      "UPDATE gift_claims SET status = 'queue_failed', last_error = ?, updated_at = ? WHERE id = ?",
    )
      .bind(message.slice(0, 1000), new Date().toISOString(), claimId)
      .run();
    return false;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 24_000) return json({ error: "payload_too_large" }, 413);
  if (!env.GIFT_DB || !env.GIFT_DATA_SECRET || !env.GIFT_SYNC_QUEUE || !env.TURNSTILE_SECRET_KEY) {
    return json({ error: "gift_service_not_configured" }, 503);
  }

  let raw;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  const checked = validateGiftPayload(raw);
  if (checked.error) return json({ error: checked.error }, 400);
  const payload = checked.value;

  const turnstileOk = await validateTurnstile(
    payload.turnstileToken,
    request,
    env.TURNSTILE_SECRET_KEY,
  ).catch(() => false);
  if (!turnstileOk) return json({ error: "verification_failed" }, 400);

  const submittedAt = new Date().toISOString();
  const validUntil = addOneYearIso(submittedAt);
  const hash = await phoneHash(payload.phone, env.GIFT_DATA_SECRET);
  const existing = await readClaimByPhoneHash(env.GIFT_DB, hash);
  if (existing && existing.valid_until > submittedAt) {
    if (existing.status !== "synced") {
      const queued = await enqueueClaim(env, existing.id);
      if (!queued) return json({ error: "gift_delivery_unavailable" }, 503);
    }
    return json({
      status: "existing",
      giftCode: existing.gift_code,
      validUntil: existing.valid_until,
    });
  }

  const id = crypto.randomUUID();
  const encryptedPayload = await encryptPayload(payload, env.GIFT_DATA_SECRET);
  if (existing) {
    await env.GIFT_DB.prepare(
      "UPDATE gift_claims SET id = ?, gift_code = ?, source_code = ?, language = ?, payload_ciphertext = ?, submitted_at = ?, valid_until = ?, status = 'pending', bitrix_lead_id = NULL, last_error = NULL, updated_at = ? WHERE phone_hash = ? AND valid_until <= ?",
    )
      .bind(
        id,
        payload.giftCode,
        payload.sourceCode,
        payload.language,
        encryptedPayload,
        submittedAt,
        validUntil,
        submittedAt,
        hash,
        submittedAt,
      )
      .run();
  } else {
    await env.GIFT_DB.prepare(
      "INSERT OR IGNORE INTO gift_claims (id, phone_hash, gift_code, source_code, language, payload_ciphertext, submitted_at, valid_until, status, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)",
    )
      .bind(
        id,
        hash,
        payload.giftCode,
        payload.sourceCode,
        payload.language,
        encryptedPayload,
        submittedAt,
        validUntil,
        submittedAt,
      )
      .run();
  }

  const stored = await readClaimByPhoneHash(env.GIFT_DB, hash);
  if (!stored || stored.id !== id) {
    if (stored && stored.status !== "synced") await enqueueClaim(env, stored.id);
    return json({
      status: "existing",
      giftCode: stored?.gift_code || payload.giftCode,
      validUntil: stored?.valid_until,
    });
  }

  const queued = await enqueueClaim(env, id);
  if (!queued) return json({ error: "gift_delivery_unavailable" }, 503);
  return json({ status: "queued", giftCode: payload.giftCode, validUntil }, 202);
}

export function onRequestGet() {
  return json({ error: "method_not_allowed" }, 405);
}
