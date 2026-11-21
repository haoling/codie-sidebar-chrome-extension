// Codie 1.6.0 LAN API のクライアント。HMAC-SHA256 署名は WebCrypto で計算する。
import { t } from "./i18n.js";
const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

export class APIError extends Error {
  constructor(status, payload) {
    super(`HTTP ${status}: ${typeof payload === "string" ? payload : JSON.stringify(payload)}`);
    this.status = status;
    this.payload = payload;
  }
}

export async function sha256Hex(bytes) {
  return hex(await crypto.subtle.digest("SHA-256", bytes));
}

export async function hmacHex(secret, message) {
  // 鍵は local_secret 文字列の UTF-8 バイトそのもの(16進デコードはしない)
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

/** "http://192.168.0.39:8081" の形に正規化。パス・クエリは不可。 */
export function normalizeDeviceUrl(input) {
  const url = new URL(input.trim());
  if (!["http:", "https:"].includes(url.protocol) || (url.pathname !== "/" && url.pathname !== "") || url.search || url.hash) {
    throw new Error(t("badUrl"));
  }
  return url.origin;
}

export async function signHeaders(creds, method, path, bodyBytes = new Uint8Array(), mode = "empty") {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = crypto.randomUUID();
  const userId = creds.user_id || "";
  // multipart は本文ハッシュを固定文字列にする(GUIDE §4)
  const bodyHash = mode === "multipart" ? "UNSIGNED-PAYLOAD" : await sha256Hex(bodyBytes);
  const canonical = [method.toUpperCase(), decodeURIComponent(path.split("?")[0]), timestamp, nonce, mode, bodyHash, userId].join("|");
  const headers = {
    "X-Local-Sig": await hmacHex(creds.local_secret, canonical),
    "X-Local-Timestamp": timestamp,
    "X-Local-Nonce": nonce,
    "X-Local-Payload-Mode": mode,
    "X-Local-Body-Hash": bodyHash,
    "X-Local-User-Id": userId,
  };
  if (creds.local_session_id) headers["X-Local-Session-Id"] = creds.local_session_id;
  return headers;
}

export class CodieAPI {
  constructor(baseUrl, creds = null) {
    this.baseUrl = normalizeDeviceUrl(baseUrl);
    this.creds = creds;
  }

  /** payload が FormData のときは multipart として送る(Content-Type は fetch に任せる) */
  async request(method, path, payload, { pub = false, timeout = 15000 } = {}) {
    const multipart = typeof FormData !== "undefined" && payload instanceof FormData;
    const body = payload === undefined ? new Uint8Array() : multipart ? payload : enc.encode(JSON.stringify(payload));
    const mode = payload === undefined ? "empty" : multipart ? "multipart" : "json";
    const headers = pub ? {} : await signHeaders(this.creds, method, path, multipart ? new Uint8Array() : body, mode);
    if (payload !== undefined && !multipart) headers["Content-Type"] = "application/json";
    const res = await fetch(this.baseUrl + path, {
      method: method.toUpperCase(),
      headers,
      body: payload === undefined ? undefined : body,
      signal: AbortSignal.timeout(timeout),
    });
    const raw = await res.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = raw; }
    if (!res.ok) throw new APIError(res.status, data);
    return data;
  }

  async websocketUrl(path) {
    const h = await signHeaders(this.creds, "GET", path);
    const fields = { sig: "X-Local-Sig", timestamp: "X-Local-Timestamp", nonce: "X-Local-Nonce", payload_mode: "X-Local-Payload-Mode", body_hash: "X-Local-Body-Hash", user_id: "X-Local-User-Id", session_id: "X-Local-Session-Id" };
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(fields)) if (h[v]) q.set(k, h[v]);
    return this.baseUrl.replace(/^http/, "ws") + path + "?" + q.toString();
  }

  /** ペアリング要求。端末にコードが表示される。 */
  async pairRequest() {
    const bootstrap = (await this.request("GET", "/v1/api/auth/bootstrap", undefined, { pub: true })).data;
    const challenge = (await this.request("POST", "/v1/api/auth/pair/request", undefined, { pub: true })).data;
    return { challenge_id: challenge.challenge_id, user_id: bootstrap.user_id || "" };
  }

  async pairConfirm(challengeId, code, userId, scope) {
    const r = (await this.request("POST", "/v1/api/auth/pair/confirm", { challenge_id: challengeId, pairing_code: code, auth_scope: scope }, { pub: true })).data;
    const creds = { user_id: userId };
    for (const k of ["local_secret", "local_session_id", "local_session_expires_at_ms", "auth_scope"]) if (k in r) creds[k] = r[k];
    this.creds = creds;
    return creds;
  }
}
