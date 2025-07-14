# Ubuntuサーバーへのデプロイ手順

## 前提条件
- Ubuntu Server 20.04 LTS以上
- sudo権限を持つユーザー
- ドメイン名（オプション）
- 最低2GB RAM、20GB ストレージ

## 1. システムの準備

### システムの更新
```bash
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
```

### 必要なパッケージのインストール
```bash
sudo apt install -y curl git nginx postgresql postgresql-contrib build-essential
sudo apt install -y python3 python3-pip
sudo apt install -y htop tree unzip zip
```

### Node.jsのインストール
```bash
# NodeSourceリポジトリの追加
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Node.jsとnpmのインストール
sudo apt install -y nodejs

# バージョン確認
node --version
npm --version
```

### PostgreSQLの設定
```bash
# PostgreSQLサービスの開始
sudo systemctl start postgresql
sudo systemctl enable postgresql

# PostgreSQLの状態確認
sudo systemctl status postgresql

# PostgreSQLユーザーに切り替え
sudo -u postgres psql

# データベースとユーザーの作成
postgres=# CREATE DATABASE vehicle_management;
postgres=# CREATE USER vehicle_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
postgres=# GRANT ALL PRIVILEGES ON DATABASE vehicle_management TO vehicle_user;
postgres=# ALTER USER vehicle_user CREATEDB;
postgres=# \q

# PostgreSQLの設定ファイルを編集
sudo nano /etc/postgresql/*/main/postgresql.conf

# 以下の行を追加または変更
# listen_addresses = 'localhost'
# max_connections = 100
# shared_buffers = 128MB
# effective_cache_size = 512MB

# PostgreSQLの再起動
sudo systemctl restart postgresql
```

### ファイアウォールの設定
```bash
# UFWの有効化
sudo ufw enable

# 必要なポートの開放
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# ファイアウォールの状態確認
sudo ufw status verbose
```

## 2. アプリケーションのデプロイ

### アプリケーションの転送

#### 方法1: SCPを使用したファイル転送（推奨）

**Linux/Mac環境の場合:**
```bash
# ローカルマシンからサーバーへの転送
# ローカルマシンで実行（APPフォルダがある場所で）
scp -r ./APP user@your-server-ip:/tmp/

# サーバー側での処理
sudo mkdir -p /var/www
sudo mv /tmp/APP /var/www/vehicle-management
sudo chown -R $USER:$USER /var/www/vehicle-management
cd /var/www/vehicle-management

# 転送の確認
ls -la

# 重要なファイルの存在確認
echo "=== ファイル転送確認 ==="
ls -la client/
ls -la server/
ls -la package.json
echo "=== 確認完了 ==="

**Windows環境の場合:**
```bash
# PowerShellまたはコマンドプロンプトで実行
# APPフォルダがある場所で実行
scp -r .\APP\ user@your-server-ip:/tmp/

# または、WinSCPなどのGUIツールを使用
# 1. WinSCPをダウンロード・インストール
# 2. サーバーに接続
# 3. APPフォルダを/tmp/にドラッグ&ドロップ

# サーバー側での処理
sudo mkdir -p /var/www
sudo mv /tmp/APP /var/www/vehicle-management
sudo chown -R $USER:$USER /var/www/vehicle-management
cd /var/www/vehicle-management
```

#### 方法2: SFTPを使用したファイル転送
```bash
# SFTPでサーバーに接続
sftp user@your-server-ip

# SFTP内でのコマンド
sftp> mkdir /tmp/APP
sftp> put -r ./APP /tmp/
sftp> exit

# サーバー側での処理
sudo mkdir -p /var/www
sudo mv /tmp/APP /var/www/vehicle-management
sudo chown -R $USER:$USER /var/www/vehicle-management
cd /var/www/vehicle-management
```

#### 方法3: rsyncを使用したファイル転送（高速）
```bash
# rsyncを使用した転送（ローカルマシンで実行）
rsync -avz --progress ./APP/ user@your-server-ip:/var/www/vehicle-management/

# サーバー側での権限設定
sudo chown -R $USER:$USER /var/www/vehicle-management
cd /var/www/vehicle-management
```

#### 方法4: Gitリポジトリからのクローン（代替案）
```bash
# アプリケーションディレクトリの作成
sudo mkdir -p /var/www
cd /var/www

# リポジトリのクローン
sudo git clone <your-repository-url> vehicle-management

