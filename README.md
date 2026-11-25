# マイ家計簿

React + TypeScript + Vite の家計簿アプリです。データはブラウザの localStorage にのみ保存され、外部へ送信しません。

## 使い方
```bash
npm install
npm run dev      # 開発サーバー
npm run build    # 型チェック + dist/ にビルド
npm run preview  # ビルド結果の確認
```

## GitHub Pagesで自動公開
1. リポジトリの Settings → Pages → Source を「GitHub Actions」にする
2. `main` に変更をコミットすると、自動でビルド・公開される(進行状況は Actions タブ)
3. 公開URL: `https://<ユーザー名>.github.io/<リポジトリ名>/`

※ PrivateリポジトリでPagesが使えるかはプランによります。公開サイトは誰でも開けますが、家計データはコードに含まれず各自のブラウザ内にのみ保存されます。

## データについて
- 保存先は localStorage(キー: `kakeibo:v1`)。git には含まれません。
- ブラウザのデータ消去で消えるため、画面の「バックアップ作成」で定期的にJSONを保存してください。

## 今後の予定
- CSVの取り込み・書き出し(プレビュー、不正データ検出、重複チェック)
- 月別の予算達成履歴
- `src/App.tsx` を types / storage / charts に分割
