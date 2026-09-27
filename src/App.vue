<!-- 根组件：挂载路由视图，初始化主题（访客端按时间自动切换；后台管理端默认白天），拉取站点全局数据 -->
<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store/app'
import { useSiteStore } from '@/store/site'

const route = useRoute()
const appStore = useAppStore()
const siteStore = useSiteStore()

// 后台管理端（/admin/**）默认白天：不随时间自动切换深色
const isAdmin = () => route.path.startsWith('/admin')

onMounted(() => {
  appStore.initLanguage()
  if (isAdmin()) {
    appStore.initAdminTheme()
  } else {
    appStore.initTheme()
  }
  // 全站共享数据：站点配置（导航/页脚/文案/联系方式）
  siteStore.loadConfig()
})

// 由访客端进入后台时切换为默认浅色；后台内部跳转不再覆盖用户的手动选择
let wasAdmin = isAdmin()
watch(
  () => route.path,
  () => {
    const nowAdmin = isAdmin()
    if (nowAdmin && !wasAdmin) {
      appStore.initAdminTheme()
    }
    wasAdmin = nowAdmin
  }
)
</script>