# 所有者の変更
sudo chown -R $USER:$USER vehicle-management
cd vehicle-management

# リポジトリの状態確認
git status
git log --oneline -5
```

### 依存関係のインストール
```bash
# 全依存関係を一度にインストール
npm run install:all

# インストールの確認
ls -la node_modules
ls -la server/node_modules
ls -la client/node_modules
```

### 環境変数の設定
```bash
# サーバー側の環境変数
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
DB_PASSWORD=your_secure_password_here
DB_PORT=5432

# JWT設定
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here_make_it_at_least_32_characters_long
JWT_EXPIRES_IN=24h

# サーバー設定
PORT=3001
NODE_ENV=production

# ファイルアップロード設定
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# LINE WORKS設定（オプション）
LINEWORKS_BOT_TOKEN=your_lineworks_bot_token_here
LINEWORKS_CHANNEL_ID=your_lineworks_channel_id_here

# セキュリティ設定
SESSION_SECRET=your_session_secret_here
COOKIE_SECRET=your_cookie_secret_here
```

### データベースの初期化
```bash
# データベースの初期化
npm run db:init

# マイグレーションの実行
npm run db:migrate

# データベースの確認
psql -U vehicle_user -d vehicle_management -h localhost -c "\dt"
```

### フロントエンドのビルド
```bash
cd ../client
npm run build

# ビルド結果の確認
ls -la build/
```

### アップロードディレクトリの設定
```bash
cd ../server
mkdir -p uploads
chmod 755 uploads
```

## 3. SSL証明書の設定

### お名前ドットコムでのSSL証明書取得

#### 1. お名前ドットコムでの証明書購入
1. お名前ドットコムの管理画面にログイン
2. SSL証明書の購入ページにアクセス
3. 適切なSSL証明書を選択（推奨：DV証明書またはOV証明書）
4. ドメイン名を入力して購入完了

#### 2. 証明書ファイルのダウンロード
1. お名前ドットコムの管理画面でSSL証明書を選択
2. 証明書ファイルをダウンロード：
   - サーバー証明書（.crtファイル）
   - 中間証明書（.crtファイル）
   - 秘密鍵（.keyファイル）

#### 3. 証明書ファイルのサーバーへのアップロード
```bash
# SSL証明書ディレクトリの作成
sudo mkdir -p /etc/ssl/vehicle-management
sudo chmod 700 /etc/ssl/vehicle-management

# 証明書ファイルをサーバーにアップロード（SCPまたはSFTPを使用）
# 例：scp certificate.crt user@your-server:/tmp/
#     scp intermediate.crt user@your-server:/tmp/
#     scp private.key user@your-server:/tmp/

# 証明書ファイルを適切な場所に移動
sudo mv /tmp/certificate.crt /etc/ssl/vehicle-management/
sudo mv /tmp/intermediate.crt /etc/ssl/vehicle-management/
sudo mv /tmp/private.key /etc/ssl/vehicle-management/

