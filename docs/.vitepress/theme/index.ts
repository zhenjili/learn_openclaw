import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import KnowledgeAdmin from './components/KnowledgeAdmin.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('KnowledgeAdmin', KnowledgeAdmin)
  }
} satisfies Theme
