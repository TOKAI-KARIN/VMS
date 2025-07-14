# Ubuntu Desktopでのデプロイ手順

## 概要
このガイドでは、Ubuntu Desktop環境での車両管理システムのデプロイ方法を説明します。
Ubuntu DesktopはGUI環境があるため、Ubuntu Serverよりも直感的な操作が可能です。

## 前提条件
- Ubuntu Desktop 20.04 LTS以上
- sudo権限を持つユーザー
- インターネット接続
- ドメイン名（オプション、ローカル開発の場合は不要）

## 1. システムの準備

### 1.1 システムアップデート
```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2 必要なパッケージのインストール
```bash
# 基本的な開発ツール
sudo apt install -y curl git wget unzip

# Webサーバーとデータベース
sudo apt install -y nginx postgresql postgresql-contrib

# 開発用ツール（オプション）
sudo apt install -y build-essential
```

### 1.3 Node.jsのインストール
```bash
# NodeSourceリポジトリの追加
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Node.jsとnpmのインストール
sudo apt install -y nodejs

# バージョン確認
node --version
npm --version
```

## 2. PostgreSQLの設定

### 2.1 PostgreSQLサービスの起動
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2.2 データベースとユーザーの作成
```bash
# PostgreSQLにpostgresユーザーでログイン
sudo -u postgres psql

# データベースの作成
CREATE DATABASE vehicle_management;

# ユーザーの作成（パスワードは適切に変更してください）
CREATE USER vehicle_user WITH ENCRYPTED PASSWORD 'your_secure_password';

# 権限の付与
GRANT ALL PRIVILEGES ON DATABASE vehicle_management TO vehicle_user;

# PostgreSQLから抜ける
\q
```

### 2.3 PostgreSQLの設定確認
```bash
# サービスステータスの確認
sudo systemctl status postgresql

# 接続テスト
psql -h localhost -U vehicle_user -d vehicle_management
```

## 3. アプリケーションのデプロイ

### 3.1 アプリケーションのクローン
```bash
# アプリケーションディレクトリの作成
sudo mkdir -p /var/www
cd /var/www

# リポジトリのクローン（GitHubのURLに置き換えてください）
sudo git clone https://github.com/your-username/vehicle-management.git
sudo chown -R $USER:$USER vehicle-management
cd vehicle-management
```

### 3.2 環境変数の設定

#### サーバー側の環境変数
```bash
cd server
cp env.example .env
nano .env
```

`.env`ファイルに以下の内容を設定：
```env
# データベース設定
DB_HOST=localhost
DB_NAME=vehicle_management
DB_USER=vehicle_user
DB_PASSWORD=your_secure_password
DB_PORT=5432

# JWT設定
JWT_SECRET=your_very_secure_jwt_secret_key

# サーバー設定
PORT=3001
NODE_ENV=production

# LINE WORKS設定（必要に応じて）
LINEWORKS_BOT_TOKEN=your_lineworks_bot_token
LINEWORKS_CHANNEL_ID=your_lineworks_channel_id
```

### 3.3 依存関係のインストール

#### サーバー側
```bash
cd server
npm install
```

#### クライアント側
```bash
cd ../client
npm install
npm run build
```

## 4. SSL証明書の設定

### 4.1 自己署名証明書の生成（開発用）
```bash
cd server
mkdir -p certs
cd certs

# 秘密鍵の生成
openssl genrsa -out private.key 2048

# 証明書の生成
openssl req -new -x509 -key private.key -out certificate.crt -days 365 -subj "/C=JP/ST=Tokyo/L=Tokyo/O=VehicleManagement/CN=localhost"
```

### 4.2 Let's Encrypt証明書の取得（本番用）
```bash
# Certbotのインストール
sudo apt install -y certbot python3-certbot-nginx