# 権限の設定
sudo chmod 644 /etc/ssl/vehicle-management/*.crt
sudo chmod 600 /etc/ssl/vehicle-management/*.key
sudo chown root:root /etc/ssl/vehicle-management/*
```

#### 4. 証明書チェーンファイルの作成
```bash
# サーバー証明書と中間証明書を結合
sudo cat /etc/ssl/vehicle-management/certificate.crt /etc/ssl/vehicle-management/intermediate.crt > /etc/ssl/vehicle-management/fullchain.crt

# 権限の設定
sudo chmod 644 /etc/ssl/vehicle-management/fullchain.crt
sudo chown root:root /etc/ssl/vehicle-management/fullchain.crt
```

#### 5. 証明書の検証
```bash
# 証明書の内容確認
sudo openssl x509 -in /etc/ssl/vehicle-management/certificate.crt -text -noout

# 証明書チェーンの確認
sudo openssl verify -CAfile /etc/ssl/vehicle-management/intermediate.crt /etc/ssl/vehicle-management/certificate.crt

# 秘密鍵と証明書の整合性確認
sudo openssl x509 -noout -modulus -in /etc/ssl/vehicle-management/certificate.crt | openssl md5
sudo openssl rsa -noout -modulus -in /etc/ssl/vehicle-management/private.key | openssl md5
# 両方のハッシュ値が一致することを確認
```

## 4. Nginxの設定

### リバースプロキシの設定
```bash
sudo nano /etc/nginx/sites-available/vehicle-management
```

以下の内容を追加：
```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL設定（お名前ドットコム証明書）
    ssl_certificate /etc/ssl/vehicle-management/fullchain.crt;
    ssl_certificate_key /etc/ssl/vehicle-management/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # セキュリティヘッダー
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # ログ設定
    access_log /var/log/nginx/vehicle-management-access.log;
    error_log /var/log/nginx/vehicle-management-error.log;

    # フロントエンド
    location / {
        root /var/www/vehicle-management/client/build;
        try_files $uri $uri/ /index.html;
        
        # キャッシュ設定
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header Vary "Accept-Encoding";
        }
        
        # HTMLファイルのキャッシュ無効化
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }

    # バックエンドAPI
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # タイムアウト設定
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # バッファ設定
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # アップロードファイル
    location /uploads {
        alias /var/www/vehicle-management/server/uploads;
        expires 1d;
        add_header Cache-Control "public";
        
        # セキュリティ設定
        location ~* \.(php|pl|py|jsp|asp|sh|cgi)$ {
            deny all;
        }
    }

    # ヘルスチェック
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # セキュリティ設定
    location ~ /\. {
        deny all;
    }
    
    location ~ ~$ {
        deny all;
    }
}

# デフォルトサーバーの無効化
server {
    listen 80 default_server;
    listen 443 ssl default_server;
    server_name _;
    return 444;
}
```

### Nginxの設定を有効化
```bash
# デフォルトサイトの無効化
sudo rm -f /etc/nginx/sites-enabled/default

# 新しいサイトの有効化
sudo ln -s /etc/nginx/sites-available/vehicle-management /etc/nginx/sites-enabled/

# 設定のテスト
sudo nginx -t

# Nginxの再起動
sudo systemctl restart nginx
sudo systemctl enable nginx

# Nginxの状態確認
sudo systemctl status nginx
```

## 5. PM2のインストールと設定

### PM2のインストール
```bash
# PM2のグローバルインストール
sudo npm install -g pm2

# PM2のバージョン確認
pm2 --version
```

### PM2の設定ファイル作成
```bash
cd /var/www/vehicle-management/server
pm2 ecosystem
```

`ecosystem.config.js`を編集：
```javascript
module.exports = {
  apps: [{
    name: 'vehicle-management-server',
    script: 'index.js',
    cwd: '/var/www/vehicle-management/server',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/pm2/vehicle-management-error.log',
    out_file: '/var/log/pm2/vehicle-management-out.log',
    log_file: '/var/log/pm2/vehicle-management-combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000
  }]
};
```

### PM2ログディレクトリの作成
```bash
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2
```

### アプリケーションの起動
```bash
# アプリケーションの起動
pm2 start ecosystem.config.js --env production

# PM2の設定保存
pm2 save

# システム起動時の自動起動設定
pm2 startup

# 生成されたコマンドを実行（例：sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu）
```

### PM2の状態確認
```bash
# アプリケーションの状態確認
pm2 status

# ログの確認
pm2 logs vehicle-management-server

# モニタリング
pm2 monit
```

## 6. ログローテーションの設定

### logrotateの設定
```bash
sudo nano /etc/logrotate.d/vehicle-management
```

以下の内容を追加：
```
/var/log/pm2/vehicle-management-*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs
    endscript
}

/var/log/nginx/vehicle-management-*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload nginx
    endscript
}
```

### ログローテーションのテスト
```bash
sudo logrotate -f /etc/logrotate.d/vehicle-management
```

## 7. バックアップの設定

### データベースバックアップスクリプト
```bash
sudo nano /usr/local/bin/backup-db.sh
```

以下の内容を追加：
```bash
#!/bin/bash

# 設定
BACKUP_DIR="/var/backups/vehicle-management"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="vehicle_management"
DB_USER="vehicle_user"
RETENTION_DAYS=7

# バックアップディレクトリの作成
mkdir -p $BACKUP_DIR

# バックアップの実行
echo "Starting database backup at $(date)"
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# 圧縮
gzip $BACKUP_DIR/db_backup_$DATE.sql

# 古いバックアップの削除
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# バックアップサイズの確認
BACKUP_SIZE=$(du -h $BACKUP_DIR/db_backup_$DATE.sql.gz | cut -f1)
echo "Backup completed: $BACKUP_DIR/db_backup_$DATE.sql.gz ($BACKUP_SIZE)"

# ログファイルへの記録
echo "$(date): Database backup completed - $BACKUP_DIR/db_backup_$DATE.sql.gz ($BACKUP_SIZE)" >> /var/log/backup.log
```

```bash
sudo chmod +x /usr/local/bin/backup-db.sh
```

### アプリケーションファイルバックアップスクリプト
```bash
sudo nano /usr/local/bin/backup-app.sh
```

以下の内容を追加：
```bash
#!/bin/bash

# 設定
BACKUP_DIR="/var/backups/vehicle-management"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/vehicle-management"
RETENTION_DAYS=7

# バックアップディレクトリの作成
mkdir -p $BACKUP_DIR

# アプリケーションファイルのバックアップ
echo "Starting application backup at $(date)"
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C /var/www vehicle-management --exclude='node_modules' --exclude='uploads'

# 古いバックアップの削除
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# バックアップサイズの確認
BACKUP_SIZE=$(du -h $BACKUP_DIR/app_backup_$DATE.tar.gz | cut -f1)
echo "Backup completed: $BACKUP_DIR/app_backup_$DATE.tar.gz ($BACKUP_SIZE)"

# ログファイルへの記録
echo "$(date): Application backup completed - $BACKUP_DIR/app_backup_$DATE.tar.gz ($BACKUP_SIZE)" >> /var/log/backup.log
```

```bash
sudo chmod +x /usr/local/bin/backup-app.sh
```

### 自動バックアップの設定
```bash
sudo crontab -e
```

以下の行を追加：
```
# データベースバックアップ（毎日午前2時）
0 2 * * * /usr/local/bin/backup-db.sh

# アプリケーションファイルバックアップ（毎週日曜日午前3時）
0 3 * * 0 /usr/local/bin/backup-app.sh

# ログローテーション（毎日午前4時）
0 4 * * * /usr/sbin/logrotate /etc/logrotate.d/vehicle-management
```

## 8. 監視とアラートの設定

### システム監視スクリプト
```bash
sudo nano /usr/local/bin/monitor-system.sh
```

以下の内容を追加：
```bash
#!/bin/bash

# 設定
LOG_FILE="/var/log/system-monitor.log"
ALERT_EMAIL="your-email@example.com"
DISK_THRESHOLD=80
MEMORY_THRESHOLD=80

# ディスク使用量の確認
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

if [ $DISK_USAGE -gt $DISK_THRESHOLD ]; then
    echo "$(date): WARNING - Disk usage is ${DISK_USAGE}%" >> $LOG_FILE
    # メール送信（mailutilsがインストールされている場合）
    # echo "Disk usage warning: ${DISK_USAGE}%" | mail -s "Server Alert" $ALERT_EMAIL
fi

# メモリ使用量の確認
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')

if [ $MEMORY_USAGE -gt $MEMORY_THRESHOLD ]; then
    echo "$(date): WARNING - Memory usage is ${MEMORY_USAGE}%" >> $LOG_FILE
    # メール送信
    # echo "Memory usage warning: ${MEMORY_USAGE}%" | mail -s "Server Alert" $ALERT_EMAIL
fi

# PM2プロセスの確認
if ! pm2 list | grep -q "vehicle-management-server.*online"; then
    echo "$(date): ERROR - Vehicle management server is not running" >> $LOG_FILE
    # メール送信
    # echo "Server is down" | mail -s "Server Alert" $ALERT_EMAIL
fi

# Nginxプロセスの確認
if ! systemctl is-active --quiet nginx; then
    echo "$(date): ERROR - Nginx is not running" >> $LOG_FILE
    # メール送信
    # echo "Nginx is down" | mail -s "Server Alert" $ALERT_EMAIL
fi
```

```bash
sudo chmod +x /usr/local/bin/monitor-system.sh
```

### 監視の自動実行設定
```bash
sudo crontab -e
```

以下の行を追加：
```
# システム監視（5分ごと）
*/5 * * * * /usr/local/bin/monitor-system.sh
```

## 9. 動作確認

### 基本的な動作確認
```bash
# アプリケーションの状態確認
pm2 status
pm2 logs vehicle-management-server --lines 50

