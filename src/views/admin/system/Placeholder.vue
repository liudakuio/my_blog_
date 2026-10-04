<!--
  系统管理占位页：后端暂未提供接口与数据表的功能（部门 / 岗位 / 日志）
  占位页：后端菜单里有、但前端尚未实现页面的系统资源（如 dept / post / log）会落到这里。
  引用关系：router/index.ts 中 SYSTEM_PAGES 未命中时的兜底组件。
-->
<template>
  <div class="sys-placeholder">
    <div class="ph-card">
      <el-icon class="ph-icon"><Setting /></el-icon>
      <h3 class="ph-title">{{ title }}</h3>
      <p class="ph-desc">该功能后端接口尚未提供，正在开发中。</p>
      <p class="ph-sub">待后端补表与接口后，此处将替换为正式管理页面。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Setting } from '@element-plus/icons-vue'

const route = useRoute()
const title = computed(() => (route.meta.title as string) || '功能开发中')
</script>

<style lang="less" scoped>
.sys-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
}

.ph-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  max-width: 30rem;
  padding: 3rem 2rem;
  border: 1px solid #ececec;
  border-radius: 14px;
  background: #fff;
  text-align: center;

  .dark & {
    background: #141414;
    border-color: #2a2a2a;
  }
}

.ph-icon {
  font-size: 40px;
  color: #9ca3af;
}

.ph-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;

  .dark & {
    color: #f0f0f0;
  }
}

.ph-desc {
  margin: 0;
  font-size: 13px;
  color: #4b5563;

  .dark & {
    color: #b5b5b5;
  }
}

.ph-sub {
  margin: 0;
  font-size: 12px;
  color: #9ca3af;
}
</style>
