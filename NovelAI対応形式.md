# NovelAI対応形式｜v0.9.2

## 対応
PNG: tEXt、zTXt、iTXt。非インターレース8bit RGBAのアルファ埋め込みstealth_pngcomp/stealth_pnginfo。
WebP: RIFFのEXIF UserCommentとアルファ埋め込みstealth_pngcomp/stealth_pnginfo。
EXIF: II/MM TIFF、Exif識別子あり/なし、Exif IFD/SubIFD/next IFD、UserComment 0x9286、ASCII/UTF-8、Unicode UTF-16LE/BE系、JSONと入れ子Comment。
Source・Description・Title・Artist・Copyrightも存在すれば保持します。
既存EXIFから取得できないWebPはアルファ領域も確認します。WebPのアルファ解析は原寸デコードを利用し、画像軽量化の前に行います。

## 保持
PROMPT・UCの原文、V4/V5キャラクター別PROMPT/UCと位置情報、モデル・寸法・Seed・Steps・Sampler・Guidance・Rescale・UC強度。
存在するmodel_name/model_hash/noise_scheduleを内部の生成設定にも保持します。未知のパラメーターを含む取得元JSONも未加工で保存。
アーティスト欄へ本文を自動分類しません。未取得項目に推測値を入れません。
反映前に既存入力がある場合は確認します。画像だけ登録することや、解析できない画像への手入力も可能です。

## 結果
情報なし、未対応形式、破損やJSON解析失敗を区別します。
UserCommentがないことだけでは「生成情報なし」にしません。
元画像で取得に失敗した理由は、保存前の取得ボタンでも維持します。

## 制限
元ファイル20MB、展開情報8MB、アルファ解析2400万画素を上限とします。
WebPアルファ解析はcreateImageBitmapとCanvas系APIを利用できるブラウザが必要です。利用できない場合は未対応として案内します。
アニメーションWebPのアルファ埋め込み、XMPのみのWebP、PNGのRGB埋め込み・16bit・パレット・インターレース隠し情報、署名検証・FEC修復は未対応。
全世代・全保存形式への完全対応を保証するものではありません。
前版で軽量化した画像しか残っていない場合、消去された情報は復元できません。元画像を選び直してください。

## 参照
https://github.com/NovelAI/novelai-image-metadata/blob/main/nai_meta.py
https://github.com/NovelAI/novelai-image-metadata/blob/main/nai_sig.py
https://novelai.net/inspect
https://developers.google.com/speed/webp/docs/riff_container
