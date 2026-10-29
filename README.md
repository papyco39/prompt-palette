# PROMPT PALETTE
v0.9.2 — 参考画像とプロンプト、キャラクター・衣装、NovelAI生成情報を端末内で管理するWebアプリです。

## 起動
このリポジトリをZIPでダウンロードして展開し、Windowsでは start.cmd を実行してください。
Node.jsまたはPython 3のいずれかを利用します。アプリ用の追加パッケージのインストールは不要です。
ブラウザで http://127.0.0.1:8765/ を開きます。

手動起動:
~~~
node start.cjs
~~~
または:
~~~
python start.py
~~~

index.htmlの直接起動では、ローカルサーバーが必要なPixAI URL取得機能を利用できません。

## 主な機能
- LIBRARY: 参考画像・分類済みプロンプト・タグ・フォルダ・画像付きMEMO。
- EDITOR: LIBRARYの内容を基にCHARACTER/CLOSETを差し替え、分類枠を編集・コピー。
- HISTORY/STOCK、比較、モデル・LoRA情報の管理。
- NAI PRESET: NovelAI画像の生成情報を取得し、PROMPT・UC・人物別情報・生成設定・生データを保存。
- NAI EDITOR: STYLEと人物別PROMPT/UCを編集し、PRESETと連携。
- IndexedDBへの保存、画像を含むJSONエクスポート・インポート。

## v0.9.2
WebPのEXIFにUserCommentがなく、アルファチャンネルに生成情報がある場合も読み取るよう修正しました。
PNGの既存解析、EXIF UserComment、保存形式と画面デザインは維持しています。
「情報なし」「未対応形式」「解析失敗」を区別し、失敗した画像も手動入力で保存できます。
詳しくは [CHANGELOG](CHANGELOG.md)、[対応形式](NovelAI対応形式.md)、[検証概要](TESTING.md) を参照してください。

## 保存データ
画像・プロンプトはブラウザのIndexedDBに保存されます。GitHubには保存されません。
ブラウザやホスト名・ポートが変わると別の保存領域になります。移行時はエクスポート・インポートをご利用ください。
以前の版で軽量化済みの画像から生成情報を取得できない場合は、元のPNG/WebPを選び直してください。

このリポジトリには個人の画像・登録データ・検証用バックアップを含めていません。
