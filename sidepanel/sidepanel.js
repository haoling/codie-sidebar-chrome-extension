import { CodieAPI, APIError, normalizeDeviceUrl } from "../src/codie.js";

const $ = (id) => document.getElementById(id);
const P = "/v1/api";
const MAX_IMAGE = 1024 * 1024 - 4096; // 画像は最大 1 MiB
const STATE_TEXT = { queued: "待機中…", starting: "開始中…", receiving_input: "入力中…", thinking: "考え中…", responding: "返答中(端末で再生)…", cancelling: "中止中…" };
const TERMINAL = new Set(["completed", "failed", "cancelled"]);

const st = {
  api: null, cfg: {}, slot: null,
  items: [], nextCursor: null, hasMore: false,
  turn: null,        // 進行中ターン { id, text, hasImage, assistant }
  attach: null,      // { blob, w, h }
  ws: null, wsTimer: null, refreshTimer: null,
};

const store = {
  get: async () => chrome.storage.local.get({ deviceUrl: "", creds: null, scope: "session", clearOnNew: false, showOlder: false, boundaries: {}, pairing: null }),
  set: (o) => chrome.storage.local.set(o),
};

function show(view) {
  for (const id of ["setup", "settings", "chat"]) $(id).hidden = id !== view;
  $("newTopic").hidden = view !== "chat";
  $("settingsBtn").hidden = view === "setup";
}
function setStatus(text, cls = "") { $("status").textContent = text; $("status").className = "status " + cls; }
function showError(msg) { $("error").textContent = msg || ""; }
const errText = (e) => {
  if (e instanceof APIError) {
    const p = e.payload || {};
    const code = p.code || p.error?.code || "";
    const msg = p.message || p.error?.message || "";
    return `${code || "HTTP " + e.status}${msg ? ": " + msg : ""}`;
  }
  return e?.message || String(e);
};
const errCode = (e) => (e instanceof APIError ? e.payload?.code || e.payload?.error?.code || "" : "");

// ---------- 履歴 ----------
const itemMs = (it) => Date.parse(it.created_at) || 0;
function visibleItems() {
  const b = st.cfg.boundaries?.[st.slot] || 0;
  return st.cfg.showOlder ? st.items : st.items.filter((it) => itemMs(it) >= b);
}
function bubble(role, text, extra = "") {
  const d = document.createElement("div");
  d.className = `msg ${role} ${extra}`;
  d.textContent = text;
  return d;
}
function render() {
  const log = $("log");
  const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
  log.replaceChildren();
  if (st.hasMore) {
    const more = document.createElement("button");
    more.className = "more ghost"; more.textContent = "さらに古い履歴を読み込む";
    more.onclick = () => loadHistory({ older: true }).catch((e) => showError(errText(e)));
    log.append(more);
  }
  const b = st.cfg.boundaries?.[st.slot] || 0;
  let placed = !st.cfg.showOlder || !b;
  for (const it of visibleItems()) {
    if (!placed && itemMs(it) >= b) { placed = true; log.append(divider(b)); }
    const role = it.role === "user" ? "user" : "assistant";
    let text = it.content || "";
    if (it.content_type && it.content_type !== "text" && !text) text = `[${it.content_type}]`;
    if (!text) continue;
    const el = bubble(role, text);
    el.dataset.chatId = it.chat_id || "";
    const t = document.createElement("time");
    t.textContent = new Date(itemMs(it)).toLocaleString();
    el.append(t);
    log.append(el);
  }
  if (!placed) log.append(divider(b));
  if (st.turn) {
    log.append(bubble("user", st.turn.text || (st.turn.hasImage ? "📷 画面" : ""), "pending"));
    if (st.turn.assistant) log.append(bubble("assistant", st.turn.assistant, "pending"));
  }
  if (nearBottom || st.turn) log.scrollTop = log.scrollHeight;
}
const divider = (ms) => { const d = document.createElement("div"); d.className = "divider"; d.textContent = "ここから新しいトピック"; return d; };

