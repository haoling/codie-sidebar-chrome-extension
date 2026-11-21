# Codie Sidebar (beta)

**English** · [日本語](#日本語) · [中文](#中文)

## English

### What is this?

An unofficial Chrome extension (beta) that puts a chat with your Codie (CODE27, firmware 1.6.0 LAN HTTP API) in Chrome's side panel.

- Shows your chat history with Codie, including conversations you had by voice on the device.
- Send a message from the side panel. Codie answers **out loud on the device**, and the reply also appears in the history.
- Attach a screenshot of the tab you are looking at, so Codie can see it.
- Start a **new topic** with one click.

It talks directly to your Codie on your LAN. There is no relay server.

### Install

1. Download `codie-sidebar-chrome-extension-vX.Y.Z.zip` from [Releases](../../releases) and unzip it.
2. Open `chrome://extensions` and turn on **Developer mode** (top right).
3. Click **Load unpacked** and select the unzipped folder (Chrome 116 or later).

### How to use

The language (English / 日本語 / 中文) can be switched with the selector at the top right; it follows your Chrome language by default.

1. Wake and unlock the Codie device. Make sure your PC and the device are on the same LAN.
2. Click the extension icon to open the side panel. Enter your Codie's address (e.g. `http://<Codie IP>:8081`) and press **Start pairing**, then type the code shown on the device and press **Confirm**.
3. Type a message and press Enter. Codie replies by voice on the device, and the reply is added to the history.
4. **Attach screen** captures the visible tab; it is sent together with your next message (the text is optional).
5. **New topic** puts a divider in the panel and shows only what comes after it. Codie's AI also reads the history stored on the device, so the context is not fully cut. If you want a clean slate, turn on "Also erase the device's chat history on a new topic" in Settings (a confirmation is shown; it cannot be undone).

### Permissions, data and safety

- Permissions: `tabs` and all-sites access (to take a screenshot of the tab you are viewing and to reach your Codie on the LAN); `storage` (settings and the pairing secret); `sidePanel` (the side panel); `declarativeNetRequest` (remove the Origin header on requests to your own Codie, which the device otherwise rejects).
- The extension never acts on its own. It only sends what you type, and a screenshot only when you press **Attach screen** and then send. Nothing is recorded or monitored in the background.
- Your messages and screenshots are sent only to your paired Codie on your LAN. Codie may process them with CODE27's cloud AI. Nothing is sent to any other server.
- Anything visible in the tab (including private information) ends up in the screenshot. Check the thumbnail before you send.
- Use it only on computers and devices you own or are authorized to control.
- Not made, reviewed or endorsed by CODE27.

### Known limitations

- The device may shrink the screenshot, so small text can be hard for Codie to read. Zoom the page in before attaching if you need Codie to read details.
- There is no dedicated "new topic" API on the device, so the divider and the optional history erase are the closest equivalents.
- Pairing is `session` (12 h) by default; the secret is stored in `chrome.storage.local`. If browser pairing is rejected, paste a `credentials.json` made by `examples/local_api.py` (from the Codie API package) into **Import**.
- If you hit a problem, please open an issue.

Development: `scripts/build-zip.sh` builds the zip; `cd test && npm i && node e2e.mjs` runs the end-to-end test against a mock device (the `test/` folder is not included in the release zip).
Release: set `version` in `manifest.json`, then push a tag such as `v0.1.0` (or run the Release workflow manually); GitHub Actions publishes the zip.
License: MIT (see `LICENSE`).

---

## 日本語

### どういう拡張？

Codie（CODE27、ファームウェア 1.6.0 の LAN HTTP API）とのチャットを、Chrome のサイドバーで使えるようにする非公式の拡張機能です（ベータ版）。

- Codie とのチャット履歴を表示します。端末で音声で話した会話も出ます。
- サイドバーからメッセージを送れます。返答は**端末が音声で読み上げ**、履歴にも表示されます。
- いま見ているタブのスクリーンショットを添付して、Codie に見せられます。
- ワンクリックで**新しいトピック**に切り替えられます。

LAN 上の自分の Codie と直接通信します。中継サーバーは使いません。

### インストール方法

1. [Releases](../../releases) から `codie-sidebar-chrome-extension-vX.Y.Z.zip` をダウンロードして展開します。
2. `chrome://extensions` を開き、右上の**デベロッパーモード**をオンにします。
3. **パッケージ化されていない拡張機能を読み込む**を押して、展開したフォルダを選びます（Chrome 116 以降）。

### 使い方

右上のセレクターで言語（English / 日本語 / 中文）を切り替えられます。初期値は Chrome の言語です。

1. Codie 端末をスリープ解除・ロック解除し、PC と同じ LAN につなぎます。
2. 拡張のアイコンを押してサイドバーを開き、Codie のアドレス（例 `http://<CodieのIP>:8081`）を入れて**ペアリング開始**、端末に出たコードを入れて**確定**します。
3. メッセージを入力して Enter で送ります。Codie が端末で音声で返答し、履歴にも追加されます。
4. **画面を添付**で、表示中のタブを撮影します。次のメッセージと一緒に送られます（テキストは空でも構いません）。
5. **新しいトピック**を押すと、サイドバーに区切りが入り、以降だけが表示されます。Codie の AI は端末に残る履歴も参照するため、文脈は完全には切れません。確実に切りたいときは、設定の「新しいトピックで端末の履歴も消去する」をオンにしてください（確認が出ます。元に戻せません）。

### 権限とデータ、安全面

- 権限: `tabs` とすべてのサイトへのアクセス（見ているタブのスクリーンショットと、LAN 上の Codie との通信のため）、`storage`（設定とペアリングの秘密鍵の保存）、`sidePanel`（サイドバー）、`declarativeNetRequest`（自分の Codie へのリクエストから Origin ヘッダを外すため。端末は Origin 付きを拒否します）。
- 拡張が勝手に動くことはありません。送るのは、あなたが入力した文章と、**画面を添付**して送信したスクリーンショットだけです。バックグラウンドで記録・監視はしません。
- メッセージとスクリーンショットは、LAN 上のペアリング済みの Codie にだけ送られます。Codie が CODE27 のクラウド AI で処理することがあります。それ以外のサーバーには何も送りません。
- タブに映っているもの（個人情報を含む）はスクリーンショットに入ります。送る前にサムネイルを確認してください。
- 自分のものか、操作する権限があるパソコン・端末でだけ使ってください。
- CODE27 が作成・審査・推奨したものではありません。

### 既知の制限

- 端末側でスクリーンショットが縮小されることがあり、小さな文字は Codie が読みにくい場合があります。細部を読ませたいときは、ページを拡大してから添付してください。
- 端末に「新しいトピック」専用の API が無いため、区切りと、任意の履歴消去で代用しています。
- ペアリングは既定で `session`（12 時間）です。鍵は `chrome.storage.local` に保存されます。ブラウザーからのペアリングが拒否される場合は、Codie API パッケージの `examples/local_api.py` で作った `credentials.json` を**取り込む**に貼り付けてください。
- 不具合があれば issue で教えてください。

開発者向け: `scripts/build-zip.sh` で zip を作れます。`cd test && npm i && node e2e.mjs` でモック端末を使った E2E テストを実行できます（`test/` はリリース zip に含まれません）。
リリース: `manifest.json` の `version` を更新し、`v0.1.0` のようなタグを push（または Release ワークフローを手動実行）すると、GitHub Actions が zip を公開します。
ライセンス: MIT（`LICENSE` を参照）。

---

## 中文

### 这是什么？

让你在 Chrome 侧边栏中与 Codie（CODE27，固件 1.6.0 局域网 HTTP API）聊天的非官方浏览器扩展（测试版）。

- 显示与 Codie 的聊天记录，包括你在设备上用语音进行的对话。
- 在侧边栏发送消息。Codie 会**在设备上用语音回复**，回复也会显示在记录中。
- 可以附加当前标签页的截图，让 Codie 看到。
- 一键切换到**新话题**。

它直接与局域网内你自己的 Codie 通信，不经过中继服务器。

### 安装方法

1. 从 [Releases](../../releases) 下载 `codie-sidebar-chrome-extension-vX.Y.Z.zip` 并解压。
2. 打开 `chrome://extensions`，开启右上角的**开发者模式**。
3. 点击**加载已解压的扩展程序**，选择解压后的文件夹（需要 Chrome 116 或更高版本）。

### 使用方法

右上角可切换界面语言（English / 日本語 / 中文），默认跟随 Chrome 的语言。

1. 唤醒并解锁 Codie 设备，确保电脑与设备在同一局域网。
2. 点击扩展图标打开侧边栏，输入 Codie 的地址（例如 `http://<Codie的IP>:8081`），点击**开始配对**，再输入设备上显示的代码并点击**确认**。
3. 输入消息并按 Enter 发送。Codie 会在设备上用语音回复，回复也会加入记录。
4. **附加屏幕**会截取当前标签页，并与下一条消息一起发送（文字可以为空）。
5. **新话题**会在侧边栏插入分隔线，只显示之后的内容。Codie 的 AI 也会读取设备上保存的记录，所以上下文不会被完全切断。若想彻底清空，请在设置中开启“开始新话题时同时清除设备上的聊天记录”（会弹出确认，无法恢复）。

### 权限、数据与安全

- 权限：`tabs` 和所有网站访问（用于截取你正在查看的标签页，以及与局域网内的 Codie 通信）；`storage`（保存设置和配对密钥）；`sidePanel`（侧边栏）；`declarativeNetRequest`（去掉发往你自己 Codie 的请求中的 Origin 头，否则设备会拒绝）。
- 扩展不会自行行动。只会发送你输入的文字，以及你点击**附加屏幕**后发送的截图。不会在后台记录或监控任何内容。
- 消息和截图只会发送给局域网内已配对的 Codie，Codie 可能使用 CODE27 的云端 AI 处理，不会发送到其他任何服务器。
- 标签页中显示的内容（包括个人信息）都会出现在截图里。发送前请先检查缩略图。
- 请仅在你自己拥有或有权操作的电脑和设备上使用。
- 本扩展为非官方，并非由 CODE27 制作、审核或认可。

### 已知限制

- 设备可能会缩小截图，较小的文字 Codie 可能读不清。需要读取细节时，请先放大页面再附加。
- 设备没有专门的“新话题”API，因此用分隔线和可选的清除记录来代替。
- 配对默认为 `session`（12 小时），密钥保存在 `chrome.storage.local`。如果浏览器配对被拒绝，请把 Codie API 包中 `examples/local_api.py` 生成的 `credentials.json` 粘贴到**导入**中。
- 如遇问题，请提交 issue。

开发：`scripts/build-zip.sh` 可生成 zip；`cd test && npm i && node e2e.mjs` 使用模拟设备运行端到端测试（`test/` 不包含在发布的 zip 中）。
发布：更新 `manifest.json` 的 `version` 后推送 `v0.1.0` 之类的标签（或手动运行 Release 工作流），GitHub Actions 会发布 zip。
许可证：MIT（见 `LICENSE`）。
