# 第六章：日程与任务管理

## Cron 定时任务

OpenClaw 内置了强大的定时任务系统，基于标准的 Cron 表达式，让你可以在指定的时间自动执行各种操作。

### Cron 表达式基础

Cron 表达式由 5 个字段组成：

```
┌──────── 分钟 (0-59)
│ ┌────── 小时 (0-23)
│ │ ┌──── 日期 (1-31)
│ │ │ ┌── 月份 (1-12)
│ │ │ │ ┌ 星期 (0-7, 0和7都是周日)
│ │ │ │ │
* * * * *
```

常用示例：

| 表达式 | 含义 |
|--------|------|
| `0 9 * * *` | 每天早上 9:00 |
| `0 9 * * 1-5` | 每个工作日早上 9:00 |
| `30 8,12,18 * * *` | 每天 8:30、12:30、18:30 |
| `0 */2 * * *` | 每隔 2 小时 |
| `0 9 1 * *` | 每月 1 日早上 9:00 |
| `0 0 * * 0` | 每周日午夜 |

### 创建定时任务

```bash
# 通过命令行创建定时任务
openclaw task create \
  --name "每日早报" \
  --cron "0 8 * * 1-5" \
  --action "生成今日工作日报摘要并发送到 Slack #daily-report"

# 查看所有定时任务
openclaw task list
```

也可以在对话中直接创建：

```
You > 每个工作日早上 8 点，帮我整理昨天的 GitHub 通知摘要

OpenClaw > 我已创建定时任务：
- 任务名称：GitHub 通知摘要
- 执行时间：每周一至周五 08:00
- Cron 表达式：0 8 * * 1-5
- 操作：
  1. 获取过去 24 小时的 GitHub 通知
  2. 按仓库和类型分类整理
  3. 生成摘要报告
  4. 通过 Dashboard 通知展示

确认创建吗？[Y/n]
```

### 任务配置文件

定时任务也可以通过配置文件管理：

```yaml
# ~/.openclaw/tasks/daily-briefing.yaml
name: "每日早报"
description: "工作日早间信息汇总"
enabled: true
schedule:
  cron: "0 8 * * 1-5"
  timezone: "Asia/Shanghai"

action:
  type: "prompt"
  prompt: |
    请为我生成今日早报，包含以下内容：
    1. 查看我的日历，列出今天的会议安排
    2. 检查未读邮件中的重要邮件（标记为重要或来自管理层）
    3. 查看 GitHub 上我负责的仓库是否有新的 PR 需要 Review
    4. 今天的天气预报

    请用简洁的格式输出，标注优先级。

output:
  channels:
    - type: "notification"
      title: "📋 每日早报"
    - type: "slack"
      channel: "#personal"

retry:
  max_attempts: 3
  delay: 300  # 失败后 5 分钟重试
```

## 提醒与通知

### 快速设置提醒

在对话中自然语言设置提醒是最简单的方式：

```
You > 30 分钟后提醒我去开会

OpenClaw > 已设置提醒：
- 时间：2026-03-04 15:30
- 内容：去开会
- 通知方式：Dashboard 弹窗 + 系统通知

You > 每天下午 5:45 提醒我写日报

OpenClaw > 已设置重复提醒：
- 时间：每天 17:45
- 内容：写日报
- Cron 表达式：45 17 * * *
```

### 条件提醒

除了定时提醒，OpenClaw 还支持基于条件触发的提醒：

```yaml
# ~/.openclaw/tasks/conditional-reminder.yaml
name: "PR Review 提醒"
description: "当有新的 PR 需要 Review 时提醒"

trigger:
  type: "poll"
  interval: 600  # 每 10 分钟检查一次
  condition:
    type: "prompt"
    prompt: "检查 GitHub 上是否有新的 PR 指定我为 Reviewer"

action:
  type: "prompt"
  prompt: "通知我有新的 PR 需要 Review，并简要说明 PR 内容"
  only_if_changed: true  # 仅在状态变化时通知
```

### 通知渠道配置