async function loadHistory({ older = false } = {}) {
  if (st.slot == null) return;
  const q = new URLSearchParams({ slot: String(st.slot), limit: "50", direction: "older" });
  if (older && st.nextCursor) q.set("cursor", st.nextCursor);
  const r = (await st.api.request("GET", `${P}/data/user/chat/history?${q}`)).data || {};
  const got = r.items || [];
  if (older) {
    const have = new Set(st.items.map((i) => i.chat_id));
    st.items = [...got.filter((i) => !have.has(i.chat_id)), ...st.items];
  } else {
    // 最新ページで置き換え。すでに読み込んだ古い分は保持する
    const ids = new Set(got.map((i) => i.chat_id));
    const keepOlder = st.items.filter((i) => !ids.has(i.chat_id) && got.length && itemMs(i) < itemMs(got[0]));
    st.items = [...keepOlder, ...got];
    if (!keepOlder.length) { st.nextCursor = r.next_cursor || null; st.hasMore = !!r.has_more; }
  }
  if (older) { st.nextCursor = r.next_cursor || null; st.hasMore = !!r.has_more; }
  render();
}
function scheduleRefresh() {
  clearTimeout(st.refreshTimer);
  st.refreshTimer = setTimeout(() => loadHistory().catch(() => {}), 300);
}

// ---------- 端末との接続 ----------
async function fetchSlot() {
  st.slot = (await st.api.request("GET", `${P}/data/user/slot`)).data.slot_number;
}
async function startChat() {
  st.cfg = await store.get();
  st.api = new CodieAPI(st.cfg.deviceUrl, st.cfg.creds);
  $("clearOnNew").checked = st.cfg.clearOnNew;
  $("showOlder").checked = st.cfg.showOlder;
  $("pairInfo").textContent = `${st.cfg.deviceUrl}(${st.cfg.creds.auth_scope || "?"})`;
  show("chat");
  setStatus("接続中…");
  try {
    await fetchSlot();
    await loadHistory();
    setStatus("オンライン", "online");
    openEvents();
  } catch (e) { handleConnError(e); }
}
function handleConnError(e) {
  const code = errCode(e);
  if (["LOCAL_SESSION_EXPIRED", "LOCAL_USER_MISMATCH", "LOCAL_SECRET_MISMATCH", "INVALID_SIGNATURE"].includes(code)) {
    setStatus("認証エラー", "error");
    showError(`${errText(e)}\n設定からペアリングし直してください。`);
  } else {
    setStatus("オフライン", "error");
    showError(errText(e));
  }
}

async function openEvents() {
  closeEvents();
  try {
    const url = await st.api.websocketUrl("/v1/ws/events");
    const ws = new WebSocket(url);
    st.ws = ws;
    ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      if (m.type === "ready") ws.send(JSON.stringify({ type: "subscribe", request_id: "sub-1", data: { events: ["chat_history", "chat_turn"] } }));
      else if (m.type === "chat_history") scheduleRefresh();
    };
    ws.onclose = () => { if (st.ws === ws) { st.ws = null; st.wsTimer = setTimeout(openEvents, 5000); } };
    ws.onerror = () => {};
  } catch { st.wsTimer = setTimeout(openEvents, 5000); }
}
function closeEvents() { clearTimeout(st.wsTimer); const ws = st.ws; st.ws = null; try { ws?.close(); } catch {} }

// ---------- 送信 ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function setBusy(busy) {
  $("send").disabled = busy; $("shot").disabled = busy; $("newTopic").disabled = busy;
  $("turnStatus").hidden = !busy;
}

