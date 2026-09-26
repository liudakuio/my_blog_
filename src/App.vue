<!-- 根组件：挂载路由视图，初始化主题（根据时间自动切换深色/浅色），拉取站点全局数据 -->
<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/store/app'
import { useSiteStore } from '@/store/site'

const appStore = useAppStore()
const siteStore = useSiteStore()

onMounted(() => {
  appStore.initLanguage()
  appStore.initTheme()
  // 全站共享数据：站点配置（导航/页脚/文案/联系方式）+ 音乐播放列表
  siteStore.loadConfig()
  siteStore.loadPlaylist()
})
</script>