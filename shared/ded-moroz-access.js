const keysByIssuer = new Map();

export function accessIssuer(env) {
  const domain = env.DM_ACCESS_TEAM_DOMAIN?.trim().toLowerCase();
  return domain && /^[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain) ? "https://" + domain : "";
}

function fromBase64Url(text) {
  return Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
}

async function accessKeys(issuer, kid, request, now) {
  const cached = keysByIssuer.get(issuer);
  if (cached?.until > now && cached.keys.some(key => key.kid === kid)) return cached.keys;
  const response = await request(issuer + "/cdn-cgi/access/certs", {
    redirect: "manual",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) return [];
  const { keys } = await response.json();
  if (!Array.isArray(keys)) return [];
  keysByIssuer.set(issuer, { keys, until: now + 300_000 });
  return keys;
}

export async function canAccessOrders(request, env, fetchKeys = fetch, now = Date.now()) {
  const issuer = accessIssuer(env);
  const audience = env.DM_ACCESS_AUD?.trim();
  const token = request.headers.get("Cf-Access-Jwt-Assertion") ?? "";
  if (!issuer || !audience || token.length > 8192 || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) return false;

  try {
    const [header, claims, signature] = token.split(".");
    const read = value => JSON.parse(new TextDecoder().decode(fromBase64Url(value)));
    const { alg, kid } = read(header);
    const { iss, aud, exp, nbf, email } = read(claims);
    if (alg !== "RS256" || typeof kid !== "string" || iss !== issuer ||
      !Array.isArray(aud) || !aud.includes(audience) ||
      !Number.isFinite(exp) || exp <= now / 1000 ||
      (nbf !== undefined && (!Number.isFinite(nbf) || nbf > now / 1000)) ||
      typeof email !== "string" || !email.includes("@")) return false;

    const key = (await accessKeys(issuer, kid, fetchKeys, now)).find(item => item.kid === kid && item.kty === "RSA");
    if (!key) return false;
    const algorithm = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };
    const publicKey = await crypto.subtle.importKey("jwk", key, algorithm, false, ["verify"]);
    return await crypto.subtle.verify(algorithm, publicKey, fromBase64Url(signature), new TextEncoder().encode(header + "." + claims));
  } catch {
    return false;
  }
}