async function send() {
  const text = $("input").value.trim();
  const attach = st.attach;
  if ((!text && !attach) || st.turn) return;
  showError("");
  st.turn = { id: null, text, hasImage: !!attach, assistant: "" };
  setBusy(true); $("turnText").textContent = "送信中…";
  $("input").value = ""; clearAttach();
  render();
  try {
    let turn;
    try { turn = await postTurn(text, attach); }
    catch (e) { if (errCode(e) === "SLOT_MISMATCH") { await fetchSlot(); turn = await postTurn(text, attach); } else throw e; }
    st.turn.id = turn.turn_id;
    await pollTurn(turn.turn_id);
  } catch (e) {
    showError(errText(e));
    if (!st.turn?.id) { $("input").value = text; } // 受理前の失敗は入力を戻す
  } finally {
    st.turn = null; setBusy(false);
    await loadHistory().catch(() => {});
  }
}
async function postTurn(text, attach) {
  const request = { request_id: crypto.randomUUID(), slot: st.slot, input: attach ? { type: "image_text" } : { type: "text", text }, output: { speech: "device" } };
  if (attach && text) request.input.text = text;
  let body = request;
  if (attach) {
    body = new FormData();
    body.append("request", JSON.stringify(request));
    body.append("image", attach.blob, "screen.jpg");
  }
  return (await st.api.request("POST", `${P}/data/user/chat/turns`, body, { timeout: 30000 })).data;
}
async function pollTurn(id) {
  const deadline = Date.now() + 5 * 60 * 1000;
  while (Date.now() < deadline) {
    const t = (await st.api.request("GET", `${P}/data/user/chat/turns/${id}`)).data;
    if (t.assistant_text && st.turn) st.turn.assistant = t.assistant_text;
    $("turnText").textContent = STATE_TEXT[t.state] || t.state;
    render();
    if (TERMINAL.has(t.state)) {
      if (t.state === "failed") showError(t.error ? `${t.error.code || ""} ${t.error.message || ""}`.trim() : "失敗しました");
      else if (t.state === "cancelled") showError("中止しました");
      return t;
    }
    await sleep(1000);
  }
  showError("時間切れです。端末側のターンは継続している場合があります。");
}
async function cancelTurn() {
  if (!st.turn?.id) return;
  try { await st.api.request("POST", `${P}/data/user/chat/turns/${st.turn.id}/cancel`); } catch (e) { showError(errText(e)); }
}

// ---------- 画面の添付 ----------
async function captureScreen() {
  showError("");
  try {
    const win = await chrome.windows.getCurrent();
    const dataUrl = await chrome.tabs.captureVisibleTab(win.id, { format: "png" });
    const bmp = await createImageBitmap(await (await fetch(dataUrl)).blob());
    let scale = Math.min(1, 1280 / Math.max(bmp.width, bmp.height)), quality = 0.8, blob, w, h;
    for (let i = 0; i < 8; i++) {
      w = Math.max(1, Math.round(bmp.width * scale)); h = Math.max(1, Math.round(bmp.height * scale));
      const c = new OffscreenCanvas(w, h);
      c.getContext("2d").drawImage(bmp, 0, 0, w, h);
      blob = await c.convertToBlob({ type: "image/jpeg", quality });
      if (blob.size <= MAX_IMAGE) break;
      if (quality > 0.5) quality -= 0.15; else scale *= 0.75;
    }
    if (blob.size > MAX_IMAGE) throw new Error("画像を 1 MiB 以下にできませんでした");
    clearAttach();
    st.attach = { blob, w, h, url: URL.createObjectURL(blob) };
    $("thumb").src = st.attach.url;
    $("attachInfo").textContent = `${w}×${h} / ${Math.round(blob.size / 1024)} KB`;
    $("attachment").hidden = false;
  } catch (e) { showError("画面を取得できませんでした: " + errText(e)); }
}
function clearAttach() { if (st.attach) URL.revokeObjectURL(st.attach.url); st.attach = null; $("attachment").hidden = true; }

