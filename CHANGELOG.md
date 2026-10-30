# PROMPT PALETTE v0.12.2

公開済みv0.9.2から、ローカル正式版v0.12.2へ更新。
- NAI PRESETの複数フォルダ管理・並べ替えと順序保存。
- LIBRARY画像プレビュー、詳細3タブ、分類別PROMPTコピーとMEMO表示。
- LIBRARY操作配置、COMPARE追加PROMPTの5行表示・スクロール。
- MAINメニューの順序と区切り線を整理。
既存の保存形式・バックアップを維持。ユーザーデータや検証用画像は含めていません。

---
以前の公開記録：

# PROMPT PALETTE v0.9.2｜NAI画像取得修正
正式版v0.9.1を基準に、不具合修正としてパッチ更新。

## 原因
提供された元WebPは832×1216px、RIFF内にVP8X・ALPH・VP8・EXIFがあり、EXIFにUserCommentはありません。
生成情報はアルファチャンネルのstealth_pngcompにあります。
v0.9.1はWebPをEXIFだけで判定していたため、実在する生成情報を取得できませんでした。
同じ元ファイルで旧版の失敗と公式Inspectの成功を再現し、公式の未加工パラメーターと埋め込みJSONの一致を確認しました。

## 修正ファイル
- nai-metadata.js: WebPアルファの読み取りを追加。元バイトを原寸でデコードしPNGと共通のLSB読み取りで展開。既存EXIFを維持し、取得できない場合にアルファも探索。EXIFのSource/Description等を保持。入れ子Commentの解析を改善。モデル名・ハッシュ・noise_scheduleを原値で保持。情報なし・未対応・解析失敗を区別。
- nai-presets.js: 元画像で判明した失敗理由を取得ボタンでも維持。軽量化後の画像を再解析して「情報なし」に変わる問題を防止。保存形式・反映確認・デザインは変更なし。
- index.html / start.cjs / start.py / warehouse.js: 版番号だけ0.9.2へ更新。
- README.md / CHANGELOG.md / NovelAI対応形式.md / 検証結果.md: 今回の操作と確認結果を記載。

## 維持
NAI EDITOR・通常EDITOR・LIBRARY・素材・倉庫・COMPARE等の処理とCSS、start.cmdは前版と同一。
既存IndexedDBとバックアップ形式を維持。過去版と元画像は変更しません。
追加インストールや外部への画像送信は不要です。アプリ内の解析は端末内で完結します。

## 検証用ファイル（製品ZIP外）
work/v0.9.2_NAI画像取得修正 に既存113件と新規12件のテスト、元画像の回帰用コピー、公式Inspect照合結果を保管。
元画像・生成情報・検証用バックアップは配布ZIPには同梱しません。
