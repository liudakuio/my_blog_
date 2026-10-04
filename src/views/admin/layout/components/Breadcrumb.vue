<!--
  面包屑：根据路由 matched 生成
  数据来源：vue-router 的 route.matched，取各层 meta.title 生成，无 title 的层级会被跳过。
-->
<template>
  <el-breadcrumb separator="/" class="admin-breadcrumb">
    <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">控制台</el-breadcrumb-item>
    <el-breadcrumb-item v-for="(item, idx) in titles" :key="idx">
      {{ item }}
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const titles = computed(() =>
  route.matched.filter((r) => r.meta?.title).map((r) => r.meta.title as string)
)
</script>

<style lang="less" scoped>
.admin-breadcrumb {
  font-size: 14px;

  :deep(.el-breadcrumb__inner) {
    color: #6b7280;
    font-weight: 400;
  }

  :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
    color: #1a1a1a;
    font-weight: 500;

    .dark & {
      color: #f0f0f0;
    }
  }
}
</style>