```yaml
# ~/.openclaw/config.yaml
notifications:
  channels:
    # 系统通知（macOS/Linux/Windows 原生通知）
    system:
      enabled: true
      sound: true

    # Dashboard 弹窗
    dashboard:
      enabled: true
      persist: true  # 弹窗是否持久显示

    # Slack 通知
    slack:
      enabled: true
      webhook_url: "https://hooks.slack.com/services/T.../B.../xxx"
      default_channel: "#notifications"

    # 邮件通知
    email:
      enabled: false
      smtp_host: "smtp.gmail.com"
      smtp_port: 587
      from: "openclaw@example.com"
      to: "user@example.com"

    # Telegram 通知
    telegram:
      enabled: false
      bot_token: "your-bot-token"
      chat_id: "your-chat-id"
```

## 任务自动化模式

### 模式一：定期数据采集与报告

```yaml
# 每周五下午生成周报
name: "周度报告"
schedule:
  cron: "0 16 * * 5"
  timezone: "Asia/Shanghai"

action:
  type: "chain"  # 链式操作
  steps:
    - name: "收集 Git 提交记录"
      prompt: "获取本周我在所有仓库的 Git 提交记录"
    - name: "收集完成的任务"
      prompt: "查看本周已完成的 Jira/Linear 任务"
    - name: "生成周报"
      prompt: |
        基于上述信息，生成本周工作周报：
        1. 本周完成的主要工作
        2. 遇到的问题和解决方案
        3. 下周计划
        请使用 Markdown 格式。
    - name: "保存和通知"
      prompt: "将周报保存到 ~/Documents/weekly-reports/ 目录，并发送到 Slack"
```

### 模式二：监控与告警

```yaml
# 每 5 分钟检查服务健康状态
name: "服务健康检查"
schedule:
  cron: "*/5 * * * *"

action:
  type: "prompt"
  prompt: |
    请检查以下服务的健康状态：
    1. 向 https://api.example.com/health 发送 GET 请求
    2. 检查响应状态码和响应时间
    3. 如果状态码不是 200 或响应时间超过 2 秒，生成告警

output:
  only_on_error: true  # 仅在异常时通知
  channels:
    - type: "slack"
      channel: "#alerts"
    - type: "system"
```

### 模式三：数据定期备份

```yaml
# 每天凌晨 2 点备份知识库
name: "知识库备份"
schedule:
  cron: "0 2 * * *"

action:
  type: "chain"
  steps:
    - name: "导出知识库"
      prompt: "导出所有知识库数据到 ~/Backups/openclaw/kb/"
    - name: "压缩备份"
      command: "tar -czf ~/Backups/openclaw/kb-$(date +%Y%m%d).tar.gz ~/Backups/openclaw/kb/"
    - name: "清理旧备份"
      command: "find ~/Backups/openclaw/ -name 'kb-*.tar.gz' -mtime +30 -delete"
    - name: "验证"
      prompt: "检查今日备份文件是否创建成功，报告文件大小"
```

## 日历服务集成

### 连接 Google Calendar

```bash
# 安装日历集成 Skill
openclaw skills install @openclaw/skill-google-calendar

# 配置 OAuth 认证
openclaw config set integrations.google.client_id "your-client-id"
openclaw config set integrations.google.client_secret "your-client-secret"

# 授权
openclaw auth google-calendar
```

### 日历操作示例

```
You > 查看我今天的日程安排

OpenClaw > [Skill: google-calendar.list_events]
今天（2026-03-04，周三）的日程安排：

| 时间 | 事件 | 地点 |
|------|------|------|
| 09:00-09:30 | 晨会 | 会议室 A |
| 10:00-11:30 | 产品评审会 | 线上 (Zoom) |
| 14:00-15:00 | 1:1 与张经理 | 咖啡厅 |
| 16:00-17:00 | 技术分享 | 会议室 B |

空闲时段：11:30-14:00, 15:00-16:00, 17:00 后

You > 帮我在明天下午 3 点创建一个会议，主题是"API 设计讨论"，
      邀请 alice@company.com 和 bob@company.com

OpenClaw > [Skill: google-calendar.create_event]
已创建会议：
- 主题：API 设计讨论
- 时间：2026-03-05 15:00-16:00
- 参与者：alice@company.com, bob@company.com
- 日历邀请已发送
```

