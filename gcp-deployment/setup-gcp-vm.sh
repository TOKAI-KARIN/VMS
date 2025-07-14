#!/bin/bash

# GCP VM セットアップスクリプト
# 実行前に以下の設定を変更してください：
# - DOMAIN_NAME: あなたのドメイン名
# - DB_PASSWORD: データベースパスワード
# - GITHUB_REPO: GitHubリポジトリのURL

set -e

# 設定変数
DOMAIN_NAME="your-domain.com"
DB_PASSWORD="your-secure-password"
GITHUB_REPO="https://github.com/yourusername/vehicle-management.git"

echo "🚀 GCP VM セットアップを開始します..."

# システムの更新
echo "📦 システムパッケージを更新中..."
sudo apt update && sudo apt upgrade -y

# 必要なパッケージのインストール
echo "📦 必要なパッケージをインストール中..."
sudo apt install -y curl wget git nginx postgresql postgresql-contrib certbot python3-certbot-nginx

# Node.js 18.x のインストール
echo "📦 Node.js 18.x をインストール中..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 のインストール
echo "📦 PM2 をインストール中..."
sudo npm install -g pm2

# PostgreSQL の設定
echo "🗄️ PostgreSQL を設定中..."
sudo -u postgres psql -c "CREATE DATABASE vehicle_management;"
sudo -u postgres psql -c "CREATE USER vehicle_user WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE vehicle_management TO vehicle_user;"
sudo -u postgres psql -c "ALTER USER vehicle_user CREATEDB;"

# アプリケーションディレクトリの作成
echo "📁 アプリケーションディレクトリを作成中..."
sudo mkdir -p /var/www/vehicle-management
sudo chown $USER:$USER /var/www/vehicle-management

# ログディレクトリの作成
echo "📁 ログディレクトリを作成中..."
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# アプリケーションのクローン
echo "📥 アプリケーションをクローン中..."
cd /var/www/vehicle-management
git clone $GITHUB_REPO .

# 依存関係のインストール
echo "📦 依存関係をインストール中..."
cd client && npm install && npm run build
cd ../server && npm install

# 環境変数ファイルの作成
echo "⚙️ 環境変数ファイルを作成中..."
cat > /var/www/vehicle-management/server/.env << EOF
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vehicle_management
DB_USER=vehicle_user
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=your-jwt-secret-key-here
EOF

# Nginx設定ファイルのコピー
echo "⚙️ Nginx設定をコピー中..."
sudo cp /var/www/vehicle-management/gcp-deployment/nginx.conf /etc/nginx/sites-available/vehicle-management
sudo sed -i "s/your-domain.com/$DOMAIN_NAME/g" /etc/nginx/sites-available/vehicle-management
sudo ln -sf /etc/nginx/sites-available/vehicle-management /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Nginx設定のテストと再起動
echo "🔄 Nginx設定をテスト中..."
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# ファイアウォールの設定
echo "🔥 ファイアウォールを設定中..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# SSL証明書の取得
echo "🔒 SSL証明書を取得中..."
sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email your-email@example.com

# PM2設定ファイルのコピー
echo "⚙️ PM2設定をコピー中..."
cp /var/www/vehicle-management/gcp-deployment/ecosystem.config.js /var/www/vehicle-management/
sed -i "s/your-domain.com/$DOMAIN_NAME/g" /var/www/vehicle-management/ecosystem.config.js
sed -i "s/your-db-password/$DB_PASSWORD/g" /var/www/vehicle-management/ecosystem.config.js

# アプリケーションの起動
echo "🚀 アプリケーションを起動中..."
cd /var/www/vehicle-management
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# データベースの初期化
echo "🗄️ データベースを初期化中..."
cd server
npm run init-db

echo "✅ セットアップが完了しました！"
echo "🌐 アプリケーションURL: https://$DOMAIN_NAME"
echo "📊 PM2ステータス: pm2 status"
echo "📝 ログ確認: pm2 logs"
echo "🔄 アプリケーション再起動: pm2 restart all" 