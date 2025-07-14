# 車両情報管理システム

## プロジェクト概要
このプロジェクトは、車両情報を管理するためのWebアプリケーションです。フロントエンドとバックエンドが分離された構成となっています。

## 技術スタック

### フロントエンド (client/)
- **フレームワーク**: React 18
- **言語**: JavaScript
- **UIライブラリ**: Material-UI (MUI)
- **主要ライブラリ**:
  - react-router-dom: ルーティング
  - axios: HTTPクライアント
  - html5-qrcode: QRコードスキャン機能（カメラ制御とQRコード読み取り）
  - @emotion/react: CSS-in-JSライブラリ
  - @emotion/styled: スタイルドコンポーネント
  - @mui/icons-material: Material-UIアイコン
  - http-proxy-middleware: 開発時のプロキシ設定

### バックエンド (server/)
- **ランタイム**: Node.js
- **フレームワーク**: Express.js
- **データベース**: PostgreSQL
- **ORM**: Sequelize
- **主要ライブラリ**:
  - bcryptjs: パスワードハッシュ化
  - jsonwebtoken: JWT認証
  - cors: CORS設定
  - helmet: セキュリティヘッダー
  - morgan: ロギング
  - multer: ファイルアップロード
  - pg: PostgreSQLドライバー
  - dotenv: 環境変数管理
  - crypto: 暗号化機能

## ライセンス情報

### フロントエンド
- **React**: MIT License
- **Material-UI**: MIT License
- **html5-qrcode**: Apache License 2.0
- **axios**: MIT License
- **react-router-dom**: MIT License
- **@emotion/react**: MIT License
- **@emotion/styled**: MIT License
- **react-scripts**: MIT License
- **web-vitals**: Apache License 2.0

### バックエンド
- **Express**: MIT License
- **Sequelize**: MIT License
- **bcryptjs**: MIT License
- **jsonwebtoken**: MIT License
- **cors**: MIT License
- **helmet**: MIT License
- **morgan**: MIT License
- **pg (PostgreSQL)**: MIT License
- **dotenv**: MIT License
- **multer**: MIT License
- **node-forge**: BSD-3-Clause License

