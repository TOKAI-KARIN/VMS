#!/bin/bash

# SSL証明書自動更新スクリプト
# このスクリプトはcronで定期実行することを想定しています

set -e

echo "🔒 SSL証明書の更新を開始します..."

# ドメイン名を設定（実際のドメイン名に変更してください）
DOMAIN_NAME="your-domain.com"

# ログファイルの設定
LOG_FILE="/var/log/ssl-renewal.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] SSL証明書更新プロセスを開始" >> $LOG_FILE

# 証明書の更新を試行
if sudo certbot renew --quiet --no-self-upgrade; then
    echo "[$DATE] SSL証明書の更新が成功しました" >> $LOG_FILE
    
    # Nginxの設定をリロード
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo "[$DATE] Nginx設定をリロードしました" >> $LOG_FILE
    else
        echo "[$DATE] Nginx設定のテストに失敗しました" >> $LOG_FILE
        exit 1
    fi
    
    # アプリケーションの再起動（必要に応じて）
    # pm2 restart all
    # echo "[$DATE] アプリケーションを再起動しました" >> $LOG_FILE
    
else
    echo "[$DATE] SSL証明書の更新に失敗しました" >> $LOG_FILE
    exit 1
fi

echo "[$DATE] SSL証明書更新プロセスが完了しました" >> $LOG_FILE

# 古いログファイルの削除（30日以上古いもの）
find /var/log/ssl-renewal.log -mtime +30 -delete 2>/dev/null || true 