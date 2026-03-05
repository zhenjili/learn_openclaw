# Skills 参考

Skills 是 OpenClaw Agent 的能力扩展单元。每个 Skill 封装一项具体功能，Agent 根据用户意图自动选择并调用合适的 Skill。

## Skill 目录结构

```
my-skill/
├── SKILL.md          # 描述文件（必需）
├── index.ts          # 入口文件（必需）
├── config.yaml       # 配置文件（可选）
└── test/             # 测试文件
```

## SKILL.md 文件格式

```markdown
---
name: weather-query
version: 1.2.0
description: 查询全球城市天气信息
author: openclaw-community
tags: [weather, utility]
triggers: ["天气", "weather", "温度"]
inputs:
  - name: city
    type: string
    required: true
  - name: days
    type: number
    default: 1
permissions: [network]
---
# Weather Query Skill
查询指定城市的天气预报信息。
```

## 配置选项

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | Skill 唯一标识符 |
| `version` | string | 是 | 语义化版本号 |
| `description` | string | 是 | 功能描述 |
| `author` | string | 是 | 作者名称 |
| `tags` | string[] | 否 | 分类标签 |
| `triggers` | string[] | 否 | 触发关键词 |
| `inputs` | object[] | 否 | 输入参数定义 |
| `outputs` | object[] | 否 | 输出参数定义 |
| `permissions` | string[] | 否 | 所需权限：network/filesystem/system |
| `dependencies` | string[] | 否 | 依赖的其他 Skill |

## 内置 Skills（49 个）

| 分类 | Skills |
|------|--------|
| **日常工具**（12） | weather-query, calculator, unit-converter, translator, timezone-converter, currency-exchange, qr-generator, url-shortener, password-generator, json-formatter, base64-codec, hash-generator |
| **文件管理**（8） | file-reader, file-writer, dir-browser, file-search, pdf-reader, csv-processor, image-viewer, file-compressor |
| **知识管理**（7） | doc-indexer, rag-search, note-taker, bookmark-manager, summary-generator, knowledge-graph, web-clipper |
| **任务管理**（8） | todo-manager, calendar-sync, reminder-setter, pomodoro-timer, habit-tracker, project-board, time-tracker, meeting-scheduler |
| **开发工具**（8） | code-runner, git-helper, api-tester, regex-tester, docker-manager, log-analyzer, db-query, ssh-connector |
| **网络通信**（6） | web-search, web-scraper, email-sender, rss-reader, notification-push, sms-sender |

## ClawHub 社区技能库

ClawHub 收录超过 **13,700** 个社区贡献的 Skills。

```bash
openclaw skill search "翻译"                          # 搜索
openclaw skill info clawhub/advanced-translator       # 查看详情
openclaw skill install clawhub/advanced-translator     # 安装
openclaw skill update clawhub/advanced-translator      # 更新
openclaw skill uninstall clawhub/advanced-translator   # 卸载
openclaw skill list --installed                        # 已安装列表
```

## 创建自定义 Skill

```typescript
import { defineSkill, SkillContext } from '@openclaw/sdk';

export default defineSkill({
  name: 'stock-price',
  description: '查询股票实时价格',
  inputs: {
    symbol: { type: 'string', required: true, description: '股票代码' },
    market: { type: 'string', default: 'US', description: '市场' },
  },
  async execute(ctx: SkillContext) {
    const { symbol, market } = ctx.inputs;
    const res = await ctx.fetch(`https://api.stockdata.com/v1/quote?symbol=${symbol}&market=${market}`);
    const data = await res.json();
    return {
      symbol: data.symbol,
      price: data.price,
      summary: `${data.symbol} 当前价格 $${data.price}，涨跌幅 ${data.change_percent}%`,
    };
  },
});
```

发布到 ClawHub：

```bash
openclaw skill validate ./my-skill    # 验证格式
openclaw skill publish ./my-skill     # 发布
```
