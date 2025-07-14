# LINE WORKS Bot通知機能 セットアップガイド

## 概要

このシステムでは、拠点ごとに別のユーザーにLINE WORKS Botから通知を送信する機能を実装しています。新しい注文が作成されると、該当する拠点の担当者に自動的に通知が送信されます。

## 実装内容

### 1. データベース変更
- `Locations`テーブルに`lineworksUserId`カラムを追加
- 拠点ごとのLINE WORKS通知先ユーザーIDを管理

### 2. バックエンド機能
- LINE WORKS API連携機能（`server/src/utils/lineworks.js`）
- 拠点ごとの通知送信機能
- 注文作成時の自動通知機能
- テスト通知機能

### 3. フロントエンド機能
- 拠点管理画面にLINE WORKSユーザーID設定
- テスト通知送信ボタン
- 通知設定の管理機能

## セットアップ手順

### 1. LINE WORKS Developer Consoleでの設定

1. [LINE WORKS Developer Console](https://dev.worksmobile.com/jp/)にアクセス
2. 新しいBotアプリケーションを作成
3. 以下の情報を取得：
   - Bot ID
   - Bot Secret
   - Client ID
   - Client Secret
   - Service Account
   - Private Key

### 2. 環境変数の設定

`server/.env`ファイルを作成し、以下の設定を追加：

```env
# LINE WORKS Bot設定
LW_API_BOT_ID=your-bot-id
LW_API_BOT_SECRET=your-bot-secret
LW_API_CLIENT_ID=your-client-id
LW_API_CLIENT_SECRET=your-client-secret
LW_API_SERVICE_ACCOUNT=your-service-account@your-domain
LW_API_PRIVATEKEY="-----BEGIN PRIVATE KEY-----
your-private-key-here
-----END PRIVATE KEY-----"
```

### 3. データベースマイグレーション

```bash
cd server
npm run db:migrate
```

### 4. 依存関係のインストール

```bash
cd server
npm install
```

### 5. 拠点設定

1. 管理者アカウントでログイン
2. 「アカウント管理」→「拠点管理」タブに移動
3. 各拠点の編集画面で「LINE WORKSユーザーID」を設定
4. 設定後、通知アイコンをクリックしてテスト通知を送信

## 機能詳細

### 自動通知
- 新しい注文が作成されると、該当拠点の担当者に自動通知
- 通知内容：
  - 拠点名
  - 顧客名
  - 車両情報
  - 注文日
  - ステータス

### テスト通知
- 拠点管理画面から手動でテスト通知を送信可能
- 通知設定の確認に使用

### エラーハンドリング
- LINE WORKS設定が不完全な場合は通知をスキップ
- 通知送信エラーが発生しても注文作成は継続
- 詳細なエラーログを出力

## 注意事項

1. **LINE WORKSユーザーIDの取得**
   - LINE WORKSで通知を受け取るユーザーのユーザーIDを事前に取得
   - Botが該当ユーザーにメッセージを送信する権限が必要

2. **セキュリティ**
   - 環境変数は適切に管理し、Gitにコミットしない
   - Private Keyは安全に保管

3. **レート制限**
   - LINE WORKS APIにはレート制限があるため、大量の通知送信には注意

## トラブルシューティング

### 通知が送信されない場合
1. 環境変数が正しく設定されているか確認
2. LINE WORKSユーザーIDが正しく設定されているか確認
3. Botが該当ユーザーにメッセージを送信する権限があるか確認
4. サーバーログでエラーメッセージを確認

### テスト通知が失敗する場合
1. LINE WORKS Developer ConsoleでBotの設定を確認
2. ネットワーク接続を確認
3. 環境変数の値を再確認

## API エンドポイント

### 拠点関連
- `GET /api/locations` - 拠点一覧取得
- `POST /api/locations` - 拠点作成
- `PUT /api/locations/:id` - 拠点更新
- `DELETE /api/locations/:id` - 拠点削除
- `POST /api/locations/:id/test-notification` - テスト通知送信

## ファイル構成

```
server/
├── src/
│   ├── models/
│   │   ├── Location.js (更新)
│   │   └── Order.js (更新)
│   ├── routes/
│   │   └── locations.js (更新)
│   ├── utils/
│   │   └── lineworks.js (新規)
│   └── migrations/
│       └── 20241201000000-add-lineworks-userid-to-locations.js (新規)
├── package.json (更新)
└── env.example (新規)

client/
├── src/
│   ├── pages/
│   │   └── AccountManagement.js (更新)
│   └── utils/
│       └── api.js (更新)
``` 