## プロジェクト構造
```
.
├── client/                 # フロントエンド
│   ├── src/               # ソースコード
│   │   ├── components/    # Reactコンポーネント
│   │   │   └── PWAInstallButton.js  # PWAインストールボタン
│   │   ├── pages/         # ページコンポーネント
│   │   │   ├── AccountManagement.js # アカウント管理
│   │   │   ├── ChangePassword.js    # パスワード変更
│   │   │   ├── Dashboard.js         # ダッシュボード
│   │   │   ├── History.js           # 履歴表示
│   │   │   ├── Login.js             # ログイン
│   │   │   ├── OrderConfirm.js      # 注文確認
│   │   │   ├── OrderDetail.js       # 注文詳細
│   │   │   ├── OrderForm.js         # 注文フォーム
│   │   │   ├── QRScanner.js         # QRスキャナー
│   │   │   ├── VehicleDetail.js     # 車両詳細
│   │   │   └── VehicleList.js       # 車両一覧
│   │   ├── context/       # React Context
│   │   │   └── AuthContext.js       # 認証コンテキスト
│   │   ├── utils/         # ユーティリティ関数
│   │   │   ├── api.js               # API通信
│   │   │   └── serviceWorker.js     # サービスワーカー
│   │   ├── App.js                   # メインアプリケーション
│   │   ├── config.js                # 設定ファイル
│   │   ├── index.js                 # エントリーポイント
│   │   └── setupProxy.js            # プロキシ設定
│   ├── public/            # 静的ファイル
│   │   ├── create-png-icons.js      # PNGアイコン生成
│   │   ├── generate-icons.js        # アイコン生成
│   │   ├── index.html               # HTMLテンプレート
│   │   ├── logo192.png              # ロゴ画像
│   │   ├── logo192.svg              # ロゴSVG
│   │   ├── logo512.png              # ロゴ画像
│   │   ├── logo512.svg              # ロゴSVG
│   │   ├── manifest.json            # PWAマニフェスト
│   │   └── sw.js                    # サービスワーカー
│   ├── package.json       # フロントエンド依存関係
│   └── package-lock.json  # 依存関係ロックファイル
│
├── server/                # バックエンド
│   ├── src/              # ソースコード
│   │   ├── config/       # データベース設定
│   │   │   ├── database.js          # データベース接続設定
│   │   │   └── init-db.js           # データベース初期化
│   │   ├── middleware/   # Expressミドルウェア
│   │   │   ├── auth.js              # 認証ミドルウェア
│   │   │   └── authorize.js         # 認可ミドルウェア
│   │   ├── models/       # Sequelizeモデル
│   │   │   ├── Customer.js          # 顧客モデル
│   │   │   ├── index.js             # モデルインデックス
│   │   │   ├── Location.js          # ロケーションモデル
│   │   │   ├── Order.js             # 注文モデル
│   │   │   ├── User.js              # ユーザーモデル
│   │   │   └── Vehicle.js           # 車両モデル
│   │   ├── routes/       # APIルート
│   │   │   ├── auth.js              # 認証ルート
│   │   │   ├── customers.js         # 顧客ルート
│   │   │   ├── lineworks.js         # LINE WORKS通知ルート
│   │   │   ├── locations.js         # ロケーションルート
│   │   │   ├── orders.js            # 注文ルート
│   │   │   ├── stats.js             # 統計ルート
│   │   │   ├── users.js             # ユーザールート
│   │   │   └── vehicles.js          # 車両ルート
│   │   ├── migrations/   # データベースマイグレーション
│   │   │   ├── 20240616_add_display_name_to_users.js
│   │   │   ├── 20240616_add_is_active_to_users.js
│   │   │   ├── 20240616_create_users.js
│   │   │   ├── 20240726100000-change-employee-role.js
│   │   │   ├── 20240726200000-add-status-to-orders.js
│   │   │   ├── 20241201_add_attached_photos_to_orders.js
│   │   │   ├── 20241201000000-add-store-manager-role.js
│   │   │   └── 20241211000000-add-order-number-to-orders.js
│   │   ├── seeders/      # データベースシード
│   │   │   └── 20240320000000-admin-user.js  # 管理者ユーザーシード
│   │   └── utils/        # ユーティリティ
│   │       └── lineworks.js         # LINE WORKS通知機能
│   ├── certs/            # SSL証明書
│   │   └── generate-cert.bat        # 証明書生成バッチファイル
│   ├── uploads/          # アップロードファイル
│   │   ├── 1752201355849-103346732.jpg
│   │   ├── 1752201355853-691236761.jpg
│   │   ├── 1752201679959-434715592.jpg
│   │   ├── 1752202543966-652519362.jpg
│   │   ├── 1752207263168-606686559.jpg
│   │   └── 1752212278697-560215404.jpg
│   ├── env.example       # 環境変数テンプレート
│   ├── generate-cert.js  # 証明書生成スクリプト
│   ├── index.js          # サーバーエントリーポイント
│   ├── package.json      # バックエンド依存関係
│   ├── package-lock.json # 依存関係ロックファイル
│   └── update-order-numbers.js      # 注文番号更新スクリプト
│
├── package.json          # ルート依存関係とスクリプト
├── package-lock.json     # ルート依存関係ロックファイル
├── README.md             # プロジェクト説明書
├── DEPLOY.md             # デプロイ手順書
├── DEPLOY_UBUNTU_DESKTOP.md  # Ubuntuデスクトップデプロイ手順
└── LINE_WORKS_NOTIFICATION_SETUP.md  # LINE WORKS通知設定手順
```

## 開発環境のセットアップ

### 1. 前提条件
- Node.js 18.x以上
- PostgreSQL 12以上
- Git

### 2. 依存関係のインストール
```bash
# 全依存関係を一度にインストール
npm run install:all
```

### 3. 環境変数の設定

