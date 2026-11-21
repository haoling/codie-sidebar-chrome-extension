// UI の文言(English / 日本語 / 中文)。モデルや端末に送る文字列ではなく、サイドバーの表示だけが対象。
export const LANGS = { en: "English", ja: "日本語", zh: "中文" };

const T = {
  en: {
    newTopic: "＋ New topic", newTopicTitle: "Start a new topic", settingsTitle: "Settings",
    setupIntro: "Pair with your Codie (firmware 1.6.0). Wake and unlock the device first.",
    deviceUrl: "Device address", scope: "Credential type",
    scopeSession: "session (expires in 12 h, recommended)", scopePermanent: "permanent (long-lived)",
    pairStart: "Start pairing", pairCode: "Code shown on the device", confirm: "Confirm", cancel: "Cancel",
    importSummary: "If pairing is rejected", importHint: "Paste the contents of credentials.json made by examples/local_api.py.", importBtn: "Import",
    settings: "Settings", language: "Language",
    clearOnNew: "Also erase the device's chat history on a new topic (cannot be undone)",
    showOlder: "Also show history from before the current topic",
    unpair: "Unpair", close: "Close",
    placeholder: "Talk to Codie (Enter to send / Shift+Enter for a new line)",
    shot: "📷 Attach screen", shotTitle: "Attach a screenshot of the visible tab", send: "Send", stop: "Stop", removeAttach: "Remove",
    loadOlder: "Load older history", topicDivider: "New topic starts here",
    sending: "Sending…", connecting: "Connecting…", online: "Online", offline: "Offline", unauthorized: "Auth error", notConnected: "Not connected",
    reauth: "Please pair again from Settings.", screenFail: "Could not capture the screen: ", imgTooBig: "Could not make the image 1 MiB or smaller.",
    pairFirst: "Press “Start pairing” first.", needCreds: "credentials.json must contain local_secret and user_id.",
    badUrl: "Enter the device address like http://IP:8081 without a path or query.",
    confirmClear: "This erases the chat history stored on the device and starts a new topic. It cannot be undone. Continue?",
    attachedShot: "📷 Screen", cancelled: "Cancelled.", failed: "Failed.", timeout: "Timed out. The turn may still be running on the device.",
    pairedAs: "Paired device",
    s_queued: "Waiting…", s_starting: "Starting…", s_receiving_input: "Receiving input…", s_thinking: "Thinking…", s_responding: "Replying (spoken on the device)…", s_cancelling: "Cancelling…",
  },
  ja: {
    newTopic: "＋ 新しいトピック", newTopicTitle: "新しいトピックを始める", settingsTitle: "設定",
    setupIntro: "Codie 端末(1.6.0)とペアリングします。端末をスリープ解除・ロック解除してください。",
    deviceUrl: "端末アドレス", scope: "認証の種類",
    scopeSession: "session(12時間で失効・推奨)", scopePermanent: "permanent(長期)",
    pairStart: "ペアリング開始", pairCode: "端末に表示されたコード", confirm: "確定", cancel: "キャンセル",
    importSummary: "ペアリングが拒否される場合", importHint: "examples/local_api.py が作った credentials.json の中身を貼り付けます。", importBtn: "取り込む",
    settings: "設定", language: "言語",
    clearOnNew: "新しいトピックで端末の履歴も消去する(元に戻せません)",
    showOlder: "現在のトピックより前の履歴も表示する",
    unpair: "ペアリング解除", close: "閉じる",
    placeholder: "Codie に話しかける(Enterで送信 / Shift+Enterで改行)",
    shot: "📷 画面を添付", shotTitle: "表示中のタブの画面を添付", send: "送信", stop: "中止", removeAttach: "取り消し",
    loadOlder: "さらに古い履歴を読み込む", topicDivider: "ここから新しいトピック",
    sending: "送信中…", connecting: "接続中…", online: "オンライン", offline: "オフライン", unauthorized: "認証エラー", notConnected: "未接続",
    reauth: "設定からペアリングし直してください。", screenFail: "画面を取得できませんでした: ", imgTooBig: "画像を 1 MiB 以下にできませんでした。",
    pairFirst: "先に「ペアリング開始」を押してください。", needCreds: "local_secret と user_id を含む JSON が必要です。",
    badUrl: "端末アドレスは http://IP:8081 の形式で、パスやクエリを付けずに指定してください。",
    confirmClear: "端末に保存された Codie との会話履歴を消去して、新しいトピックを始めます。元に戻せません。よろしいですか?",
    attachedShot: "📷 画面", cancelled: "中止しました。", failed: "失敗しました。", timeout: "時間切れです。端末側のターンは継続している場合があります。",
    pairedAs: "ペアリング済みの端末",
    s_queued: "待機中…", s_starting: "開始中…", s_receiving_input: "入力中…", s_thinking: "考え中…", s_responding: "返答中(端末で再生)…", s_cancelling: "中止中…",
  },
  zh: {
    newTopic: "＋ 新话题", newTopicTitle: "开始新话题", settingsTitle: "设置",
    setupIntro: "与 Codie(固件 1.6.0)配对。请先唤醒并解锁设备。",
    deviceUrl: "设备地址", scope: "凭据类型",
    scopeSession: "session(12 小时后失效,推荐)", scopePermanent: "permanent(长期)",
    pairStart: "开始配对", pairCode: "设备上显示的代码", confirm: "确认", cancel: "取消",
    importSummary: "配对被拒绝时", importHint: "粘贴由 examples/local_api.py 生成的 credentials.json 内容。", importBtn: "导入",
    settings: "设置", language: "语言",
    clearOnNew: "开始新话题时同时清除设备上的聊天记录(无法恢复)",
    showOlder: "同时显示当前话题之前的记录",
    unpair: "取消配对", close: "关闭",
    placeholder: "和 Codie 说话(Enter 发送 / Shift+Enter 换行)",
    shot: "📷 附加屏幕", shotTitle: "附加当前标签页的截图", send: "发送", stop: "停止", removeAttach: "移除",
    loadOlder: "加载更早的记录", topicDivider: "从这里开始新话题",
    sending: "发送中…", connecting: "连接中…", online: "在线", offline: "离线", unauthorized: "认证错误", notConnected: "未连接",
    reauth: "请在设置中重新配对。", screenFail: "无法获取屏幕: ", imgTooBig: "无法把图片压缩到 1 MiB 以内。",
    pairFirst: "请先点击“开始配对”。", needCreds: "需要包含 local_secret 和 user_id 的 JSON。",
    badUrl: "设备地址请使用 http://IP:8081 的形式,不要带路径或查询参数。",
    confirmClear: "这会清除设备上保存的聊天记录并开始新话题,无法恢复。要继续吗?",
    attachedShot: "📷 屏幕", cancelled: "已停止。", failed: "失败。", timeout: "超时。设备上的这一轮可能仍在进行。",
    pairedAs: "已配对的设备",
    s_queued: "等待中…", s_starting: "开始中…", s_receiving_input: "接收输入…", s_thinking: "思考中…", s_responding: "回复中(在设备上播放)…", s_cancelling: "停止中…",
  },
};

export function detectLang() {
  const l = (chrome.i18n?.getUILanguage?.() || navigator.language || "en").toLowerCase();
  return l.startsWith("ja") ? "ja" : l.startsWith("zh") ? "zh" : "en";
}
let cur = "en";
export const setLang = (l) => { cur = T[l] ? l : "en"; document.documentElement.lang = cur; };
export const getLang = () => cur;
export const t = (k) => T[cur][k] ?? T.en[k] ?? k;
/** data-i18n(テキスト)/ data-i18n-title / data-i18n-ph(placeholder)を持つ要素を更新する */
export function applyI18n(root = document) {
  for (const el of root.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll("[data-i18n-title]")) el.title = t(el.dataset.i18nTitle);
  for (const el of root.querySelectorAll("[data-i18n-ph]")) el.placeholder = t(el.dataset.i18nPh);
}
