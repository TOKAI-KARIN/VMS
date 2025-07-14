#!/bin/bash

# バックアップスクリプト
# データベースとアプリケーションファイルの定期バックアップ

set -e

echo "💾 バックアップを開始します..."

# 設定変数
BACKUP_DIR="/var/backups/vehicle-management"
DATE=$(date '+%Y%m%d_%H%M%S')
DB_NAME="vehicle_management"
DB_USER="vehicle_user"
APP_DIR="/var/www/vehicle-management"

# バックアップディレクトリの作成
sudo mkdir -p $BACKUP_DIR
sudo chown $USER:$USER $BACKUP_DIR

# データベースのバックアップ
echo "🗄️ データベースをバックアップ中..."
DB_BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"
PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U $DB_USER -d $DB_NAME > $DB_BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ データベースバックアップ完了: $DB_BACKUP_FILE"
    
    # バックアップファイルを圧縮
    gzip $DB_BACKUP_FILE
    echo "📦 データベースバックアップを圧縮しました: ${DB_BACKUP_FILE}.gz"
else
    echo "❌ データベースバックアップに失敗しました"
    exit 1
fi

# アプリケーションファイルのバックアップ
echo "📁 アプリケーションファイルをバックアップ中..."
APP_BACKUP_FILE="$BACKUP_DIR/app_backup_$DATE.tar.gz"

# 重要なファイルのみをバックアップ
tar -czf $APP_BACKUP_FILE \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='uploads/*' \
    --exclude='*.log' \
    -C $APP_DIR .

if [ $? -eq 0 ]; then
    echo "✅ アプリケーションファイルバックアップ完了: $APP_BACKUP_FILE"
else
    echo "❌ アプリケーションファイルバックアップに失敗しました"
    exit 1
fi

# アップロードファイルのバックアップ（別途）
echo "📸 アップロードファイルをバックアップ中..."
UPLOADS_BACKUP_FILE="$BACKUP_DIR/uploads_backup_$DATE.tar.gz"

if [ -d "$APP_DIR/server/uploads" ]; then
    tar -czf $UPLOADS_BACKUP_FILE -C $APP_DIR/server uploads/
    echo "✅ アップロードファイルバックアップ完了: $UPLOADS_BACKUP_FILE"
else
    echo "⚠️ アップロードディレクトリが見つかりません"
fi

# 古いバックアップファイルの削除（7日以上古いもの）
echo "🧹 古いバックアップファイルを削除中..."
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_backup_*.tar.gz" -mtime +7 -delete

# バックアップサイズの確認
echo "📊 バックアップサイズ:"
du -h $BACKUP_DIR/*$DATE*

# バックアップ完了
echo "✅ バックアップが完了しました！"
echo "📁 バックアップディレクトリ: $BACKUP_DIR"
echo "🗄️ データベース: ${DB_BACKUP_FILE}.gz"
echo "📁 アプリケーション: $APP_BACKUP_FILE"
if [ -f "$UPLOADS_BACKUP_FILE" ]; then
    echo "📸 アップロードファイル: $UPLOADS_BACKUP_FILE"
fi

# バックアップログの記録
echo "$(date '+%Y-%m-%d %H:%M:%S') - バックアップ完了" >> $BACKUP_DIR/backup.log 