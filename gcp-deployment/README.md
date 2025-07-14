# GCP VM デプロイメントガイド

このガイドでは、GCPのVMインスタンスを踏み台サーバーとして利用してWebアプリケーションを公開する手順を説明します。

## 📋 前提条件

1. **GCPアカウント** - Google Cloud Platformのアカウントが必要です
2. **ドメイン名** - アプリケーション用のドメイン名（例：`your-app.com`）
3. **GitHubリポジトリ** - アプリケーションのソースコードがGitHubにプッシュされていること

## 🚀 セットアップ手順

### 1. GCP VMインスタンスの作成

1. **GCPコンソール**にアクセス
2. **Compute Engine** → **VMインスタンス** → **インスタンスを作成**
3. 以下の設定でインスタンスを作成：
   - **名前**: `vehicle-management-server`
   - **リージョン**: `asia-northeast1` (東京)
   - **マシンタイプ**: `e2-medium` (2 vCPU, 4 GB メモリ)
   - **ブートディスク**: Ubuntu 20.04 LTS
   - **ファイアウォール**: HTTP、HTTPSトラフィックを許可

### 2. ドメインの設定

1. **ドメインプロバイダー**でDNSレコードを設定：
   ```
   A レコード: your-domain.com → GCP VMの外部IP
   A レコード: www.your-domain.com → GCP VMの外部IP
   ```

### 3. VMへの接続とセットアップ

```bash
# SSHでVMに接続
gcloud compute ssh vehicle-management-server

# セットアップスクリプトをダウンロード
wget https://raw.githubusercontent.com/yourusername/vehicle-management/main/gcp-deployment/setup-gcp-vm.sh

# スクリプトを編集（設定を変更）
nano setup-gcp-vm.sh

# 実行権限を付与して実行
chmod +x setup-gcp-vm.sh
./setup-gcp-vm.sh
```

### 4. 設定の変更

セットアップスクリプト内の以下の変数を変更してください：

```bash
DOMAIN_NAME="your-domain.com"           # あなたのドメイン名
DB_PASSWORD="your-secure-password"      # データベースパスワード
GITHUB_REPO="https://github.com/yourusername/vehicle-management.git"  # GitHubリポジトリURL
```

## 🔧 アーキテクチャ

```
インターネット
    ↓
GCP VM (踏み台サーバー)
    ↓
Nginx (リバースプロキシ + SSL終端)
    ↓
React App (ポート3000) + Node.js API (ポート3001)
    ↓
PostgreSQL (データベース)
```

## 📁 ファイル構成

```
gcp-deployment/
├── nginx.conf              # Nginx設定ファイル
├── ecosystem.config.js      # PM2設定ファイル
├── setup-gcp-vm.sh         # 初期セットアップスクリプト
├── deploy.sh               # デプロイスクリプト
└── README.md               # このファイル
```

## 🔄 デプロイ手順

### 初回デプロイ

```bash
# VMにSSH接続
gcloud compute ssh vehicle-management-server

# セットアップスクリプトを実行
./setup-gcp-vm.sh
```

### 継続的デプロイ

```bash
# VMにSSH接続
gcloud compute ssh vehicle-management-server

# デプロイスクリプトを実行
cd /var/www/vehicle-management
./gcp-deployment/deploy.sh
```

## 📊 監視とログ

### PM2コマンド

```bash
# アプリケーションのステータス確認
pm2 status

# ログの確認
pm2 logs

# アプリケーションの再起動
pm2 restart all

# アプリケーションの停止
pm2 stop all
```

### システムログ

```bash
# Nginxログ
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PM2ログ
tail -f /var/log/pm2/client-out.log
tail -f /var/log/pm2/server-out.log
```

## 🔒 セキュリティ設定

### ファイアウォール

- ポート22 (SSH): 許可
- ポート80 (HTTP): 許可
- ポート443 (HTTPS): 許可
- その他のポート: 拒否

### SSL証明書

- Let's Encryptによる自動SSL証明書取得
- 90日ごとの自動更新

### データベース

- PostgreSQLはローカルホストのみでアクセス可能
- 強力なパスワードを使用

## 🚨 トラブルシューティング

### よくある問題

1. **アプリケーションが起動しない**
   ```bash
   pm2 logs
   pm2 restart all
   ```

2. **SSL証明書の更新エラー**
   ```bash
   sudo certbot renew --dry-run
   ```

3. **データベース接続エラー**
   ```bash
   sudo systemctl status postgresql
   sudo -u postgres psql -c "\l"
   ```

4. **Nginx設定エラー**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 💰 コスト最適化

### 推奨設定

- **マシンタイプ**: e2-medium (月額約$25)
- **ストレージ**: 標準永続ディスク 20GB
- **ネットワーク**: 標準ネットワーク

### コスト削減のヒント

1. **開発環境**ではe2-microを使用
2. **自動停止**機能を活用
3. **プリエンプティブルインスタンス**を検討

## 📞 サポート

問題が発生した場合は、以下のログを確認してください：

1. PM2ログ: `pm2 logs`
2. Nginxログ: `/var/log/nginx/`
3. システムログ: `journalctl -u nginx`

## 🔄 更新とメンテナンス

### 定期的なメンテナンス

```bash
# システムの更新
sudo apt update && sudo apt upgrade -y

# SSL証明書の更新確認
sudo certbot renew --dry-run

# PM2の更新
npm install -g pm2@latest
```

### バックアップ

```bash
# データベースのバックアップ
pg_dump vehicle_management > backup_$(date +%Y%m%d).sql

# アプリケーションファイルのバックアップ
tar -czf app_backup_$(date +%Y%m%d).tar.gz /var/www/vehicle-management
``` 