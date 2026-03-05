# 第九章：安全配置与最佳实践

## 安全概述

OpenClaw 作为一个本地优先的 AI Agent 框架，拥有访问文件系统、执行命令、调用外部 API 等强大能力。这些能力在提升效率的同时，也引入了潜在的安全风险。本章将系统性地介绍如何安全地部署和运维 OpenClaw。

### 为什么安全配置至关重要？

- **文件系统访问**：Agent 可以读写本地文件，错误配置可能导致敏感数据泄露
- **API Key 暴露**：LLM 提供商的密钥一旦泄露，可能产生高额费用
- **命令执行**：Agent 具备执行 Shell 命令的能力，需要严格的沙箱限制
- **多用户场景**：共享环境下的 Session 隔离不当会造成数据交叉访问

## Gateway 安全配置

Gateway 是 OpenClaw 对外暴露服务的入口，必须做好安全加固。

### TLS 加密

始终为 Gateway 启用 TLS，防止中间人攻击：

```yaml
# ~/.openclaw/gateway.yaml
gateway:
  host: "0.0.0.0"
  port: 8443
  tls:
    enabled: true
    cert_file: "/etc/openclaw/certs/server.crt"
    key_file: "/etc/openclaw/certs/server.key"
    min_version: "TLS1.2"
```

生成自签名证书（仅用于开发环境）：

```bash
openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt \
  -days 365 -nodes -subj "/CN=localhost"
```

### 认证配置

为 Gateway 启用 Bearer Token 认证，防止未授权访问：

```yaml
# ~/.openclaw/gateway.yaml
gateway:
  auth:
    enabled: true
    method: "bearer"
    tokens:
      - name: "admin-token"
        value: "${OPENCLAW_ADMIN_TOKEN}"
        permissions: ["admin"]
      - name: "readonly-token"
        value: "${OPENCLAW_READONLY_TOKEN}"
        permissions: ["read"]
```

### 访问控制（ACL）

通过 IP 白名单和速率限制进一步收紧访问：

```yaml
gateway:
  access_control:
    allowed_ips:
      - "127.0.0.1"
      - "192.168.1.0/24"
    rate_limit:
      requests_per_minute: 60
      burst: 10
```

## API Key 安全管理

### 使用环境变量存储密钥

绝不要将 API Key 硬编码在配置文件中。始终使用环境变量：

```bash
# 在 ~/.zshrc 或 ~/.bashrc 中设置
export OPENAI_API_KEY="sk-xxxxxxxxxxxxxxxx"
export ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxxxxxx"
```

在 OpenClaw 配置中引用环境变量：

```yaml
# ~/.openclaw/config.yaml
providers:
  openai:
    api_key: "${OPENAI_API_KEY}"
  anthropic:
    api_key: "${ANTHROPIC_API_KEY}"
```

### 密钥轮换

定期轮换 API Key 是安全运维的基本要求。建议使用脚本自动化轮换流程：

```bash
#!/bin/bash
# rotate-keys.sh - API Key 轮换脚本

NEW_KEY=$(openai api keys create --name "openclaw-$(date +%Y%m%d)" --output json | jq -r '.key')

# 更新环境变量
sed -i '' "s/OPENAI_API_KEY=.*/OPENAI_API_KEY=\"${NEW_KEY}\"/" ~/.zshrc

# 重启 OpenClaw 使新密钥生效
openclaw gateway restart

echo "API Key 已轮换，旧密钥请在确认新密钥生效后手动撤销"
```

### 最小权限原则

为不同的 Agent 分配不同权限级别的 API Key：

```yaml
agents:
  code_assistant:
    provider: "openai"
    api_key: "${OPENAI_KEY_LIMITED}"   # 仅允许 GPT-4o-mini
    allowed_models: ["gpt-4o-mini"]
  research_agent:
    provider: "anthropic"
    api_key: "${ANTHROPIC_KEY_FULL}"
    allowed_models: ["claude-sonnet-4-20250514"]
```

## 文件系统权限和沙箱配置

### 限制文件访问范围

通过 `sandbox` 配置限制 Agent 可访问的目录：

```yaml
# ~/.openclaw/config.yaml
sandbox:
  enabled: true
  file_access:
    allowed_paths:
      - "${HOME}/projects"
      - "${HOME}/Documents/notes"
    denied_paths:
      - "${HOME}/.ssh"
      - "${HOME}/.aws"
      - "${HOME}/.gnupg"
      - "/etc"
      - "/var"
    read_only_paths:
      - "${HOME}/.openclaw/config.yaml"
```

