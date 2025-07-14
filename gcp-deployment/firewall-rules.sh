#!/bin/bash

# GCP ファイアウォールルール設定スクリプト
# このスクリプトはGCPコンソールまたはgcloud CLIから実行してください

echo "🔥 GCP ファイアウォールルールを設定中..."

# プロジェクトIDを設定（実際のプロジェクトIDに変更してください）
PROJECT_ID="your-gcp-project-id"

# ファイアウォールルールの作成

# HTTPトラフィック (ポート80)
echo "📡 HTTPトラフィック (ポート80) のルールを作成中..."
gcloud compute firewall-rules create allow-http \
    --project=$PROJECT_ID \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:80 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=http-server

# HTTPSトラフィック (ポート443)
echo "🔒 HTTPSトラフィック (ポート443) のルールを作成中..."
gcloud compute firewall-rules create allow-https \
    --project=$PROJECT_ID \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:443 \
    --source-ranges=0.0.0.0/0 \
    --target-tags=https-server

# SSHトラフィック (ポート22)
echo "🔑 SSHトラフィック (ポート22) のルールを作成中..."
gcloud compute firewall-rules create allow-ssh \
    --project=$PROJECT_ID \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:22 \
    --source-ranges=0.0.0.0/0

# アプリケーション用の内部通信 (ポート3000, 3001)
echo "🔄 アプリケーション内部通信 (ポート3000, 3001) のルールを作成中..."
gcloud compute firewall-rules create allow-app-internal \
    --project=$PROJECT_ID \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:3000,tcp:3001 \
    --source-ranges=10.0.0.0/8

# データベース用の内部通信 (ポート5432)
echo "🗄️ データベース内部通信 (ポート5432) のルールを作成中..."
gcloud compute firewall-rules create allow-db-internal \
    --project=$PROJECT_ID \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:5432 \
    --source-ranges=10.0.0.0/8

echo "✅ ファイアウォールルールの設定が完了しました！"

# 作成されたルールの確認
echo "📋 作成されたファイアウォールルール:"
gcloud compute firewall-rules list --project=$PROJECT_ID

echo ""
echo "🔧 次のステップ:"
echo "1. VMインスタンスにネットワークタグを追加してください:"
echo "   - http-server"
echo "   - https-server"
echo ""
echo "2. または、VMインスタンス作成時に以下のコマンドを使用:"
echo "   gcloud compute instances create vehicle-management-server \\"
echo "       --project=$PROJECT_ID \\"
echo "       --zone=asia-northeast1-a \\"
echo "       --machine-type=e2-medium \\"
echo "       --network-interface=network-tier=PREMIUM,subnet=default \\"
echo "       --maintenance-policy=MIGRATE \\"
echo "       --provisioning-model=STANDARD \\"
echo "       --service-account=your-service-account@$PROJECT_ID.iam.gserviceaccount.com \\"
echo "       --scopes=https://www.googleapis.com/auth/devstorage.read_only,https://www.googleapis.com/auth/logging.write,https://www.googleapis.com/auth/monitoring.write,https://www.googleapis.com/auth/servicecontrol,https://www.googleapis.com/auth/service.management.readonly,https://www.googleapis.com/auth/trace.append \\"
echo "       --tags=http-server,https-server \\"
echo "       --create-disk=auto-delete=yes,boot=yes,device-name=vehicle-management-server,image=projects/ubuntu-os-cloud/global/images/family/ubuntu-2004-lts,mode=rw,size=20,type=projects/$PROJECT_ID/zones/asia-northeast1-a/diskTypes/pd-standard \\"
echo "       --no-shielded-secure-boot \\"
echo "       --shielded-vtpm \\"
echo "       --shielded-integrity-monitoring \\"
echo "       --labels=ec-src=vm_add-gcloud,ec-type=nd \\"
echo "       --reservation-affinity=any" 