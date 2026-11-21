// 実Chrome(拡張を読み込み)× モック端末 のE2E。 node test/e2e.mjs
import path from "node:path"; import os from "node:os"; import fs from "node:fs";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startMock } from "./mock-device.mjs";

const ext = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let failed = 0;
const check = (n, ok, extra = "") => { console.log((ok ? "PASS " : "FAIL ") + n + (ok ? "" : "  " + extra)); if (!ok) failed++; };
const web = http.createServer((q, r) => { r.writeHead(200, { "content-type": "text/html; charset=utf-8" }); r.end("<title>t</title><body style='background:#8cf'><h1>テストページ</h1>"); }).listen(18091);
const mock = await startMock(18082);
const ctx = await chromium.launchPersistentContext(fs.mkdtempSync(path.join(os.tmpdir(), "cs-")), {
  headless: false, executablePath: process.env.CHROME_PATH || undefined,
  args: ["--headless=new", `--disable-extensions-except=${ext}`, `--load-extension=${ext}`, "--no-sandbox"],
});
try {
  const sw = ctx.serviceWorkers()[0] || (await ctx.waitForEvent("serviceworker", { timeout: 15000 }));
  const id = sw.url().split("/")[2];
  const target = await ctx.newPage(); await target.goto("http://127.0.0.1:18091/");
  await target.bringToFront();
  const p = await ctx.newPage();
  p.on("dialog", (d) => d.accept());
  await p.goto(`chrome-extension://${id}/sidepanel/sidepanel.html`);
  await target.bringToFront();

  await p.fill("#deviceUrl", "http://127.0.0.1:18082");
  await p.click("#pairStart"); await p.waitForSelector("#codeBox:not([hidden])");
  await p.fill("#code", mock.CODE); await p.click("#pairConfirm");
  await p.waitForFunction(() => document.getElementById("status").textContent === "オンライン", null, { timeout: 10000 });
  check("ペアリング→署名付きで slot と履歴を取得", mock.state.log.some((l) => l.includes("/chat/history")) && mock.state.log.some((l) => l.endsWith("/data/user/slot")), JSON.stringify(mock.state.log));
  check("WebSocket で chat_history を購読", await (async () => { for (let i = 0; i < 30; i++) { if (mock.state.subscribed.includes("chat_history")) return true; await new Promise((r) => setTimeout(r, 200)); } return false; })());

  // 既存履歴 + 端末側(音声)で増えた履歴が WS 通知で反映される
  mock.addHistory("user", "端末で話した内容", "x"); mock.addHistory("assistant", "端末の返答", "x"); mock.broadcast("chat_history");
  await p.waitForFunction(() => document.getElementById("log").textContent.includes("端末の返答"), null, { timeout: 5000 });
  check("端末側の会話が履歴に反映される(WS通知)", true);

  // テキスト送信(返答は端末音声 = output.speech=device)
  await p.fill("#input", "こんにちは");
  await p.click("#send");
  await p.waitForFunction(() => document.getElementById("log").textContent.includes("を受け取りました") && !document.querySelector(".pending"), null, { timeout: 15000 });
  const r1 = mock.state.requests.at(-1);
  check("text 入力 / speech=device / 現在スロットで送信", r1.input.type === "text" && r1.input.text === "こんにちは" && r1.output.speech === "device" && r1.slot === 1, JSON.stringify(r1));
  check("返答が履歴に表示される", (await p.textContent("#log")).includes("「こんにちは」を受け取りました"));

  // 画面送信(captureVisibleTab → JPEG, multipart)
  await target.bringToFront();
  await p.click("#shot");
  await p.waitForSelector("#attachment:not([hidden])", { timeout: 10000 }).catch(async () => { throw new Error("attach failed: " + (await p.textContent("#error"))); });
  const info = await p.textContent("#attachInfo");
  await p.fill("#input", "この画面は?"); await p.click("#send");
  await p.waitForFunction(() => document.getElementById("log").textContent.includes("(画面つき)"), null, { timeout: 15000 });
  const r2 = mock.state.requests.at(-1);
  check("画面を image_text(multipart)で送信、1MiB 以下", r2.input.type === "image_text" && r2.input.text === "この画面は?" && r2.image_bytes > 1000 && r2.image_bytes <= 1048576, JSON.stringify(r2) + info);

  // 新しいトピック: 区切りのみ
  await p.click("#newTopic");
  await p.waitForFunction(() => !document.getElementById("log").textContent.includes("こんにちは"), null, { timeout: 5000 });
  check("新しいトピックで表示がリセットされ、端末履歴は残る", mock.state.cleared === 0 && mock.state.history.length > 0);
  await p.fill("#input", "次の話題"); await p.click("#send");
  await p.waitForFunction(() => document.getElementById("log").textContent.includes("「次の話題」を受け取りました"), null, { timeout: 15000 });
  await p.click("#settingsBtn"); await p.check("#showOlder"); await p.click("#settingsClose");
  check("「前の履歴も表示」で区切り線つきで見える", (await p.textContent("#log")).includes("こんにちは") && (await p.textContent("#log")).includes("ここから新しいトピック"));
  await p.click("#settingsBtn"); await p.uncheck("#showOlder");

  // 端末履歴も消去
  await p.check("#clearOnNew"); await p.click("#settingsClose"); await p.click("#newTopic");
  await p.waitForFunction(() => document.getElementById("log").children.length === 0, null, { timeout: 5000 });
  check("設定オンなら DELETE /chat/history も呼ぶ", mock.state.cleared === 1);

  // DEVICE_BUSY 失敗
  mock.state.busy = true;
  await p.fill("#input", "忙しい?"); await p.click("#send");
  await p.waitForFunction(() => document.getElementById("error").textContent.includes("DEVICE_BUSY"), null, { timeout: 10000 });
  check("失敗ターンのエラーを表示", true);
  mock.state.busy = false;
  check("全リクエストで署名検証を通過(401なし)", !mock.state.log.some((l) => l.includes("rejected")));
  console.log("  送信元 Origin:", [...new Set(mock.state.origins)].join(", "));
  await p.screenshot({ path: "/tmp/claude-0/sidepanel.png" });
} catch (e) { console.log("ERROR", e.message); failed++; }
await ctx.close(); mock.close(); web.close();
console.log(failed ? `${failed} FAILED` : "ALL PASS"); process.exit(failed ? 1 : 0);
