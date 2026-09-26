<!-- 顶部导航栏：折叠按钮 + 面包屑 + 全屏/主题/用户下拉 -->
<template>
  <header class="admin-navbar">
    <div class="left">
      <button class="icon-btn" :title="collapsed ? '展开菜单' : '收起菜单'" @click="$emit('toggle')">
        <el-icon><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
      </button>
      <Breadcrumb />
    </div>

    <div class="right">
      <button class="icon-btn" title="全屏" @click="toggleFullscreen">
        <el-icon><FullScreen /></el-icon>
      </button>
      <button class="icon-btn" :title="isDark ? '切换浅色' : '切换深色'" @click="toggleTheme">
        <el-icon><Moon v-if="!isDark" /><Sunny v-else /></el-icon>
      </button>
      <UserDropdown />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/store/app'
import Breadcrumb from './Breadcrumb.vue'
import UserDropdown from './UserDropdown.vue'

defineProps<{ collapsed: boolean }>()
defineEmits<{ toggle: [] }>()

const appStore = useAppStore()
const { isDark } = storeToRefs(appStore)
const toggleTheme = appStore.toggleTheme

const isFullscreen = computed(() => !!document.fullscreenElement)
function toggleFullscreen() {
  if (isFullscreen.value) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen()
  }
}
</script>

<style lang="less" scoped>
.admin-navbar {
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #ececec;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  position: sticky;
  top: 0;
  z-index: 10;

  .dark & {
    background: #141414;
    border-bottom-color: #2a2a2a;
  }
}

.left,
.right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 9px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #4b4b4b;
  transition: background 0.2s, color 0.2s;

  &:hover {
    background: #f5f5f5;
    color: #1a1a1a;
  }

  .dark & {
    color: #b5b5b5;

    &:hover {
      background: #232323;
      color: #fff;
    }
  }
}
</style>
