# オンプレミスサーバーセットアップガイド

このガイドでは、オンプレミスサーバーでアプリケーションを動作させるための設定を説明します。

## 📋 前提条件

1. **オンプレミスサーバー** - Linuxサーバー（Ubuntu 20.04推奨）
2. **固定IPアドレス** - オンプレミスサーバーの固定IP
3. **ポート開放** - 3000, 3001ポートの内部開放
4. **GCP踏み台サーバー** - リバースプロキシ用のGCP VM

## 🏗️ アーキテクチャ

```
インターネット
    ↓
GCP VM (踏み台サーバー)
    ↓ (リバースプロキシ)
オンプレミスサーバー
    ↓
React App (ポート3000) + Node.js API (ポート3001)
    ↓
PostgreSQL (データベース)
```

## 🚀 オンプレミスサーバーセットアップ

### 1. システムの準備

```bash
# システムの更新
sudo apt update && sudo apt upgrade -y

# 必要なパッケージのインストール
sudo apt install -y curl wget git postgresql postgresql-contrib nginx

# Node.js 18.x のインストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 のインストール
sudo npm install -g pm2
```

### 2. PostgreSQL の設定

```bash
# データベースとユーザーの作成
sudo -u postgres psql -c "CREATE DATABASE vehicle_management;"
sudo -u postgres psql -c "CREATE USER vehicle_user WITH PASSWORD 'your-secure-password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE vehicle_management TO vehicle_user;"
sudo -u postgres psql -c "ALTER USER vehicle_user CREATEDB;"

# PostgreSQL設定の変更（必要に応じて）
sudo nano /etc/postgresql/12/main/postgresql.conf
# listen_addresses = 'localhost'  # ローカルホストのみでアクセス

sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

### 3. アプリケーションのデプロイ

```bash
# アプリケーションディレクトリの作成
sudo mkdir -p /var/www/vehicle-management
sudo chown $USER:$USER /var/www/vehicle-management

# アプリケーションのクローン
cd /var/www/vehicle-management
git clone https://github.com/yourusername/vehicle-management.git .

# 依存関係のインストール
cd client && npm install && npm run build
cd ../server && npm install
```

### 4. 環境変数の設定

```bash
# サーバー環境変数ファイルの作成
cat > /var/www/vehicle-management/server/.env << EOF
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vehicle_management
DB_USER=vehicle_user
DB_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret-key-here
EOF
```

### 5. PM2設定ファイルの作成

```bash
cat > /var/www/vehicle-management/ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'vehicle-management-client',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/vehicle-management/client',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/client-error.log',
      out_file: '/var/log/pm2/client-out.log',
      log_file: '/var/log/pm2/client-combined.log',
      time: true
    },
    {
      name: 'vehicle-management-server',
      script: 'index.js',
      cwd: '/var/www/vehicle-management/server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_NAME: 'vehicle_management',
        DB_USER: 'vehicle_user',
        DB_PASSWORD: 'your-secure-password'
      },
      error_file: '/var/log/pm2/server-error.log',
      out_file: '/var/log/pm2/server-out.log',
      log_file: '/var/log/pm2/server-combined.log',
      time: true
    }
  ]
};
EOF
```

### 6. アプリケーションの起動

```bash
# ログディレクトリの作成
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# データベースの初期化
cd /var/www/vehicle-management/server
npm run init-db

# アプリケーションの起動
cd /var/www/vehicle-management
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 7. ファイアウォールの設定

```bash
# 必要なポートのみを開放
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3000/tcp  # React App
sudo ufw allow 3001/tcp  # Node.js API
sudo ufw --force enable
```

### 8. ヘルスチェックエンドポイントの追加

```bash
# サーバーのindex.jsにヘルスチェックエンドポイントを追加
echo "
// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});" >> /var/www/vehicle-management/server/index.js
```

## 🔧 GCP踏み台サーバーの設定

### 1. GCP VMの作成

```bash
# GCPコンソールまたはgcloud CLIでVMを作成
gcloud compute instances create bastion-server \
    --zone=asia-northeast1-a \
    --machine-type=e2-micro \
    --image-family=ubuntu-2004-lts \
    --image-project=ubuntu-os-cloud \
    --tags=http-server,https-server \
    --network-interface=network-tier=PREMIUM,subnet=default
```

### 2. 踏み台サーバーのセットアップ

```bash
# SSHでGCP VMに接続
gcloud compute ssh bastion-server

# 踏み台サーバーセットアップスクリプトを実行
wget https://raw.githubusercontent.com/yourusername/vehicle-management/main/gcp-deployment/setup-bastion-only.sh
chmod +x setup-bastion-only.sh

# 設定を編集
nano setup-bastion-only.sh
# DOMAIN_NAME="your-domain.com"
# ONPREMISE_IP="YOUR_ONPREMISE_IP"

# セットアップを実行
./setup-bastion-only.sh
```

## 🌐 DNS設定

ドメインプロバイダーで以下のDNSレコードを設定：

```
A レコード: your-domain.com → GCP VMの外部IP
A レコード: www.your-domain.com → GCP VMの外部IP
```

## 📊 監視とメンテナンス

### オンプレミスサーバーでの監視

```bash
# PM2ステータス確認
pm2 status

# ログ確認
pm2 logs

# システムリソース確認
htop
df -h
free -h

# データベース接続確認
sudo -u postgres psql -c "\l"
```

### 踏み台サーバーでの監視

```bash
# オンプレミスサーバーの監視ログ
tail -f /var/log/bastion/onpremise-monitor.log

# Nginxログ
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# SSL証明書の有効期限確認
sudo certbot certificates
```

## 🔄 デプロイ手順

### オンプレミスサーバーでのデプロイ

```bash
# 最新のコードを取得
cd /var/www/vehicle-management
git pull origin main

# クライアントのビルド
cd client && npm install && npm run build

# サーバーの依存関係をインストール
cd ../server && npm install

# アプリケーションの再起動
cd .. && pm2 restart all
```

## 🚨 トラブルシューティング

### よくある問題

1. **オンプレミスサーバーに接続できない**
   ```bash
   # ネットワーク接続確認
   ping YOUR_ONPREMISE_IP
   telnet YOUR_ONPREMISE_IP 3000
   telnet YOUR_ONPREMISE_IP 3001
   ```

2. **SSL証明書の更新エラー**
   ```bash
   # 踏み台サーバーで実行
   sudo certbot renew --dry-run
   ```

3. **データベース接続エラー**
   ```bash
   # オンプレミスサーバーで実行
   sudo systemctl status postgresql
   sudo -u postgres psql -c "\l"
   ```

## 💰 コスト最適化

### GCP踏み台サーバー
- **e2-micro**: 月額約$5-8
- **最小構成で十分**

### オンプレミスサーバー
- **既存のサーバーを活用**
- **追加コストなし**

## 🔒 セキュリティ考慮事項

1. **オンプレミスサーバー**
   - ファイアウォールで必要最小限のポートのみ開放
   - 強力なパスワードを使用
   - 定期的なセキュリティ更新

2. **踏み台サーバー**
   - SSL証明書による暗号化
   - セキュリティヘッダーの設定
   - アクセスログの監視

3. **ネットワーク**
   - VPN接続の検討
   - IP制限の設定
   - 侵入検知システムの導入 