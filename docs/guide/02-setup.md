# 第二章：环境搭建

## 前置条件

在安装 OpenClaw 之前，请确保你的系统满足以下要求：

### 硬件要求

| 项目 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 双核处理器 | 四核及以上 |
| 内存 | 4 GB RAM | 8 GB RAM 及以上 |
| 磁盘 | 2 GB 可用空间 | 10 GB 可用空间 |
| 网络 | 可访问 LLM API | 稳定的宽带连接 |

### 软件要求

- **Node.js 22+**（必须）
- **Git**（必须）
- **npm** 或 **pnpm**（随 Node.js 安装）

检查你的环境是否满足要求：

```bash
# 检查 Node.js 版本（需要 22.0.0 或更高）
node --version
# 预期输出: v22.x.x 或更高

# 检查 npm 版本
npm --version
# 预期输出: 10.x.x 或更高

# 检查 Git 版本
git --version
# 预期输出: git version 2.x.x
```

如果你尚未安装 Node.js，推荐使用 **nvm** 进行管理：

```bash
# 安装 nvm（macOS / Linux）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# 重新加载 shell 配置
source ~/.bashrc  # 或 source ~/.zshrc

# 安装 Node.js 22
nvm install 22
nvm use 22

# 验证安装
node --version
```

## 安装 OpenClaw

OpenClaw 提供了三种安装方式，根据你的需求选择合适的方式。

### 方式一：一键安装脚本（推荐新手）

最简单的安装方式，一行命令搞定一切：

```bash
# macOS / Linux
curl -fsSL https://get.openclaw.dev | bash

# 安装完成后验证
openclaw --version
```

安装脚本会自动完成以下操作：
1. 检测系统环境
2. 安装 OpenClaw CLI
3. 创建默认配置目录 `~/.openclaw/`
4. 初始化基础配置文件

### 方式二：通过 npm 安装（推荐开发者）

如果你已经有 Node.js 环境，可以通过 npm 全局安装：

```bash
# 全局安装 OpenClaw
npm install -g @openclaw/cli

# 或者使用 npx 直接运行（无需全局安装）
npx @openclaw/cli@latest init

# 验证安装
openclaw --version
```

### 方式三：Docker 部署（推荐生产环境）

对于需要隔离环境或生产部署的场景，推荐使用 Docker：

```bash
# 拉取官方镜像
docker pull openclaw/openclaw:latest

# 创建数据目录
mkdir -p ~/.openclaw/data

# 运行容器
docker run -d \
  --name openclaw \
  -p 18789:18789 \
  -v ~/.openclaw:/root/.openclaw \
  -e OPENAI_API_KEY=your-api-key-here \
  openclaw/openclaw:latest

# 查看运行状态
docker logs openclaw
```

Docker Compose 方式（适合复杂部署）：

```yaml
# docker-compose.yml
version: '3.8'
services:
  openclaw:
    image: openclaw/openclaw:latest
    ports:
      - "18789:18789"
    volumes:
      - ./data:/root/.openclaw
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - OPENCLAW_LOG_LEVEL=info
    restart: unless-stopped
```

```bash
# 启动服务
docker compose up -d
```

## API Key 配置

OpenClaw 支持多家 LLM 提供商，你至少需要配置一个 API Key。

### 支持的 LLM 提供商

| 提供商 | 环境变量 | 获取地址 |
|--------|----------|----------|
| OpenAI | `OPENAI_API_KEY` | https://platform.openai.com/api-keys |
| Anthropic | `ANTHROPIC_API_KEY` | https://console.anthropic.com/ |
| Moonshot（月之暗面） | `MOONSHOT_API_KEY` | https://platform.moonshot.cn/ |
| DeepSeek | `DEEPSEEK_API_KEY` | https://platform.deepseek.com/ |
| 智谱 AI | `ZHIPU_API_KEY` | https://open.bigmodel.cn/ |

### 配置方法

**方法一：交互式配置（推荐）**

```bash
# 启动交互式配置向导
openclaw config setup

# 向导会引导你完成以下步骤：
# 1. 选择默认 LLM 提供商
# 2. 输入 API Key
# 3. 选择默认模型
# 4. 设置温度等参数
```

**方法二：环境变量**

```bash
# 在 shell 配置文件中添加（~/.zshrc 或 ~/.bashrc）
export OPENAI_API_KEY="sk-your-openai-key-here"
export ANTHROPIC_API_KEY="sk-ant-your-anthropic-key-here"

# 重新加载配置
source ~/.zshrc
```

**方法三：配置文件**

OpenClaw 的配置文件位于 `~/.openclaw/config.yaml`：

