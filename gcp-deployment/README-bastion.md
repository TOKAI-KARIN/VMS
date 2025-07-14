# GCP踏み台サーバー + オンプレミス構成

この構成では、GCPのVMを踏み台サーバー（リバースプロキシ）として利用し、メインのアプリケーションはオンプレミスサーバーで動作させます。

## 🏗️ アーキテクチャ概要

```
インターネット
    ↓
GCP VM (踏み台サーバー)
    ↓ (リバースプロキシ + SSL終端)
オンプレミスサーバー
    ↓
React App (ポート3000) + Node.js API (ポート3001)
    ↓
PostgreSQL (データベース)
```

## ✨ この構成のメリット

### 💰 **コスト効率**
- **GCP踏み台サーバー**: 月額約$5-8 (e2-micro)
- **オンプレミスサーバー**: 既存サーバーを活用（追加コストなし）
- **合計**: 月額約$5-8

### 🔒 **セキュリティ**
- オンプレミスサーバーは直接インターネットに公開されない
- GCP踏み台サーバーでSSL終端
- ファイアウォールによるアクセス制御

### 🚀 **パフォーマンス**
- オンプレミスサーバーの全リソースを活用
- データベースへの低遅延アクセス
- 静的ファイルのキャッシュ

### 🔧 **運用性**
- オンプレミスサーバーでの直接管理
- データの完全な制御
- 既存のインフラを活用

## 📁 ファイル構成

```
gcp-deployment/
├── nginx-reverse-proxy.conf    # リバースプロキシ設定
├── setup-bastion-only.sh       # 踏み台サーバー専用セットアップ
├── onpremise-setup-guide.md    # オンプレミスサーバーセットアップガイド
├── firewall-rules.sh           # GCPファイアウォール設定
├── update-ssl.sh               # SSL証明書自動更新
├── backup.sh                   # バックアップスクリプト
├── monitoring.sh               # 監視スクリプト
├── setup-cron.sh               # 定期タスク設定
└── README-bastion.md           # このファイル
```

## 🚀 セットアップ手順

### 1. オンプレミスサーバーの準備

```bash
# オンプレミスサーバーで実行
# 詳細は onpremise-setup-guide.md を参照
```

### 2. GCP踏み台サーバーの作成

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

### 3. 踏み台サーバーのセットアップ

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

### 4. DNS設定

ドメインプロバイダーで以下のDNSレコードを設定：

```
A レコード: your-domain.com → GCP VMの外部IP
A レコード: www.your-domain.com → GCP VMの外部IP
```

## 🔧 設定項目

### 必須設定

1. **ドメイン名**: `your-domain.com`
2. **オンプレミスサーバーIP**: `YOUR_ONPREMISE_IP`
3. **データベースパスワード**: `your-secure-password`
4. **JWTシークレット**: `your-jwt-secret-key-here`

### ネットワーク設定

- **オンプレミスサーバー**: 3000, 3001ポートを内部開放
- **GCP踏み台サーバー**: 80, 443ポートを外部開放
- **ファイアウォール**: 必要最小限のポートのみ開放

## 📊 監視とメンテナンス

### オンプレミスサーバー

```bash
# アプリケーション状態確認
pm2 status
pm2 logs

# システムリソース確認
htop
df -h
free -h

# データベース確認
sudo -u postgres psql -c "\l"
```

### 踏み台サーバー

```bash
# オンプレミスサーバー監視
tail -f /var/log/bastion/onpremise-monitor.log

# Nginxログ
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# SSL証明書確認
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

3. **アプリケーションが起動しない**
   ```bash
   # オンプレミスサーバーで実行
   pm2 logs
   pm2 restart all
   ```

## 💰 コスト比較

| 構成 | 月額コスト | メリット | デメリット |
|------|------------|----------|------------|
| **GCP踏み台 + オンプレミス** | $5-8 | 低コスト、データ制御 | ネットワーク依存 |
| **GCP完全移行** | $25-35 | 高可用性、管理容易 | 高コスト |
| **オンプレミス直接公開** | $0 | 最低コスト | セキュリティリスク |

## 🔒 セキュリティ考慮事項

### オンプレミスサーバー
- ファイアウォールで必要最小限のポートのみ開放
- 強力なパスワードを使用
- 定期的なセキュリティ更新

### 踏み台サーバー
- SSL証明書による暗号化
- セキュリティヘッダーの設定
- アクセスログの監視

### ネットワーク
- VPN接続の検討
- IP制限の設定
- 侵入検知システムの導入

## 📞 サポート

問題が発生した場合は、以下のログを確認してください：

1. **オンプレミスサーバー**: `pm2 logs`
2. **踏み台サーバー**: `/var/log/bastion/onpremise-monitor.log`
3. **Nginxログ**: `/var/log/nginx/`

## 🔄 更新とメンテナンス

### 定期的なメンテナンス

```bash
# システムの更新
sudo apt update && sudo apt upgrade -y

# SSL証明書の更新確認
sudo certbot renew --dry-run

# ログファイルのローテーション
sudo logrotate -f /etc/logrotate.d/bastion-server
```

### バックアップ

```bash
# データベースのバックアップ
pg_dump vehicle_management > backup_$(date +%Y%m%d).sql

# アプリケーションファイルのバックアップ
tar -czf app_backup_$(date +%Y%m%d).tar.gz /var/www/vehicle-management
``` 