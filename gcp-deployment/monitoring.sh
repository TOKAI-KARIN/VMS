#!/bin/bash

# システム監視スクリプト
# アプリケーションのヘルスチェックとシステムリソースの監視

set -e

echo "📊 システム監視を開始します..."

# 設定変数
LOG_FILE="/var/log/monitoring.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')
DOMAIN_NAME="your-domain.com"

# ログファイルの初期化
echo "[$DATE] システム監視を開始" >> $LOG_FILE

# 1. システムリソースの監視
echo "💻 システムリソースを監視中..."

# CPU使用率
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
echo "CPU使用率: ${CPU_USAGE}%" >> $LOG_FILE

# メモリ使用率
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100.0)}')
echo "メモリ使用率: ${MEMORY_USAGE}%" >> $LOG_FILE

# ディスク使用率
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
echo "ディスク使用率: ${DISK_USAGE}%" >> $LOG_FILE

# 2. アプリケーションのヘルスチェック
echo "🔍 アプリケーションのヘルスチェック中..."

# PM2プロセスの確認
PM2_STATUS=$(pm2 status --no-daemon | grep -E "(vehicle-management-client|vehicle-management-server)" | wc -l)
if [ $PM2_STATUS -eq 2 ]; then
    echo "✅ PM2プロセス: 正常 (2/2)" >> $LOG_FILE
else
    echo "❌ PM2プロセス: 異常 ($PM2_STATUS/2)" >> $LOG_FILE
    # アプリケーションの再起動を試行
    pm2 restart all
    echo "🔄 アプリケーションを再起動しました" >> $LOG_FILE
fi

# 3. データベース接続の確認
echo "🗄️ データベース接続を確認中..."
if pg_isready -h localhost -p 5432 -U vehicle_user > /dev/null 2>&1; then
    echo "✅ データベース接続: 正常" >> $LOG_FILE
else
    echo "❌ データベース接続: 異常" >> $LOG_FILE
    # PostgreSQLサービスの再起動を試行
    sudo systemctl restart postgresql
    echo "🔄 PostgreSQLサービスを再起動しました" >> $LOG_FILE
fi

# 4. Nginxサービスの確認
echo "🌐 Nginxサービスを確認中..."
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginxサービス: 正常" >> $LOG_FILE
else
    echo "❌ Nginxサービス: 異常" >> $LOG_FILE
    # Nginxサービスの再起動を試行
    sudo systemctl restart nginx
    echo "🔄 Nginxサービスを再起動しました" >> $LOG_FILE
fi

# 5. SSL証明書の有効期限確認
echo "🔒 SSL証明書の有効期限を確認中..."
CERT_EXPIRY=$(openssl x509 -in /etc/letsencrypt/live/$DOMAIN_NAME/cert.pem -noout -dates | grep notAfter | cut -d'=' -f2)
DAYS_UNTIL_EXPIRY=$(( ($(date -d "$CERT_EXPIRY" +%s) - $(date +%s)) / 86400 ))

if [ $DAYS_UNTIL_EXPIRY -gt 30 ]; then
    echo "✅ SSL証明書: 正常 (${DAYS_UNTIL_EXPIRY}日後まで有効)" >> $LOG_FILE
elif [ $DAYS_UNTIL_EXPIRY -gt 7 ]; then
    echo "⚠️ SSL証明書: 注意 (${DAYS_UNTIL_EXPIRY}日後に期限切れ)" >> $LOG_FILE
else
    echo "❌ SSL証明書: 危険 (${DAYS_UNTIL_EXPIRY}日後に期限切れ)" >> $LOG_FILE
    # SSL証明書の更新を試行
    sudo certbot renew --quiet
    echo "🔄 SSL証明書を更新しました" >> $LOG_FILE
fi

# 6. 外部アクセステスト
echo "🌍 外部アクセステスト中..."
if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN_NAME/health | grep -q "200"; then
    echo "✅ 外部アクセス: 正常" >> $LOG_FILE
else
    echo "❌ 外部アクセス: 異常" >> $LOG_FILE
fi

# 7. ログファイルのサイズ確認
echo "📝 ログファイルサイズを確認中..."
NGINX_LOG_SIZE=$(du -h /var/log/nginx/access.log | cut -f1)
PM2_LOG_SIZE=$(du -h /var/log/pm2/client-combined.log | cut -f1)

echo "Nginxログサイズ: $NGINX_LOG_SIZE" >> $LOG_FILE
echo "PM2ログサイズ: $PM2_LOG_SIZE" >> $LOG_FILE

# 8. アラート条件のチェック
ALERT=false

if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo "🚨 アラート: CPU使用率が高い (${CPU_USAGE}%)" >> $LOG_FILE
    ALERT=true
fi

if (( $(echo "$MEMORY_USAGE > 80" | bc -l) )); then
    echo "🚨 アラート: メモリ使用率が高い (${MEMORY_USAGE}%)" >> $LOG_FILE
    ALERT=true
fi

if [ $DISK_USAGE -gt 80 ]; then
    echo "🚨 アラート: ディスク使用率が高い (${DISK_USAGE}%)" >> $LOG_FILE
    ALERT=true
fi

# 9. 監視結果のサマリー
echo "📊 監視結果サマリー:" >> $LOG_FILE
echo "- CPU使用率: ${CPU_USAGE}%" >> $LOG_FILE
echo "- メモリ使用率: ${MEMORY_USAGE}%" >> $LOG_FILE
echo "- ディスク使用率: ${DISK_USAGE}%" >> $LOG_FILE
echo "- PM2プロセス: $PM2_STATUS/2" >> $LOG_FILE
echo "- SSL証明書: ${DAYS_UNTIL_EXPIRY}日後まで有効" >> $LOG_FILE

if [ "$ALERT" = true ]; then
    echo "🚨 アラートが発生しました。システム管理者に連絡してください。" >> $LOG_FILE
else
    echo "✅ すべてのシステムが正常に動作しています。" >> $LOG_FILE
fi

# 古いログファイルの削除（30日以上古いもの）
find /var/log/monitoring.log -mtime +30 -delete 2>/dev/null || true

echo "✅ システム監視が完了しました！"
echo "📊 詳細なログ: $LOG_FILE" 