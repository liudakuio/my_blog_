<!-- 作品页：标题描述 + PortfolioGrid 作品网格（分类筛选、详情弹窗、灯箱） -->
<template>
  <div class="portfolio-page">
    <!-- 页面标题 + 描述 -->
    <div class="portfolio-header">
      <h1 class="portfolio-title">{{ pageData.title }}</h1>
      <p class="portfolio-desc">{{ pageData.description }}</p>
    </div>

    <!-- 作品网格：通过 URL query 参数控制初始筛选（如 ?filter=Photography） -->
    <PortfolioGrid :external-filter="routeFilter" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store/app'
import { PORTFOLIO_PAGE_DATA } from '@/data/portfolioPage'
import PortfolioGrid from '@/components/PortfolioGrid.vue'

const route = useRoute()
const appStore = useAppStore()

// 页面标题和描述（中英双语）
const pageData = computed(() => PORTFOLIO_PAGE_DATA[appStore.language])
// 从 URL query 参数获取筛选分类
const routeFilter = computed(() => (route.query.filter as string) || 'All')
</script>

<style lang="less" scoped>
.portfolio-page {
  width: 100%;
  max-width: 96vw;
  margin: 0 auto;
  padding-bottom: 5rem;
}

.portfolio-header {
  margin-bottom: 6rem;
}

.portfolio-title {
  font-size: 8vw;
  line-height: 1;
  font-weight: 900;
  margin: 0 0 2rem;
  color: #000000;
  transition: color 0.3s;

  .dark & {
    color: #ffffff;
  }
}

.portfolio-desc {
  max-width: 42rem;
  font-size: 1.5rem;
  font-weight: 500;
  color: #6b7280;
  transition: color 0.3s;

  .dark & {
    color: #9ca3af;
  }
}
</style>
