<!--
  侧边栏：可折叠，由后端动态菜单渲染
  数据来源：userStore.menus 菜单树；只渲染 status === "0"（正常）的菜单。
  图标：后端存的是旧 Element UI 命名（el-icon-xxx），由 config/menu.ts 的 resolveIcon 映射为组件名。
  路由：由 config/menu.ts 的 menuRoutePath 推导（blog/siteText -> /admin/siteText）。
-->
<template>
  <aside class="admin-sidebar" :class="{ collapsed }">
    <!-- 品牌区 -->
    <div class="brand">
      <div class="brand-logo">L</div>
      <span v-show="!collapsed" class="brand-name">博客控制台</span>
    </div>

    <!-- 菜单 -->
    <el-scrollbar class="menu-scroll">
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :collapse-transition="false"
        router
        unique-opened
      >
        <SidebarItem v-for="m in visibleMenus" :key="m.menuId" :item="m" />
      </el-menu>
    </el-scrollbar>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/store/user'
import SidebarItem from './SidebarItem.vue'

defineProps<{ collapsed: boolean }>()

const route = useRoute()
const userStore = useUserStore()
const { menus } = storeToRefs(userStore)

const visibleMenus = computed(() => (menus.value || []).filter((m) => m.status === '0'))
const activeMenu = computed(() => route.path)
</script>

<style lang="less" scoped>
.admin-sidebar {
  width: 232px;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid #ececec;
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
  position: sticky;
  top: 0;

  .dark & {
    background: #141414;
    border-right-color: #2a2a2a;
  }

  &.collapsed {
    width: 64px;
  }
}

.brand {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
  border-bottom: 1px solid #ececec;

  .dark & {
    border-bottom-color: #2a2a2a;
  }
}

.brand-logo {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: #1a1a1a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;

  .dark & {
    background: #ffffff;
    color: #141414;
  }
}

.brand-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;

  .dark & {
    color: #f0f0f0;
  }
}

.menu-scroll {
  flex: 1;
  border-right: none;
}

:deep(.el-menu) {
  border-right: none;
  background: transparent;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  color: #4b4b4b;
  border-radius: 8px;
  margin: 4px 8px;
  height: 44px;
  transition: background 0.2s, color 0.2s;

  .dark & {
    color: #b5b5b5;
  }
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background: #f5f5f5;

  .dark & {
    background: #232323;
  }
}

:deep(.el-menu-item.is-active) {
  background: #1a1a1a;
  color: #ffffff;

  .dark & {
    background: #ffffff;
    color: #141414;
  }
}

:deep(.el-menu--collapse) {
  width: 64px;
}
</style>
