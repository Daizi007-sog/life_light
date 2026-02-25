# 自动备份说明

## 手动备份

```bash
npm run backup
```

或直接执行：

```bash
./scripts/backup-push.sh
```

## 自动定时备份（可选）

### 方式一：crontab（每日备份）

```bash
crontab -e
```

添加一行（每天 22:00 执行备份）：

```
0 22 * * * cd /Users/daizi/Desktop/Developer/life_light && npm run backup >> /tmp/life_light_backup.log 2>&1
```

### 方式二：macOS launchd（每日备份）

创建 `~/Library/LaunchAgents/com.life_light.backup.plist`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.life_light.backup</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-c</string>
    <string>cd /Users/daizi/Desktop/Developer/life_light && npm run backup</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>22</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>
</dict>
</plist>
```

加载并启用：

```bash
launchctl load ~/Library/LaunchAgents/com.life_light.backup.plist
```

## 前置条件

- 已配置远程仓库：`git remote add origin <URL>`
- 已配置 SSH 密钥或凭据（用于 `git push` 免密）