# Nginxの状態確認
sudo systemctl status nginx
sudo nginx -t

# ポートの確認
sudo netstat -tlnp | grep -E ':(80|443|3001)'

# ファイアウォールの確認
sudo ufw status
```

### ウェブアクセステスト
```bash
# ローカルからのテスト
curl -I http://localhost
curl -I https://localhost
curl -I http://localhost/api/health

# 外部からのテスト（ドメインがある場合）
curl -I https://your-domain.com
curl -I https://your-domain.com/api/health
```

### データベース接続テスト
```bash
# PostgreSQL接続テスト
psql -U vehicle_user -d vehicle_management -h localhost -c "SELECT version();"

# テーブル一覧の確認
psql -U vehicle_user -d vehicle_management -h localhost -c "\dt"
```

## 10. メンテナンス

### ログの確認
```bash
# Nginxのログ
sudo tail -f /var/log/nginx/vehicle-management-access.log
sudo tail -f /var/log/nginx/vehicle-management-error.log

# アプリケーションのログ
pm2 logs vehicle-management-server --lines 100

# PM2のログファイル
tail -f /var/log/pm2/vehicle-management-out.log
tail -f /var/log/pm2/vehicle-management-error.log

# システムログ
sudo journalctl -u nginx -f
sudo journalctl -u postgresql -f
```

### アプリケーションの更新
```bash
cd /var/www/vehicle-management

