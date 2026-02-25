#!/bin/bash
# 自动备份并推送到远程仓库
# 用法: ./scripts/backup-push.sh 或 npm run backup

set -e
cd "$(dirname "$0")/.."

# 检查是否有远程仓库
if ! git remote get-url origin &>/dev/null; then
  echo "❌ 未配置远程仓库，请先执行: git remote add origin <你的仓库URL>"
  exit 1
fi

# 检查是否有未提交的更改（含未跟踪文件）
if [ -z "$(git status --porcelain)" ]; then
  # 无本地更改，检查是否有未推送的提交
  if git status | grep -q "Your branch is ahead of"; then
    echo "📤 无本地更改，正在推送已有提交..."
    git push origin "$(git branch --show-current)"
    echo "✅ 推送完成"
  else
    echo "✅ 工作区干净，无需备份"
  fi
  exit 0
fi

# 有更改：添加、提交、推送
BRANCH=$(git branch --show-current)
MSG="backup: $(date '+%Y-%m-%d %H:%M:%S')"

echo "📦 正在备份..."
git add -A
git commit -m "$MSG" || { echo "⚠️ 提交失败（可能无有效更改）"; exit 1; }
git push origin "$BRANCH"
echo "✅ 备份并推送完成: $MSG"