# 証明書の取得（ドメインがある場合）
sudo certbot --nginx -d your-domain.com
```

## 5. Nginxの設定

### 5.1 Nginx設定ファイルの作成
```bash
sudo nano /etc/nginx/sites-available/vehicle-management
```

以下の内容を追加：
```nginx
# HTTPからHTTPSへのリダイレクト
server {
    listen 80;
    server_name localhost your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS設定
server {
    listen 443 ssl;
    server_name localhost your-domain.com;

    # SSL証明書の設定
    ssl_certificate /var/www/vehicle-management/server/certs/certificate.crt;
    ssl_certificate_key /var/www/vehicle-management/server/certs/private.key;
    
    # セキュリティ設定
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # フロントエンド（Reactアプリ）
    location / {
        root /var/www/vehicle-management/client/build;
        try_files $uri $uri/ /index.html;
        
        # キャッシュ設定
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # バックエンドAPI
    location /api/ {
        proxy_pass https://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # セキュリティヘッダー
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### 5.2 Nginx設定の有効化
```bash
# デフォルトサイトの無効化
sudo rm /etc/nginx/sites-enabled/default

# 新しい設定の有効化
sudo ln -s /etc/nginx/sites-available/vehicle-management /etc/nginx/sites-enabled/

# 設定のテスト
sudo nginx -t

# Nginxの再起動
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 6. PM2のインストールと設定

### 6.1 PM2のインストール
```bash
sudo npm install -g pm2
```

### 6.2 アプリケーションの起動
```bash
cd /var/www/vehicle-management/server
pm2 start index.js --name "vehicle-management-server"
pm2 save
pm2 startup
```

### 6.3 PM2の管理コマンド
```bash
# アプリケーションの状態確認
pm2 status

# ログの確認
pm2 logs vehicle-management-server

# アプリケーションの再起動
pm2 restart vehicle-management-server

# アプリケーションの停止
pm2 stop vehicle-management-server
```

## 7. ファイアウォールの設定

### 7.1 UFWの設定
```bash
# UFWの有効化
sudo ufw enable

# 必要なポートの開放
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS

# ファイアウォールの状態確認
sudo ufw status
```

## 8. 動作確認

### 8.1 サービスステータスの確認
```bash
# PostgreSQL
sudo systemctl status postgresql

# Nginx
sudo systemctl status nginx

# PM2
pm2 status
```

### 8.2 ブラウザでのアクセス確認
- フロントエンド: `https://localhost` または `https://your-domain.com`
- バックエンドAPI: `https://localhost/api` または `https://your-domain.com/api`

### 8.3 ログの確認
```bash
# Nginxのログ
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# アプリケーションのログ
pm2 logs vehicle-management-server
```

## 9. メンテナンスと更新

### 9.1 アプリケーションの更新
```bash
cd /var/www/vehicle-management

# 最新コードの取得
git pull

# サーバー側の更新
cd server
npm install
pm2 restart vehicle-management-server

# クライアント側の更新
cd ../client
npm install
npm run build
```

### 9.2 データベースのバックアップ
```bash
# バックアップの作成
pg_dump -h localhost -U vehicle_user vehicle_management > backup_$(date +%Y%m%d_%H%M%S).sql

# バックアップの復元
psql -h localhost -U vehicle_user vehicle_management < backup_file.sql
```

### 9.3 システムの監視
```bash
# ディスク使用量の確認
df -h

# メモリ使用量の確認
free -h

# プロセス確認
htop
```

## 10. トラブルシューティング

### 10.1 よくある問題と解決方法

#### Nginx 502 Bad Gateway
```bash
# バックエンドサーバーの状態確認
pm2 status

# ポートの確認
sudo netstat -tlnp | grep :3001

# ログの確認
pm2 logs vehicle-management-server
```

#### データベース接続エラー
```bash
# PostgreSQLの状態確認
sudo systemctl status postgresql

# 接続テスト
psql -h localhost -U vehicle_user -d vehicle_management

# 環境変数の確認
cat /var/www/vehicle-management/server/.env
```

#### SSL証明書の問題
```bash
# 証明書の確認
openssl x509 -in /var/www/vehicle-management/server/certs/certificate.crt -text -noout

# Nginx設定のテスト
sudo nginx -t
```

### 10.2 ログファイルの場所
- Nginx: `/var/log/nginx/`
- PostgreSQL: `/var/log/postgresql/`
- PM2: `~/.pm2/logs/`
- システム: `/var/log/syslog`

## 11. セキュリティ強化

### 11.1 定期的なセキュリティアップデート
```bash
# システムアップデート
sudo apt update && sudo apt upgrade -y

# セキュリティアップデートのみ
sudo apt update && sudo apt upgrade -y --only-upgrade
```

### 11.2 ファイアウォールの監視
```bash
# ファイアウォールのログ確認
sudo ufw status verbose
```

### 11.3 ログの監視
```bash
# リアルタイムログ監視
sudo tail -f /var/log/nginx/access.log | grep -v "health"
```

## 12. パフォーマンス最適化

### 12.1 Nginxの最適化
```bash
# Nginx設定の最適化
sudo nano /etc/nginx/nginx.conf
```

### 12.2 データベースの最適化
```bash
# PostgreSQL設定の最適化
sudo nano /etc/postgresql/*/main/postgresql.conf
```

## まとめ

Ubuntu Desktopでのデプロイは、GUI環境があるため以下の利点があります：

1. **直感的な操作**: ファイルマネージャーやテキストエディタが使いやすい
2. **視覚的な確認**: ログや設定ファイルをGUIで確認可能
3. **簡単なトラブルシューティング**: システムモニタリングツールが利用可能
4. **開発環境との統一**: 開発時と同じ環境で運用可能

このガイドに従って設定すれば、Ubuntu Desktopでも安定した運用が可能です。 