# 変更の確認
git status
git log --oneline -5

# 最新の変更を取得
git pull origin main

# 依存関係の更新
npm run install:all

# データベースマイグレーション
npm run db:migrate

# フロントエンドの再ビルド
cd client
npm run build

# サーバーの再起動
pm2 restart vehicle-management-server

# 更新の確認
pm2 status
pm2 logs vehicle-management-server --lines 20
```

### システムの監視
```bash
# PM2のステータス確認
pm2 status
pm2 monit

# システムリソースの確認
htop
free -h
df -h

# プロセスの確認
ps aux | grep -E '(node|nginx|postgres)'

# ネットワーク接続の確認
netstat -tlnp
ss -tlnp
```

### パフォーマンス最適化

#### Nginxの最適化
```bash
sudo nano /etc/nginx/nginx.conf
```

以下の設定を追加：
```nginx
# httpブロック内に追加
http {
    # 基本設定
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Gzip圧縮
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
    
    # バッファ設定
    client_body_buffer_size 128k;
    client_max_body_size 10m;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    
    # タイムアウト設定
    client_body_timeout 12;
    client_header_timeout 12;
    send_timeout 10;
}
```

#### PostgreSQLの最適化
```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

以下の設定を調整：
```conf
# メモリ設定
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# 接続設定
max_connections = 100

# ログ設定
log_statement = 'all'
log_duration = on
log_min_duration_statement = 1000

# パフォーマンス設定
random_page_cost = 1.1
effective_io_concurrency = 200
```

```bash
sudo systemctl restart postgresql
```

## トラブルシューティング

### よくある問題と解決方法

1. **Nginx 502 Bad Gateway**
   ```bash
   # バックエンドサーバーのステータス確認
   pm2 status
   
   # ログの確認
   pm2 logs vehicle-management-server
   
   # ポートの確認
   netstat -tlnp | grep :3001
   
   # プロセスの確認
   ps aux | grep node
   
   # 手動でサーバーを起動してテスト
   cd /var/www/vehicle-management/server
   node index.js
   ```

2. **データベース接続エラー**
   ```bash
   # PostgreSQLのステータス確認
   sudo systemctl status postgresql
   
   # データベース接続テスト
   psql -U vehicle_user -d vehicle_management -h localhost
   
   # 環境変数の確認
   cat /var/www/vehicle-management/server/.env
   
   # PostgreSQLログの確認
   sudo tail -f /var/log/postgresql/postgresql-*.log
   
   # データベースユーザーの権限確認
   sudo -u postgres psql -c "\du"
   ```

3. **SSL証明書の問題**
   ```bash
   # 証明書の有効期限を確認
   sudo openssl x509 -in /etc/ssl/vehicle-management/certificate.crt -noout -dates
   
   # 証明書の内容確認
   sudo openssl x509 -in /etc/ssl/vehicle-management/certificate.crt -text -noout
   
   # Nginxの設定テスト
   sudo nginx -t
   
   # SSL証明書の詳細確認
   sudo openssl x509 -in /etc/ssl/vehicle-management/certificate.crt -text -noout
   
   # 証明書チェーンの確認
   sudo openssl verify -CAfile /etc/ssl/vehicle-management/intermediate.crt /etc/ssl/vehicle-management/certificate.crt
   ```

