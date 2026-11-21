# Contributing / コントリビューション / 贡献指南

## English

Bug reports and pull requests are welcome.

**Bug reports** — please open an [issue](../../issues/new/choose). Include what you did, what happened, the extension version, and Chrome / firmware versions. Do not post your `local_secret`, credentials, or private page contents or screenshots.

**Pull requests**
1. Open an issue first for large changes, so we can agree on the direction.
2. Fork, then create a branch from `main` (e.g. `fix-history-paging`).
3. Keep each PR focused on one thing. Explain what and why in the PR description (a template is provided).
4. Run the end-to-end test against the mock device and make sure it passes:
   ```
   cd test && npm i && node e2e.mjs
   ```
   (set `CHROME_PATH` if Playwright's Chromium is not available). Add or update a test when you change behavior.
5. Rules for this project:
   - UI strings live in `src/i18n.js`; update **English, Japanese and Chinese** together.
   - Send data only to the user's paired Codie. Never send anything elsewhere.
   - A screenshot is sent only when the user attaches it and sends the message. Do not add background capture or monitoring.
   - Do not bump `version` in `manifest.json`; the maintainer does that when releasing.
6. Open the PR against `main`. By contributing you agree your work is released under the [MIT License](LICENSE).

## 日本語

バグ報告とプルリクエストを歓迎します。

**バグ報告** は [issue](../../issues/new/choose) でお願いします。やったこと、実際に起きたこと、拡張のバージョン、Chrome とファームウェアのバージョンを書いてください。`local_secret` や認証情報、見られたくないページの内容やスクリーンショットは貼らないでください。

**プルリクエスト**
1. 大きな変更は、先に issue で方向性を相談してください。
2. フォークして、`main` からブランチを作ります（例: `fix-history-paging`）。
3. 1つの PR では1つのことだけを扱います。何を・なぜ変えたかを PR の説明に書いてください（テンプレートあり）。
4. モック端末を使った E2E テストを実行して、通ることを確認します。
   ```
   cd test && npm i && node e2e.mjs
   ```
   （Playwright の Chromium が使えない場合は `CHROME_PATH` を指定）。動作を変えたときは、テストも追加・更新してください。
5. このプロジェクトのルール:
   - 画面の文言は `src/i18n.js` にあります。**英語・日本語・中国語** をそろえて更新します。
   - データはペアリングした Codie にだけ送ります。それ以外には何も送らないでください。
   - スクリーンショットは、ユーザーが添付して送信したときだけ送ります。バックグラウンドでの撮影や監視は追加しないでください。
   - `manifest.json` の `version` は変えないでください（リリース時にメンテナーが更新します）。
6. `main` に向けて PR を出します。コントリビュートした内容は [MIT ライセンス](LICENSE) で公開されることに同意したものとします。

## 中文

欢迎提交问题反馈和 Pull Request。

**问题反馈**：请通过 [issue](../../issues/new/choose) 提交。请写明你做了什么、实际发生了什么、扩展版本以及 Chrome 和固件版本。请不要粘贴 `local_secret`、凭据、私密页面内容或截图。

**Pull Request**
1. 较大的改动请先开 issue 讨论方向。
2. Fork 后从 `main` 创建分支（例如 `fix-history-paging`）。
3. 每个 PR 只做一件事，并在描述中说明改了什么、为什么（已提供模板）。
4. 使用模拟设备运行端到端测试并确保通过：
   ```
   cd test && npm i && node e2e.mjs
   ```
   （如果 Playwright 的 Chromium 不可用，请设置 `CHROME_PATH`）。改变行为时请新增或更新测试。
5. 本项目的规则：
   - 界面文字在 `src/i18n.js` 中，请同时更新 **英文、日文和中文**。
   - 只把数据发送到已配对的 Codie，不要发送到其他任何地方。
   - 只有在用户附加并发送消息时才发送截图。不要添加后台截图或监控。
   - 不要修改 `manifest.json` 中的 `version`（由维护者在发布时更新）。
6. 向 `main` 提交 PR。提交即表示你同意以 [MIT 许可证](LICENSE) 发布你的贡献。