// ---------- 新しいトピック ----------
async function newTopic() {
  if (st.turn) return;
  showError("");
  const clear = st.cfg.clearOnNew;
  if (clear && !confirm("端末に保存された Codie との会話履歴を消去して、新しいトピックを始めます。元に戻せません。よろしいですか?")) return;
  try {
    if (clear) {
      await st.api.request("DELETE", `${P}/data/user/chat/history`);
      st.items = []; st.nextCursor = null; st.hasMore = false;
    }
    // 端末の時計とずれても崩れないよう、最新の履歴の時刻を境界にする(履歴が無ければ 0 = 全て新トピック)
    const last = st.items.reduce((m, it) => Math.max(m, itemMs(it)), 0);
    const boundaries = { ...(st.cfg.boundaries || {}), [st.slot]: last ? last + 1 : 0 };
    st.cfg.boundaries = boundaries;
    await store.set({ boundaries });
    await loadHistory().catch(() => {});
    render();
  } catch (e) { showError(errText(e)); }
}

// ---------- ペアリング ----------
async function pairing(fn) {
  $("setupError").textContent = "";
  try { await fn(); } catch (e) { $("setupError").textContent = errText(e); }
}
$("pairStart").onclick = () => pairing(async () => {
  const url = normalizeDeviceUrl($("deviceUrl").value);
  const api = new CodieAPI(url);
  const r = await api.pairRequest();
  await store.set({ deviceUrl: url, scope: $("scope").value, pairing: r });
  $("codeBox").hidden = false;
});
$("pairConfirm").onclick = () => pairing(async () => {
  const c = await store.get();
  if (!c.pairing) throw new Error("先に「ペアリング開始」を押してください");
  const api = new CodieAPI(c.deviceUrl);
  const creds = await api.pairConfirm(c.pairing.challenge_id, $("code").value.trim(), c.pairing.user_id, c.scope);
  await store.set({ creds, pairing: null });
  await startChat();
});
$("pairCancel").onclick = () => pairing(async () => {
  const c = await store.get();
  try { await new CodieAPI(c.deviceUrl).request("POST", `${P}/auth/pair/cancel`, c.pairing ? { challenge_id: c.pairing.challenge_id } : undefined, { pub: true }); } catch {}
  await store.set({ pairing: null }); $("codeBox").hidden = true;
});
$("importCreds").onclick = () => pairing(async () => {
  const url = normalizeDeviceUrl($("deviceUrl").value);
  const c = JSON.parse($("credsJson").value);
  if (!c.local_secret || !c.user_id) throw new Error("local_secret と user_id を含む JSON が必要です");
  await store.set({ deviceUrl: url, creds: c, pairing: null });
  await startChat();
});
$("unpair").onclick = async () => {
  closeEvents(); await store.set({ creds: null, pairing: null }); st.items = [];
  $("deviceUrl").value = (await store.get()).deviceUrl; $("codeBox").hidden = true; show("setup");
};

// ---------- 配線 ----------
$("composer").addEventListener("submit", (e) => { e.preventDefault(); send(); });
$("input").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } });
$("shot").onclick = captureScreen;
$("removeAttach").onclick = clearAttach;
$("cancelTurn").onclick = cancelTurn;
$("newTopic").onclick = newTopic;
$("settingsBtn").onclick = () => show("settings");
$("settingsClose").onclick = () => show(st.cfg.creds ? "chat" : "setup");
$("clearOnNew").onchange = () => { st.cfg.clearOnNew = $("clearOnNew").checked; store.set({ clearOnNew: st.cfg.clearOnNew }); };
$("showOlder").onchange = () => { st.cfg.showOlder = $("showOlder").checked; store.set({ showOlder: st.cfg.showOlder }); render(); };

(async () => {
  const c = await store.get();
  if (c.creds && c.deviceUrl) await startChat();
  else { $("deviceUrl").value = c.deviceUrl; $("codeBox").hidden = !c.pairing; show("setup"); setStatus("未接続"); }
})();
