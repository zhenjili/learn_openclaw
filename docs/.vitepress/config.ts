import { defineConfig } from 'vitepress'
import contentMeta from '../../content-meta.json'

export default defineConfig({
  title: 'Learn OpenClaw',
  description: '从 0 开始学 OpenClaw - 综合文档站',
  lang: 'zh-CN',
  appearance: 'dark',
  themeConfig: {
    nav: [
      { text: '学习路径', link: '/guide/01-intro' },
      { text: '参考手册', link: '/reference/gateway' },
      { text: '管理', link: '/admin' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: contentMeta.guide.text,
          items: contentMeta.guide.items
        }
      ],
      '/reference/': [
        {
          text: contentMeta.reference.text,
          items: contentMeta.reference.items
        }
      ]
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/openclaw/openclaw' }
    ],
    outline: {
      level: [2, 3],
      label: '目录'
    },
    search: {
      provider: 'local'
    },
    footer: {
      message: 'Learn OpenClaw - 从 0 开始学 AI Agent',
      copyright: 'Built with VitePress'
    }
  }
})