#### サーバー側の環境変数
```bash
cd server
cp env.example .env
```

`.env`ファイルを編集して以下の内容を設定：
```env
# データベース設定
DB_HOST=localhost
DB_NAME=vehicle_management
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_PORT=5432

# JWT設定
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random
JWT_EXPIRES_IN=24h

# サーバー設定
PORT=3001
NODE_ENV=development

# ファイルアップロード設定
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# LINE WORKS設定（オプション）
LINEWORKS_BOT_TOKEN=your_lineworks_bot_token
LINEWORKS_CHANNEL_ID=your_lineworks_channel_id
```

### 4. データベースの初期化
```bash
# データベースの初期化
npm run db:init

# マイグレーションの実行
npm run db:migrate
```

### 5. 開発サーバーの起動
```bash
# フロントエンドとバックエンドを同時に起動
npm run dev
```

または個別に起動：
```bash
# バックエンドのみ
npm run dev:server

# フロントエンドのみ
npm run dev:client
```

## 利用可能なスクリプト

### ルートディレクトリ
- `npm run dev` - フロントエンドとバックエンドを同時に起動
- `npm run dev:server` - バックエンドのみ起動
- `npm run dev:client` - フロントエンドのみ起動
- `npm run install:all` - 全依存関係をインストール
- `npm run build` - フロントエンドをビルド
- `npm run start:server` - 本番用サーバーを起動
- `npm run db:init` - データベースを初期化
- `npm run db:migrate` - データベースマイグレーションを実行

### フロントエンド (client/)
- `npm start` - 開発サーバーを起動（ポート3000）
- `npm run build` - 本番用ビルド
- `npm test` - テストを実行
- `npm run eject` - Create React Appの設定を展開

### バックエンド (server/)
- `npm start` - 本番用サーバーを起動
- `npm run dev` - 開発サーバーを起動（nodemon、ポート3001）
- `npm run init-db` - データベースを初期化
- `npm run db:migrate` - マイグレーションを実行
- `npm run db:migrate:undo` - マイグレーションをロールバック

## 主要機能

### 認証・認可機能
- JWTベースのユーザー認証
- ロールベースのアクセス制御
- パスワード変更機能
- セッション管理

### 車両管理機能
- 車両情報の登録・編集・削除
- 車両一覧表示
- 車両詳細表示
- QRコードによる車両情報のスキャン
- 車両検索・フィルタリング

### 注文管理機能
- 注文の作成・編集・削除
- 注文状況の追跡
- 注文履歴の表示
- 注文番号の自動生成
- 写真添付機能

### 顧客管理機能
- 顧客情報の登録・編集・削除
- 顧客一覧表示
- 顧客検索・フィルタリング

### ロケーション管理機能
- ロケーション情報の管理
- ロケーション別の車両・注文管理

### 統計・レポート機能
- ダッシュボード表示
- 各種統計情報の表示
- データの可視化

### 通知機能
- LINE WORKS連携による通知
- 注文状況の自動通知

### PWA機能
- オフライン対応
- ホーム画面への追加
- プッシュ通知

## セキュリティ機能
- JWTによる認証
- パスワードのハッシュ化（bcryptjs）
- HTTPS通信
- Helmetによるセキュリティヘッダー
- CORS設定
- ファイルアップロードのセキュリティ
- SQLインジェクション対策（Sequelize）
- XSS対策
- CSRF対策

## アクセスURL
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:3001
- APIドキュメント: http://localhost:3001/api

## API エンドポイント

