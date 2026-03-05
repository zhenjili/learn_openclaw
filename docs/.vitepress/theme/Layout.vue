<script setup>
import DefaultTheme from 'vitepress/theme'
import AiChat from './components/AiChat.vue'

const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #layout-bottom>
      <AiChat />
    </template>
  </Layout>
</template>