```yaml
# ~/.openclaw/config.yaml
llm:
  default_provider: openai
  providers:
    openai:
      api_key: "sk-your-openai-key-here"
      default_model: "gpt-4o"
      temperature: 0.7
      max_tokens: 4096
    anthropic:
      api_key: "sk-ant-your-anthropic-key-here"
      default_model: "claude-sonnet-4-20250514"
      temperature: 0.7
    moonshot:
      api_key: "sk-your-moonshot-key-here"
      default_model: "moonshot-v1-128k"

gateway:
  port: 18789
  host: "127.0.0.1"
  log_level: "info"

session:
  max_history: 100
  memory_type: "sliding_window"
```

::: warning 安全提示
永远不要将包含 API Key 的配置文件提交到 Git 仓库。OpenClaw 默认会在 `.gitignore` 中排除 `config.yaml` 文件。
:::

## 启动 Gateway

配置完成后，启动 OpenClaw Gateway：

```bash
# 启动 Gateway（前台运行，方便查看日志）
openclaw gateway start

# 或者以守护进程方式运行
openclaw gateway start --daemon

# 查看 Gateway 状态
openclaw gateway status

# 预期输出:
# OpenClaw Gateway v2.x.x
# Status: Running
# PID: 12345
# Port: 18789
# Uptime: 0h 0m 12s
```

Gateway 启动后的日志输出示例：

```
[INFO] OpenClaw Gateway v2.8.3 starting...
[INFO] Loading configuration from ~/.openclaw/config.yaml
[INFO] LLM provider initialized: openai (gpt-4o)
[INFO] Skills registry loaded: 156 skills available
[INFO] Gateway listening on http://127.0.0.1:18789
[INFO] Dashboard available at http://127.0.0.1:18789/dashboard
[INFO] Ready to accept connections.
```

## 访问 Dashboard

Gateway 启动后，打开浏览器访问 Dashboard：

```
http://127.0.0.1:18789/dashboard
```

Dashboard 提供了以下功能：

- **对话界面**：直接在浏览器中与 OpenClaw 对话
- **会话管理**：查看和管理所有活跃会话
- **Skills 浏览**：浏览和管理已安装的技能
- **配置面板**：在线修改 Gateway 配置
- **日志查看**：实时查看系统运行日志
- **性能监控**：查看 API 调用统计和响应时间

```mermaid
graph LR
    Browser["浏览器"] --> Dashboard["Dashboard\n:18789/dashboard"]
    Dashboard --> Chat["对话界面"]
    Dashboard --> Sessions["会话管理"]
    Dashboard --> Skills_UI["Skills 管理"]
    Dashboard --> Config["配置面板"]
    Dashboard --> Logs["日志查看"]
```

## 常见问题排查

### 问题 1：Node.js 版本过低

```bash
# 错误信息
Error: OpenClaw requires Node.js >= 22.0.0. Current version: 18.x.x

# 解决方案
nvm install 22
nvm use 22
```

### 问题 2：端口被占用

```bash
# 错误信息
Error: Port 18789 is already in use

# 查找占用端口的进程
lsof -i :18789

# 解决方案 1：终止占用进程
kill -9 <PID>

# 解决方案 2：使用其他端口
openclaw gateway start --port 18790
```

### 问题 3：API Key 无效

```bash
# 错误信息
Error: Authentication failed for provider 'openai'. Invalid API key.

# 验证 API Key
openclaw config test-key openai

# 重新设置 API Key
openclaw config set llm.providers.openai.api_key "sk-new-key-here"
```

### 问题 4：网络连接问题

如果你在中国大陆，可能需要配置代理：

```bash
# 设置代理
export HTTPS_PROXY=http://127.0.0.1:7890
export HTTP_PROXY=http://127.0.0.1:7890

# 或在 OpenClaw 配置中设置
openclaw config set network.proxy "http://127.0.0.1:7890"
```

### 问题 5：权限不足

```bash
# macOS 权限问题
# 错误信息: Permission denied: ~/.openclaw/

# 解决方案
chmod -R 755 ~/.openclaw/
```

## 验证安装

完成所有配置后，运行以下命令验证安装是否成功：

```bash
# 运行诊断检查
openclaw doctor

# 预期输出:
# [PASS] Node.js version: 22.x.x
# [PASS] npm version: 10.x.x
# [PASS] OpenClaw CLI: v2.x.x
# [PASS] Configuration file: ~/.openclaw/config.yaml
# [PASS] API Key (openai): valid
# [PASS] Gateway: running on port 18789
# [PASS] Dashboard: accessible
# All checks passed! OpenClaw is ready to use.
```

## 本章小结

在本章中，你完成了以下操作：

1. 确认了系统环境满足 **Node.js 22+** 的要求
2. 选择了合适的安装方式（一键脚本 / npm / Docker）
3. 配置了 **LLM API Key**
4. 启动了 **Gateway** 守护进程
5. 成功访问了 **Dashboard** 控制面板

接下来，我们将在下一章中开始与 OpenClaw 进行第一次对话。

---

> **上一章**：[认识 OpenClaw](/guide/01-intro) | **下一章**：[快速上手](/guide/03-quickstart)