### 日历与任务联动

```yaml
# 会议前自动准备议题
name: "会议准备提醒"
schedule:
  cron: "*/30 * * * *"  # 每 30 分钟检查

action:
  type: "prompt"
  prompt: |
    查看未来 30 分钟内是否有日历事件。
    如果有，请：
    1. 提取会议主题和参与者信息
    2. 检查是否有相关的准备文档
    3. 生成简要的会议议程提醒
    4. 通过系统通知发送给我
```

## 实战案例

### 案例一：每日工作日报自动化

```yaml
name: "自动工作日报"
schedule:
  cron: "0 18 * * 1-5"
  timezone: "Asia/Shanghai"

action:
  type: "chain"
  steps:
    - name: "收集今日提交"
      prompt: |
        查看今天我在以下目录的 Git 提交记录：
        - ~/Projects/frontend
        - ~/Projects/backend
        - ~/Projects/infra
    - name: "收集完成任务"
      prompt: "查看今天关闭的 GitHub Issues 和合并的 PR"
    - name: "生成日报"
      prompt: |
        根据以上信息，生成工作日报：
        ## 今日完成
        （列出完成的工作）
        ## 进行中
        （列出正在进行的工作）
        ## 明日计划
        （基于日历和未完成任务推断）
        ## 问题与风险
        （如有异常的构建失败等）
    - name: "保存日报"
      prompt: "将日报保存到 ~/Documents/daily-reports/2026-03-04.md"

output:
  channels:
    - type: "slack"
      channel: "#daily-standup"
```

### 案例二：定期代码质量检查

```yaml
name: "代码质量周检"
schedule:
  cron: "0 9 * * 1"  # 每周一上午 9 点

action:
  type: "chain"
  steps:
    - name: "分析代码"
      prompt: |
        分析 ~/Projects/myapp 项目的代码质量：
        1. 检查 TypeScript 类型覆盖率
        2. 查找重复代码
        3. 检测过长的函数（超过 50 行）
        4. 统计 TODO/FIXME 注释数量
    - name: "与上周对比"
      prompt: "对比上周的检查结果，标注改善和退步的指标"
    - name: "生成报告"
      prompt: "生成代码质量周报，包含趋势图数据"

output:
  channels:
    - type: "notification"
      title: "代码质量周报"
```

## 任务管理命令参考

```bash
# 任务列表
openclaw task list                    # 列出所有任务
openclaw task list --status active    # 仅列出活跃任务

# 任务操作
openclaw task enable <task-id>        # 启用任务
openclaw task disable <task-id>       # 停用任务
openclaw task run <task-id>           # 立即执行一次
openclaw task delete <task-id>        # 删除任务

# 任务日志
openclaw task logs <task-id>          # 查看执行日志
openclaw task logs <task-id> --last 5 # 查看最近 5 次日志

# 示例输出
# Task: 每日早报 (task_001)
# ─────────────────────
# Status: active
# Schedule: 0 8 * * 1-5
# Next run: 2026-03-05 08:00:00
# Last run: 2026-03-04 08:00:12 (success, 12.3s)
# Total runs: 45
# Success rate: 97.8%
```

## 本章小结

在本章中，你学习了：

1. **Cron 定时任务**：使用标准 Cron 表达式创建定时执行的自动化任务
2. **提醒与通知**：支持定时提醒和条件触发提醒，可推送到多个渠道
3. **任务自动化模式**：定期报告、监控告警、数据备份等实用场景
4. **日历集成**：与 Google Calendar 等服务联动，实现日程管理
5. **实战案例**：工作日报自动化、代码质量周检等真实场景

---

> **上一章**：[知识库管理](/guide/05-knowledge-base) | **下一章**：[自动化工作流](/guide/07-automation)