### 命令执行沙箱

限制 Agent 可以执行的 Shell 命令：

```yaml
sandbox:
  command_execution:
    enabled: true
    allowed_commands:
      - "ls"
      - "cat"
      - "grep"
      - "find"
      - "git"
      - "npm"
      - "python3"
    blocked_commands:
      - "rm -rf"
      - "sudo"
      - "chmod 777"
      - "curl | bash"
    max_execution_time: 30  # 秒
```

## 网络安全

### 端口暴露控制

默认情况下，OpenClaw Gateway 应仅监听本地回环地址：

```yaml
gateway:
  host: "127.0.0.1"  # 仅本地访问
  port: 8080
```

如需对外暴露，务必配合防火墙规则：

```bash
# macOS - 使用 pf 限制访问
echo "block in on en0 proto tcp from any to any port 8080" | sudo pfctl -ef -

# Linux - 使用 iptables
sudo iptables -A INPUT -p tcp --dport 8080 -s 192.168.1.0/24 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8080 -j DROP
```

### 反向代理配置

生产环境建议使用 Nginx 作为反向代理：

```nginx
# /etc/nginx/conf.d/openclaw.conf
server {
    listen 443 ssl;
    server_name openclaw.example.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket 支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Skills 安全审计

### 第三方技能风险

安装第三方 Skills 前，务必进行安全审查：

```bash
# 查看 Skill 的权限声明
openclaw skill inspect <skill-name>

# 查看 Skill 源码
openclaw skill source <skill-name>

# 以沙箱模式试运行
openclaw skill run --sandbox --dry-run <skill-name>
```

### 权限审查配置

为 Skills 设置权限白名单，限制其可调用的系统能力：

```yaml
# ~/.openclaw/skills-policy.yaml
skills:
  default_policy: "restricted"
  policies:
    restricted:
      file_access: false
      network_access: false
      command_execution: false
    standard:
      file_access: true
      network_access: true
      command_execution: false
    trusted:
      file_access: true
      network_access: true
      command_execution: true

  overrides:
    - skill: "official/file-manager"
      policy: "standard"
    - skill: "community/web-scraper"
      policy: "restricted"
```

## 多用户环境安全

### Session 隔离

在多用户部署中，确保每个用户的 Session 完全隔离：

```yaml
# ~/.openclaw/multi-user.yaml
multi_user:
  enabled: true
  session_isolation: "strict"
  storage:
    type: "per-user"
    base_path: "/var/openclaw/users"
  token:
    algorithm: "HS256"
    secret: "${OPENCLAW_JWT_SECRET}"
    expiration: 3600  # 1 小时过期
    refresh_enabled: true
    refresh_expiration: 86400  # 24 小时
```

### Token 管理

实施严格的 Token 生命周期管理：

```bash
# 生成用户 Token
openclaw user token create --user alice --expires 24h

# 查看活跃 Token
openclaw user token list --active

# 撤销指定 Token
openclaw user token revoke --token-id <id>

# 撤销用户所有 Token（紧急情况）
openclaw user token revoke-all --user alice
```

## 日志和审计

### 敏感信息脱敏

配置日志脱敏规则，防止 API Key 和用户数据出现在日志中：

```yaml
# ~/.openclaw/logging.yaml
logging:
  level: "info"
  output: "/var/log/openclaw/app.log"
  redaction:
    enabled: true
    patterns:
      - name: "api_key"
        regex: "(sk-[a-zA-Z0-9]{20,})"
        replacement: "sk-****REDACTED****"
      - name: "bearer_token"
        regex: "(Bearer\\s+[a-zA-Z0-9._-]+)"
        replacement: "Bearer ****REDACTED****"
      - name: "email"
        regex: "([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+)"
        replacement: "****@****.***"
```

### 审计追踪

启用审计日志记录所有关键操作：

```yaml
logging:
  audit:
    enabled: true
    output: "/var/log/openclaw/audit.log"
    events:
      - "user.login"
      - "user.logout"
      - "agent.command_execute"
      - "agent.file_access"
      - "skill.install"
      - "skill.execute"
      - "config.change"
      - "token.create"
      - "token.revoke"
```

查看审计日志：

```bash
# 查看最近的文件访问记录
openclaw audit log --filter "agent.file_access" --last 24h

