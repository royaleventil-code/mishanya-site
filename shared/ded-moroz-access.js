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

export async function orderAccessRole(request, env, fetchKeys = fetch, now = Date.now()) {
  const issuer = accessIssuer(env);
  const audience = env.DM_ACCESS_AUD?.trim();
  const token = request.headers.get("Cf-Access-Jwt-Assertion") ?? "";
  if (!issuer || !audience || token.length > 8192 || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) return null;

  try {
    const [header, claims, signature] = token.split(".");
    const read = value => JSON.parse(new TextDecoder().decode(fromBase64Url(value)));
    const { alg, kid } = read(header);
    const { type, iss, aud, exp, nbf, email, common_name: clientId, sub } = read(claims);
    if (alg !== "RS256" || typeof kid !== "string" || type !== "app" || iss !== issuer ||
      !Array.isArray(aud) || !aud.includes(audience) ||
      !Number.isFinite(exp) || exp <= now / 1000 ||
      (nbf !== undefined && (!Number.isFinite(nbf) || nbf > now / 1000))) return null;

    let role;
    if (clientId !== undefined) {
      if (typeof clientId !== "string" || !clientId || sub !== "" ||
        clientId !== env.DM_ACCESS_SERVICE_CLIENT_ID?.trim()) return null;
      role = "service";
    } else if (typeof email === "string" && email.includes("@")) {
      role = "staff";
    } else {
      return null;
    }

    const key = (await accessKeys(issuer, kid, fetchKeys, now)).find(item => item.kid === kid && item.kty === "RSA");
    if (!key) return null;
    const algorithm = { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" };
    const publicKey = await crypto.subtle.importKey("jwk", key, algorithm, false, ["verify"]);
    const valid = await crypto.subtle.verify(algorithm, publicKey, fromBase64Url(signature), new TextEncoder().encode(header + "." + claims));
    return valid ? role : null;
  } catch {
    return null;
  }
}
