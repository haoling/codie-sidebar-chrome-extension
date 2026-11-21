// Codie 1.6.0 LAN API(チャット関連)のモック。署名検証は GUIDE.ja.md §4 の仕様どおりに独立実装している。
import http from "node:http";
import crypto from "node:crypto";
import { WebSocketServer } from "ws";

export function startMock(port) {
  const SECRET = "s3cr3t-local-secret", SESSION = "sess-1", USER = "user-1", CODE = "123456";
  const nonces = new Set();
  const state = { log: [], origins: [], history: [], turns: new Map(), seq: 0, slot: 1, requests: [], wsClients: new Set(), subscribed: [], cleared: 0, busy: false };

  function verify(method, path, headers, body, query) {
    const get = query ? (k) => query.get(k) : (_k, h) => headers[h.toLowerCase()];
    const sig = get("sig", "X-Local-Sig"), ts = get("timestamp", "X-Local-Timestamp"), nonce = get("nonce", "X-Local-Nonce");
    const mode = get("payload_mode", "X-Local-Payload-Mode"), bh = get("body_hash", "X-Local-Body-Hash"), uid = get("user_id", "X-Local-User-Id");
    const sid = get("session_id", "X-Local-Session-Id");
    if (!sig) return "NO_SIG";
    if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return "REQUEST_EXPIRED";
    if (nonces.has(nonce)) return "NONCE_REUSED";
    if (uid !== USER) return "LOCAL_USER_MISMATCH";
    if (sid !== SESSION) return "LOCAL_SESSION_MISMATCH";
    const isMultipart = /^multipart\/form-data/.test(headers?.["content-type"] || "");
    const expectMode = isMultipart ? "multipart" : body.length ? "json" : "empty";
    const expectHash = isMultipart ? "UNSIGNED-PAYLOAD" : crypto.createHash("sha256").update(body).digest("hex");
    if (mode !== expectMode) return "BAD_MODE";
    if (bh !== expectHash) return "BODY_HASH_MISMATCH";
    const canonical = [method, decodeURIComponent(path), ts, nonce, mode, bh, uid].join("|");
    if (crypto.createHmac("sha256", SECRET).update(canonical).digest("hex") !== sig) return "INVALID_SIGNATURE";
    nonces.add(nonce);
    return null;
  }
  const send = (res, status, obj) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };

  function addHistory(role, content, turn_id, content_type = "text") {
    const it = { chat_id: "c" + ++state.seq, seq: state.seq, role, content, content_type, turn_id, slot_number: state.slot, created_at: new Date().toISOString() };
    state.history.push(it);
    return it.chat_id;
  }
  const broadcast = (type) => { for (const ws of state.wsClients) if (state.subscribed.includes(type)) ws.send(JSON.stringify({ type, data: { event: "changed" } })); };

  // multipart から request(JSON)と image のバイト数を取り出す(簡易)
  function parseMultipart(body, ct) {
    const b = ct.match(/boundary=(.+)$/)[1];
    const parts = body.toString("latin1").split("--" + b).slice(1, -1);
    const out = {};
    for (const p of parts) {
      const name = p.match(/name="([^"]+)"/)[1];
      const content = p.slice(p.indexOf("\r\n\r\n") + 4, -2);
      out[name] = name === "request" ? Buffer.from(content, "latin1").toString("utf8") : content.length;
    }
    return out;
  }

  const server = http.createServer(async (req, res) => {
    const chunks = []; for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks);
    const url = new URL(req.url, "http://x");
    const path = url.pathname;
    state.origins.push(req.headers.origin || null);
    state.log.push(`${req.method} ${path}`);
    // 実機と同様、Origin 付きのペアリング要求は拒否する
    if (path.startsWith("/v1/api/auth/pair/") && req.headers.origin) return send(res, 403, { code: "PAIRING_SOURCE_NOT_ALLOWED", message: "Pairing request source not allowed" });
    if (path === "/v1/api/auth/bootstrap") return send(res, 200, { success: true, data: { user_id: USER } });
    if (path === "/v1/api/auth/pair/request") return send(res, 200, { success: true, data: { challenge_id: "chal-1" } });
    if (path === "/v1/api/auth/pair/confirm") {
      const j = JSON.parse(body.toString());
      if (j.challenge_id !== "chal-1" || j.pairing_code !== CODE) return send(res, 403, { code: "PAIRING_CODE_INVALID" });
      return send(res, 200, { success: true, data: { local_secret: SECRET, local_session_id: SESSION, local_session_expires_at_ms: Date.now() + 12 * 3600e3, auth_scope: j.auth_scope } });
    }
    if (path.startsWith("/v1/api/auth/")) return send(res, 200, { success: true });
    const err = verify(req.method, path, req.headers, body, null);
    if (err) return send(res, 401, { code: err });
    const rel = path.replace("/v1/api", "");

    if (rel === "/data/user/slot") return send(res, 200, { success: true, data: { slot_number: state.slot, selected_cloth: 1 } });
    if (rel === "/data/user/chat/history" && req.method === "GET") {
      if (Number(url.searchParams.get("slot")) !== state.slot) return send(res, 409, { code: "SLOT_MISMATCH" });
      const limit = Number(url.searchParams.get("limit") || 50);
      const cur = url.searchParams.get("cursor");
      const end = cur ? Number(cur) : state.history.length;
      const start = Math.max(0, end - limit);
      return send(res, 200, { success: true, data: { items: state.history.slice(start, end), has_more: start > 0, next_cursor: start > 0 ? String(start) : "" } });
    }
    if (rel === "/data/user/chat/history" && req.method === "DELETE") { state.history = []; state.cleared++; return send(res, 200, { success: true }); }
    if (rel === "/data/user/chat/turns" && req.method === "POST") {
      const ct = req.headers["content-type"] || "";
      let r, image = null;
      if (ct.startsWith("multipart/")) { const m = parseMultipart(body, ct); r = JSON.parse(m.request); image = m.image; }
      else r = JSON.parse(body.toString());
      state.requests.push({ ...r, image_bytes: image });
      if (r.slot !== state.slot) return send(res, 409, { code: "SLOT_MISMATCH" });
      const id = "t" + ++state.seq;
      const text = r.input.text || "";
      const turn = { turn_id: id, state: "queued", polls: 0, text, image: !!image, assistant_text: "", error: null, speech: r.output.speech };
      state.turns.set(id, turn);
      if (state.busy) { turn.state = "failed"; turn.error = { code: "DEVICE_BUSY", message: "busy", retryable: true }; }
      else addHistory("user", image ? (text || "") : text, id, image ? "image_text" : "text");
      return send(res, 202, { success: true, data: { turn_id: id, state: turn.state } });
    }
    let m = rel.match(/^\/data\/user\/chat\/turns\/(\w+)(\/cancel)?$/);
    if (m) {
      const t = state.turns.get(m[1]);
      if (!t) return send(res, 404, { code: "TURN_NOT_FOUND" });
      if (m[2]) { t.state = "cancelled"; return send(res, 202, { success: true, data: t }); }
      if (!["failed", "cancelled", "completed"].includes(t.state)) {
        t.polls++;
        t.state = t.polls === 1 ? "thinking" : t.polls === 2 ? "responding" : "completed";
        if (t.state === "responding") t.assistant_text = `「${t.text || "(画像)"}」を受け取りました` + (t.image ? "(画面つき)" : "");
        if (t.state === "completed") { addHistory("assistant", t.assistant_text, t.turn_id); broadcast("chat_history"); }
      }
      return send(res, 200, { success: true, data: { turn_id: t.turn_id, state: t.state, assistant_text: t.assistant_text, error: t.error } });
    }
    send(res, 404, { code: "NOT_FOUND", path: rel });
  });

  const wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url, "http://x");
    state.origins.push(req.headers.origin || null);
    const err = url.pathname === "/v1/ws/events" ? verify("GET", url.pathname, null, Buffer.alloc(0), url.searchParams) : "BAD_PATH";
    if (err) { socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n"); socket.destroy(); state.log.push("WS rejected " + err); return; }
    wss.handleUpgrade(req, socket, head, (ws) => {
      state.wsClients.add(ws);
      ws.on("close", () => state.wsClients.delete(ws));
      ws.send(JSON.stringify({ type: "ready", data: { protocol_version: "v1" } }));
      ws.on("message", (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "subscribe") { state.subscribed = msg.data.events; ws.send(JSON.stringify({ type: "result", request_id: msg.request_id, data: { ok: true } })); }
      });
    });
  });

  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve({ state, addHistory, broadcast, close: () => { wss.close(); server.closeAllConnections(); server.close(); }, CODE })));
}
