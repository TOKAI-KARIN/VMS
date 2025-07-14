#!/bin/bash

# デプロイスクリプト
# このスクリプトは新しいバージョンのアプリケーションをデプロイします

set -e

echo "🚀 デプロイを開始します..."

# アプリケーションディレクトリに移動
cd /var/www/vehicle-management

# 最新のコードを取得
echo "📥 最新のコードを取得中..."
git pull origin main

# クライアントのビルド
echo "🔨 クライアントをビルド中..."
cd client
npm install
npm run build
cd ..

# サーバーの依存関係をインストール
echo "📦 サーバーの依存関係をインストール中..."
cd server
npm install
cd ..

# PM2でアプリケーションを再起動
echo "🔄 アプリケーションを再起動中..."
pm2 restart all

# デプロイ完了
echo "✅ デプロイが完了しました！"
echo "📊 現在のステータス:"
pm2 status 