#!/bin/bash

# GCP VM 踏み台サーバー専用セットアップスクリプト
# このスクリプトはGCPのVMをリバースプロキシ専用として設定します

set -e

# 設定変数
DOMAIN_NAME="your-domain.com"
ONPREMISE_IP="YOUR_ONPREMISE_IP"  # オンプレミスサーバーのIPアドレス

echo "🚀 GCP VM 踏み台サーバーセットアップを開始します..."

# システムの更新
echo "📦 システムパッケージを更新中..."
sudo apt update && sudo apt upgrade -y

# 必要なパッケージのインストール
echo "📦 必要なパッケージをインストール中..."
sudo apt install -y curl wget nginx certbot python3-certbot-nginx

# アプリケーションディレクトリの作成
echo "📁 アプリケーションディレクトリを作成中..."
sudo mkdir -p /var/www/bastion-server
sudo chown $USER:$USER /var/www/bastion-server

# ログディレクトリの作成
echo "📁 ログディレクトリを作成中..."
sudo mkdir -p /var/log/bastion
sudo chown $USER:$USER /var/log/bastion

# Nginx設定ファイルのコピー
echo "⚙️ Nginx設定をコピー中..."
sudo cp /var/www/bastion-server/gcp-deployment/nginx-reverse-proxy.conf /etc/nginx/sites-available/bastion-server
sudo sed -i "s/your-domain.com/$DOMAIN_NAME/g" /etc/nginx/sites-available/bastion-server
sudo sed -i "s/YOUR_ONPREMISE_IP/$ONPREMISE_IP/g" /etc/nginx/sites-available/bastion-server
sudo ln -sf /etc/nginx/sites-available/bastion-server /etc/nginx/sites-enabled/
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

# オンプレミスサーバーへの接続テスト
echo "🔍 オンプレミスサーバーへの接続をテスト中..."
if ping -c 1 $ONPREMISE_IP > /dev/null 2>&1; then
    echo "✅ オンプレミスサーバーへの接続: 成功"
else
    echo "❌ オンプレミスサーバーへの接続: 失敗"
    echo "⚠️ オンプレミスサーバーのIPアドレスとネットワーク設定を確認してください"
fi

# 監視スクリプトの作成
echo "📊 監視スクリプトを作成中..."
cat > /var/www/bastion-server/monitor-onpremise.sh << 'EOF'
#!/bin/bash

# オンプレミスサーバー監視スクリプト
LOG_FILE="/var/log/bastion/onpremise-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')
ONPREMISE_IP="YOUR_ONPREMISE_IP"

echo "[$DATE] オンプレミスサーバー監視を開始" >> $LOG_FILE

# オンプレミスサーバーの応答確認
if curl -s -o /dev/null -w "%{http_code}" http://$ONPREMISE_IP:3000 | grep -q "200\|404"; then
    echo "[$DATE] オンプレミスサーバー: 正常" >> $LOG_FILE
else
    echo "[$DATE] オンプレミスサーバー: 異常" >> $LOG_FILE
    # アラート通知（必要に応じて）
    # echo "オンプレミスサーバーが応答しません" | mail -s "サーバーアラート" admin@example.com
fi

# APIサーバーの応答確認
if curl -s -o /dev/null -w "%{http_code}" http://$ONPREMISE_IP:3001/health | grep -q "200"; then
    echo "[$DATE] APIサーバー: 正常" >> $LOG_FILE
else
    echo "[$DATE] APIサーバー: 異常" >> $LOG_FILE
fi
EOF

# 監視スクリプトの設定
sed -i "s/YOUR_ONPREMISE_IP/$ONPREMISE_IP/g" /var/www/bastion-server/monitor-onpremise.sh
chmod +x /var/www/bastion-server/monitor-onpremise.sh

# Cron設定
echo "⏰ Cron設定中..."
(crontab -l 2>/dev/null; echo "*/5 * * * * /var/www/bastion-server/monitor-onpremise.sh") | crontab -

# ログローテーション設定
echo "📝 ログローテーション設定中..."
sudo tee /etc/logrotate.d/bastion-server << EOF
/var/log/bastion/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF

echo "✅ 踏み台サーバーセットアップが完了しました！"
echo ""
echo "🌐 設定内容:"
echo "- ドメイン: $DOMAIN_NAME"
echo "- オンプレミスサーバー: $ONPREMISE_IP"
echo "- Nginx: リバースプロキシ + SSL終端"
echo "- 監視: 5分間隔でオンプレミスサーバーをチェック"
echo ""
echo "🔧 管理コマンド:"
echo "- Nginx状態確認: sudo systemctl status nginx"
echo "- Nginx設定テスト: sudo nginx -t"
echo "- Nginx再起動: sudo systemctl restart nginx"
echo "- 監視ログ確認: tail -f /var/log/bastion/onpremise-monitor.log"
echo "- SSL証明書更新: sudo certbot renew"
echo ""
echo "📊 ヘルスチェック:"
echo "- 踏み台サーバー: https://$DOMAIN_NAME/health"
echo "- オンプレミスサーバー: https://$DOMAIN_NAME/health-onpremise" 