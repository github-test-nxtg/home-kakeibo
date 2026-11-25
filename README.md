# マイ家計簿

React + TypeScript + Vite の家計簿アプリです。データはブラウザの localStorage にのみ保存され、外部へ送信しません。

## 使い方
```bash
npm install
npm run dev      # 開発サーバー
npm run build    # 型チェック + dist/ にビルド
npm run preview  # ビルド結果の確認
```

## データについて
- 保存先は localStorage(キー: `kakeibo:v1`)。git には含まれません。
- ブラウザのデータ消去で消えるため、画面の「バックアップ作成」で定期的にJSONを保存してください。

## 今後の予定
- CSVの取り込み・書き出し(プレビュー、不正データ検出、重複チェック)
- 月別の予算達成履歴
- `src/App.tsx` を types / storage / charts に分割
