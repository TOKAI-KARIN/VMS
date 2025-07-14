#!/bin/bash

# Cron設定スクリプト
# 定期バックアップ、SSL更新、監視タスクを自動化

set -e

echo "⏰ Cron設定を開始します..."

# 現在のユーザーを取得
CURRENT_USER=$(whoami)

# 既存のcronジョブをクリア
echo "🧹 既存のcronジョブをクリア中..."
crontab -r 2>/dev/null || true

# 新しいcronジョブを設定
echo "📅 新しいcronジョブを設定中..."

# 一時的なcronファイルを作成
cat > /tmp/vehicle-management-cron << EOF
# Vehicle Management System - Cron Jobs
# 毎日午前2時にバックアップを実行
0 2 * * * /var/www/vehicle-management/gcp-deployment/backup.sh >> /var/log/backup-cron.log 2>&1

# 毎日午前3時にSSL証明書の更新をチェック
0 3 * * * /var/www/vehicle-management/gcp-deployment/update-ssl.sh >> /var/log/ssl-cron.log 2>&1

# 毎5分にシステム監視を実行
*/5 * * * * /var/www/vehicle-management/gcp-deployment/monitoring.sh >> /var/log/monitoring-cron.log 2>&1

# 毎日午前4時にログファイルをローテーション
0 4 * * * find /var/log -name "*.log" -mtime +7 -delete

# 毎週日曜日の午前1時にシステム更新をチェック
0 1 * * 0 sudo apt update && sudo apt upgrade -y >> /var/log/system-update.log 2>&1

# 毎日午前5時にPM2ログをクリア
0 5 * * * pm2 flush

# 毎時0分にディスク使用量をチェック
0 * * * * df -h | grep -E '^/dev/' >> /var/log/disk-usage.log

# 毎日午前6時にアプリケーションのヘルスチェック
0 6 * * * curl -f https://your-domain.com/health || pm2 restart all
EOF

# cronファイルをインストール
crontab /tmp/vehicle-management-cron

# 一時ファイルを削除
rm /tmp/vehicle-management-cron

# ログディレクトリの作成
echo "📁 ログディレクトリを作成中..."
sudo mkdir -p /var/log
sudo chown $CURRENT_USER:$CURRENT_USER /var/log/backup-cron.log
sudo chown $CURRENT_USER:$CURRENT_USER /var/log/ssl-cron.log
sudo chown $CURRENT_USER:$CURRENT_USER /var/log/monitoring-cron.log
sudo chown $CURRENT_USER:$CURRENT_USER /var/log/system-update.log
sudo chown $CURRENT_USER:$CURRENT_USER /var/log/disk-usage.log

# スクリプトに実行権限を付与
echo "🔧 スクリプトに実行権限を付与中..."
chmod +x /var/www/vehicle-management/gcp-deployment/backup.sh
chmod +x /var/www/vehicle-management/gcp-deployment/update-ssl.sh
chmod +x /var/www/vehicle-management/gcp-deployment/monitoring.sh

# cronサービスの確認
echo "🔍 Cronサービスの状態を確認中..."
if sudo systemctl is-active --quiet cron; then
    echo "✅ Cronサービス: 正常に動作中"
else
    echo "❌ Cronサービス: 停止中 - 起動します"
    sudo systemctl start cron
    sudo systemctl enable cron
fi

# 設定されたcronジョブの確認
echo "📋 設定されたcronジョブ:"
crontab -l

echo ""
echo "✅ Cron設定が完了しました！"
echo ""
echo "📅 設定された定期タスク:"
echo "- 毎日午前2時: バックアップ実行"
echo "- 毎日午前3時: SSL証明書更新チェック"
echo "- 毎5分: システム監視"
echo "- 毎日午前4時: ログファイルローテーション"
echo "- 毎週日曜日午前1時: システム更新チェック"
echo "- 毎日午前5時: PM2ログクリア"
echo "- 毎時: ディスク使用量チェック"
echo "- 毎日午前6時: アプリケーションヘルスチェック"
echo ""
echo "📝 ログファイル:"
echo "- バックアップ: /var/log/backup-cron.log"
echo "- SSL更新: /var/log/ssl-cron.log"
echo "- 監視: /var/log/monitoring-cron.log"
echo "- システム更新: /var/log/system-update.log"
echo "- ディスク使用量: /var/log/disk-usage.log"
echo ""
echo "🔧 管理コマンド:"
echo "- cronジョブ確認: crontab -l"
echo "- cronジョブ編集: crontab -e"
echo "- cronサービス状態: sudo systemctl status cron"
echo "- cronサービス再起動: sudo systemctl restart cron" 