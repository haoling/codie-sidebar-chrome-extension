# Codie Sidebar(ベータ)

Chrome のサイドバーから Codie(1.6.0 の LAN HTTP API)とチャットする拡張機能(Manifest V3, Chrome 116+)です。中継サーバーは不要で、サイドバーのページが直接 Codie 端末へ接続します。

## 機能
- **履歴表示**: `GET /chat/history`。端末側(音声)で増えた会話も `/v1/ws/events` の `chat_history` 通知で自動更新。
- **送信**: テキストを `POST /chat/turns`(`output.speech=device`)で送信。返答は端末が音声で再生し、完了後に履歴へ表示。中止ボタンあり。
- **画面の送信**: 表示中のタブを `chrome.tabs.captureVisibleTab` で撮り、長辺 1280px / 1 MiB 以下の JPEG にして `image_text` で送信(テキストは任意)。
- **新しいトピック**: API に専用操作が無いため、サイドバー上の区切り(以降だけ表示)で実現。設定で「端末の履歴も消去」(`DELETE /chat/history`、確認ダイアログ付き)を選べます。端末の AI は端末に残る履歴も参照するため、完全に文脈を切るなら消去オプションを使います。

## 使い方
1. `chrome://extensions` → デベロッパーモード → 「パッケージ化されていない拡張機能を読み込む」でこのフォルダを選ぶ。
2. ツールバーのアイコンでサイドバーを開き、端末アドレス(例 `http://192.168.0.39:8081`)を入れてペアリング。端末に出たコードを入力。
3. ペアリングが拒否される場合は `examples/local_api.py` の credentials.json を「取り込む」に貼り付け。

## 注意
- 端末は `Origin` 付きのペアリング要求を拒否する(`PAIRING_SOURCE_NOT_ALLOWED`)ため、`declarativeNetRequest` で端末宛ての fetch / WebSocket から `Origin` / `Referer` を外しています(codie-browser-hands と同じ対処)。
- `host_permissions: <all_urls>` は端末(LAN)への通信と画面キャプチャのために使います。
- 認証情報は `chrome.storage.local` に平文保存(既定は 12 時間の session)。
- 画面を送ると、その画像は Codie のモデルに渡ります。見せたくないタブは開いたまま送らないでください。

## 検証
`cd test && npm i && node e2e.mjs`: 署名を仕様どおりに検証するモック端末+実 Chromium で、ペアリング・履歴・WS 更新・テキスト/画面送信・新トピック(区切り/消去)・失敗表示を確認済み。**実機は未検証**。実機で要確認: 拡張の Origin(`chrome-extension://`)でのペアリング可否、`chat_history` イベントの形、画像履歴の `content_type`。

## 開発・リリース
`scripts/build-zip.sh` で配布用 zip(`dist/codie-sidebar-chrome-extension-vX.Y.Z.zip`、`test/` は含まない)を作れます。リリースは `manifest.json` の `version` を更新して `v0.1.0` のようなタグを push すると、GitHub Actions が zip を Releases に公開します(Actions タブから手動実行も可)。