### 認証
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/me` - 現在のユーザー情報取得

### ユーザー管理
- `GET /api/users` - ユーザー一覧取得
- `POST /api/users` - ユーザー作成
- `PUT /api/users/:id` - ユーザー更新
- `DELETE /api/users/:id` - ユーザー削除
- `PUT /api/users/:id/password` - パスワード変更

### 車両管理
- `GET /api/vehicles` - 車両一覧取得
- `POST /api/vehicles` - 車両作成
- `GET /api/vehicles/:id` - 車両詳細取得
- `PUT /api/vehicles/:id` - 車両更新
- `DELETE /api/vehicles/:id` - 車両削除

### 注文管理
- `GET /api/orders` - 注文一覧取得
- `POST /api/orders` - 注文作成
- `GET /api/orders/:id` - 注文詳細取得
- `PUT /api/orders/:id` - 注文更新
- `DELETE /api/orders/:id` - 注文削除

### 顧客管理
- `GET /api/customers` - 顧客一覧取得
- `POST /api/customers` - 顧客作成
- `GET /api/customers/:id` - 顧客詳細取得
- `PUT /api/customers/:id` - 顧客更新
- `DELETE /api/customers/:id` - 顧客削除

### ロケーション管理
- `GET /api/locations` - ロケーション一覧取得
- `POST /api/locations` - ロケーション作成
- `GET /api/locations/:id` - ロケーション詳細取得
- `PUT /api/locations/:id` - ロケーション更新
- `DELETE /api/locations/:id` - ロケーション削除

### 統計情報
- `GET /api/stats/dashboard` - ダッシュボード統計
- `GET /api/stats/orders` - 注文統計
- `GET /api/stats/vehicles` - 車両統計

## データベーススキーマ

### Users テーブル
- id (Primary Key)
- username (Unique)
- email (Unique)
- password_hash
- display_name
- role (admin, store_manager, employee)
- is_active
- created_at
- updated_at

### Vehicles テーブル
- id (Primary Key)
- name
- description
- qr_code (Unique)
- status
- location_id (Foreign Key)
- created_at
- updated_at

### Orders テーブル
- id (Primary Key)
- order_number (Unique)
- customer_id (Foreign Key)
- vehicle_id (Foreign Key)
- status
- order_date
- delivery_date
- attached_photos
- created_at
- updated_at

### Customers テーブル
- id (Primary Key)
- name
- email
- phone
- address
- created_at
- updated_at

### Locations テーブル
- id (Primary Key)
- name
- address
- created_at
- updated_at

## トラブルシューティング

### よくある問題

1. **npm run devでエラーが発生する場合**
   ```bash
   # 依存関係を再インストール
   npm run install:all
   
   # 各ディレクトリで個別にインストール
   cd server && npm install
   cd ../client && npm install
   ```

2. **データベース接続エラー**
   ```bash
   # PostgreSQLが起動しているか確認
   # Windows: サービスから確認
   # Mac/Linux: sudo systemctl status postgresql
   
   # .envファイルの設定を確認
   cat server/.env
   
   # データベースが作成されているか確認
   psql -U your_db_user -d vehicle_management -h localhost
   ```

3. **ポートが使用中エラー**
   ```bash
   # Windows
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   
   # Mac/Linux
   lsof -i :3000
   lsof -i :3001
   
   # プロセスを終了
   # Windows: taskkill /PID <PID> /F
   # Mac/Linux: kill -9 <PID>
   ```

4. **CORSエラー**
   - フロントエンドとバックエンドのポート設定を確認
   - サーバーのCORS設定を確認
   - ブラウザのキャッシュをクリア

5. **JWT認証エラー**
   - JWT_SECRETの設定を確認
   - トークンの有効期限を確認
   - ブラウザのローカルストレージをクリア

6. **ファイルアップロードエラー**
   ```bash
   # アップロードディレクトリの権限確認
   ls -la server/uploads
   
   # 権限の修正
   chmod 755 server/uploads
   ```

## 開発ガイドライン

### コードスタイル
- JavaScript: ESLint + Prettier
- インデント: 2スペース
- セミコロン: 必須
- クォート: シングルクォート

### コミットメッセージ
- feat: 新機能
- fix: バグ修正
- docs: ドキュメント更新
- style: コードスタイル修正
- refactor: リファクタリング
- test: テスト追加・修正
- chore: その他の変更

### ブランチ戦略
- main: 本番環境
- develop: 開発環境
- feature/*: 機能開発
- hotfix/*: 緊急修正

## ライセンス
このプロジェクトはMITライセンスの下で公開されています。