# 导出审计报告
openclaw audit export --format csv --from 2026-03-01 --to 2026-03-04
```

## 安全检查清单

部署或升级 OpenClaw 时，请逐项确认以下清单：

| 检查项 | 类别 | 优先级 | 说明 |
|--------|------|--------|------|
| TLS 已启用 | 网络 | 高 | Gateway 必须使用 HTTPS |
| API Key 使用环境变量 | 密钥 | 高 | 禁止硬编码在配置文件中 |
| 文件系统沙箱已启用 | 权限 | 高 | 限制 Agent 可访问的目录 |
| `.ssh`/`.aws` 目录已排除 | 权限 | 高 | 敏感凭证目录必须禁止访问 |
| Gateway 认证已启用 | 认证 | 高 | 防止未授权访问 |
| 命令执行白名单已配置 | 权限 | 高 | 限制可执行的 Shell 命令 |
| 日志脱敏已启用 | 日志 | 中 | 防止密钥出现在日志中 |
| 审计日志已启用 | 审计 | 中 | 记录关键操作便于追溯 |
| IP 白名单已配置 | 网络 | 中 | 限制可访问的 IP 范围 |
| 速率限制已配置 | 网络 | 中 | 防止滥用和 DDoS |
| Token 过期时间合理 | 认证 | 中 | 建议不超过 24 小时 |
| 第三方 Skills 已审查 | 技能 | 中 | 安装前检查权限和源码 |
| API Key 定期轮换 | 密钥 | 低 | 建议每 90 天轮换一次 |
| 反向代理已配置 | 网络 | 低 | 生产环境推荐使用 Nginx |

## 常见安全问题和解决方案

### 问题一：Agent 意外访问了敏感文件

**现象**：Agent 在执行任务时读取了 `~/.ssh/id_rsa` 或 `~/.aws/credentials`。

**解决方案**：立即启用文件系统沙箱，并将敏感目录加入 `denied_paths`：

```bash
# 检查是否有敏感文件被访问
openclaw audit log --filter "agent.file_access" --path "~/.ssh/*"

# 确认沙箱配置已生效
openclaw config validate --section sandbox
```

### 问题二：API Key 出现在日志中

**现象**：在排查问题时发现日志文件中包含明文 API Key。

**解决方案**：启用日志脱敏并清理已有日志：

```bash
# 搜索并清理包含密钥的日志
grep -rl "sk-" /var/log/openclaw/ | xargs -I{} sed -i '' 's/sk-[a-zA-Z0-9]*/sk-REDACTED/g' {}

# 轮换已暴露的 API Key
# 前往对应服务商控制台撤销旧密钥并生成新密钥
```

### 问题三：Gateway 被外部扫描探测

**现象**：日志中出现大量来自未知 IP 的请求。

**解决方案**：确认 Gateway 未直接暴露到公网，并配置防火墙：

```bash
# 检查当前监听状态
lsof -i :8080

# 确认仅监听 127.0.0.1
openclaw config get gateway.host
# 期望输出：127.0.0.1
```

### 问题四：第三方 Skill 行为异常

**现象**：某个社区 Skill 发起了预期外的网络请求。

**解决方案**：将该 Skill 降级为 `restricted` 策略，并上报社区：

```bash
# 立即停用可疑 Skill
openclaw skill disable <skill-name>

# 查看该 Skill 的历史行为
openclaw audit log --filter "skill.execute" --skill <skill-name>

# 上报给社区维护者
openclaw skill report --reason "unexpected-network-access" <skill-name>
```

### 问题五：多用户环境中 Session 数据泄露

**现象**：用户 A 能看到用户 B 的对话历史。

**解决方案**：确认 Session 隔离模式为 `strict`，并重置受影响的 Session：

```bash
# 验证隔离配置
openclaw config get multi_user.session_isolation
# 期望输出：strict

# 清除受影响用户的 Session
openclaw user session clear --user alice
openclaw user session clear --user bob
```

## 小结

安全配置不是一次性的工作，而是持续的过程。建议：

1. **定期审计**：每月检查一次安全检查清单
2. **及时更新**：关注 OpenClaw 的安全公告，及时升级到最新版本
3. **最小权限**：始终遵循最小权限原则，只授予 Agent 完成任务所需的最低权限
4. **纵深防御**：不要依赖单一安全措施，多层防护才能有效降低风险