4. **メモリ不足エラー**
   ```bash
   # メモリ使用量の確認
   free -h
   htop
   
   # PM2のメモリ制限を調整
   pm2 restart vehicle-management-server --max-memory-restart 2G
   
   # スワップの確認
   swapon --show
   
   # スワップの追加（必要に応じて）
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

5. **ファイルアップロードエラー**
   ```bash
   # アップロードディレクトリの権限確認
   ls -la /var/www/vehicle-management/server/uploads
   
   # 権限の修正
   sudo chown -R www-data:www-data /var/www/vehicle-management/server/uploads
   sudo chmod 755 /var/www/vehicle-management/server/uploads
   
   # Nginxの設定確認
   sudo nginx -t
   
   # ディスク容量の確認
   df -h
   ```

6. **PM2プロセスが起動しない**
   ```bash
   # PM2の状態確認
   pm2 status
   pm2 logs
   
   # PM2の再起動
   pm2 kill
   pm2 start ecosystem.config.js --env production
   
   # システムログの確認
   sudo journalctl -u pm2-ubuntu -f
   
   # 手動での起動テスト
   cd /var/www/vehicle-management/server
   node index.js
   ```

7. **Nginxが起動しない**
   ```bash
   # 設定ファイルの構文チェック
   sudo nginx -t
   
   # エラーログの確認
   sudo tail -f /var/log/nginx/error.log
   
   # ポートの競合確認
   sudo netstat -tlnp | grep :80
   sudo netstat -tlnp | grep :443
   
   # Nginxの再起動
   sudo systemctl restart nginx
   ```

## セキュリティチェックリスト

- [ ] ファイアウォールの設定（UFW）
- [ ] SSL証明書の設定（お名前ドットコム）
- [ ] 環境変数の適切な設定
- [ ] データベースのバックアップ設定
- [ ] ログローテーションの設定
- [ ] セキュリティアップデートの自動化
- [ ] ファイルアップロードディレクトリの権限設定
- [ ] Nginxセキュリティヘッダーの設定
- [ ] PM2のログ設定
- [ ] 定期的なバックアップの実行
- [ ] システム監視の設定
- [ ] 不要なサービスの無効化
- [ ] SSH鍵認証の設定
- [ ] パスワードポリシーの設定
- [ ] 定期的なセキュリティ監査

## パフォーマンス最適化

1. **Nginxキャッシュ設定**
   - 静的ファイルのキャッシュ
   - プロキシバッファの最適化
   - Gzip圧縮の有効化

2. **PM2のクラスターモード**
   - マルチコアCPUの活用
   - 負荷分散の実現

3. **データベースインデックスの最適化**
   - クエリパフォーマンスの向上
   - インデックスの定期的な分析

4. **静的ファイルのCDN配信**
   - 画像やCSS/JSファイルの配信最適化
   - 地理的分散による高速化

5. **画像の最適化**
   - WebP形式への変換
   - 適切なサイズへのリサイズ

## 監視とアラート

1. **PM2の監視設定**
   - プロセス状態の監視
   - メモリ使用量の監視
   - 自動再起動の設定

2. **Nginxのアクセスログ監視**
   - アクセスパターンの分析
   - エラー率の監視
   - レスポンス時間の監視

3. **データベースのパフォーマンス監視**
   - クエリ実行時間の監視
   - 接続数の監視
   - ディスクI/Oの監視

4. **ディスク容量の監視**
   - 使用量の定期的なチェック
   - 自動クリーンアップの設定

5. **SSL証明書の有効期限監視**
   - 期限切れの自動検出
   - 更新の手動管理（お名前ドットコムでの更新）

## 定期メンテナンス

### 日次タスク
- ログファイルの確認
- バックアップの確認
- システムリソースの監視

### 週次タスク
- セキュリティアップデートの確認
- パフォーマンスの分析
- ディスク使用量の確認

### 月次タスク
- 完全なシステムバックアップ
- セキュリティ監査
- パフォーマンス最適化の見直し

### 四半期タスク
- SSL証明書の有効期限確認（お名前ドットコムでの更新）
- 依存関係の更新
- システム全体の見直し 