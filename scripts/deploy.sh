#!/bin/bash
# AI Repo Radar — Local Cloudflare Deploy (Backup when GitHub Actions fails)
# Uses CLOUDFLARE_API_TOKEN from /home/claw/.openclaw/workspace/sancompany/secrets/.env

set -e

REPO_DIR="/home/claw/.openclaw/workspace/sancompany/aireporadar"
ENV_FILE="/home/claw/.openclaw/workspace/sancompany/secrets/.env"
LOG_FILE="/tmp/airepo_deploy.log"

cd "$REPO_DIR"

# Load env
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') ❌ CLOUDFLARE_API_TOKEN not found" >> "$LOG_FILE"
    exit 1
fi

# Sync with remote first
git fetch origin main --quiet 2>/dev/null || true
LOCAL_SHA=$(git rev-parse HEAD)
REMOTE_SHA=$(git rev-parse origin/main 2>/dev/null || echo "$LOCAL_SHA")

if [ "$LOCAL_SHA" != "$REMOTE_SHA" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') 🔄 Syncing with remote..." >> "$LOG_FILE"
    git reset --hard origin/main
fi

# Deploy
echo "$(date '+%Y-%m-%d %H:%M:%S') 🚀 Deploying to Cloudflare Pages..." >> "$LOG_FILE"
if npx wrangler pages deploy . --project-name ai-repo-radar --branch main >> "$LOG_FILE" 2>&1; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') ✅ Deployed successfully" >> "$LOG_FILE"
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') ❌ Deploy failed" >> "$LOG_FILE"
    exit 1
fi
