<!--
  侧边栏菜单项（递归渲染目录/菜单）
  递归组件：menuType 为 M（目录）时渲染成可展开子菜单，为 C（菜单）时渲染成可跳转项，叶子才生成路由。
-->
<template>
  <!-- 目录：含可见子节点 -> 折叠子菜单 -->
  <el-sub-menu v-if="hasVisibleChildren" :index="String(item.menuId)">
    <template #title>
      <el-icon><component :is="resolveIcon(item.icon)" /></el-icon>
      <span>{{ item.menuName }}</span>
    </template>
    <SidebarItem v-for="child in visibleChildren" :key="child.menuId" :item="child" />
  </el-sub-menu>

  <!-- 菜单（叶子）：可点击跳转 -->
  <el-menu-item v-else :index="menuRoutePath(item)">
    <el-icon><component :is="resolveIcon(item.icon)" /></el-icon>
    <template #title>{{ item.menuName }}</template>
  </el-menu-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MenuItem } from '@/api/auth'
import { resolveIcon, menuRoutePath } from '@/config/menu'

const props = defineProps<{ item: MenuItem }>()

const visibleChildren = computed(() =>
  (props.item.children || []).filter((c) => c.status === '0')
)
const hasVisibleChildren = computed(() => visibleChildren.value.length > 0)
</script>
