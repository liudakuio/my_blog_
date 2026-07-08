<!-- 根组件：挂载路由视图，初始化主题（根据时间自动切换深色/浅色） -->
<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/store/app'

const appStore = useAppStore()

onMounted(() => {
  appStore.initLanguage()
  appStore.initTheme()
})
</script>