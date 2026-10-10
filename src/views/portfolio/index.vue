<!--
  作品页：标题描述 + PortfolioGrid 作品网格（分类筛选、详情弹窗、灯箱）
  数据来源：作品列表走 /api/projects（分类由后端筛选，切换分类时请求 ?category=xxx）；
  页头文案为本地写死。
  筛选：URL query ?filter=xxx 作为初始分类传入 PortfolioGrid，取值需与 /api/project-categories 的 value 一致。
-->
<template>
  <div class="portfolio-page">
    <div class="u-container">
      <!-- 页面标题 + 描述 -->
      <header class="portfolio-header">
        <p class="portfolio-eyebrow">SELECTED WORKS</p>
        <h1 class="portfolio-title">{{ pageData.title }}</h1>
        <p class="portfolio-desc">{{ pageData.description }}</p>
      </header>

      <!-- 作品网格：通过 URL query 参数控制初始筛选（如 ?filter=Photography） -->
      <PortfolioGrid :external-filter="routeFilter" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store/app'
import type { Language } from '@/types'

interface PortfolioPageContent {
  title: string
  description: string
}

const PORTFOLIO_PAGE_DATA: Record<Language, PortfolioPageContent> = {
  zh: { title: '作品', description: '路上拍的照片、应用开发作品和美食。' },
  en: { title: 'Portfolio', description: 'Photos taken on the road, application development works, and food.' }
}
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
  padding-bottom: 4rem;
}

.portfolio-header {
  margin-bottom: 3rem;

  @media (min-width: 1024px) {
    margin-bottom: 4rem;
  }
}

.portfolio-eyebrow {
  margin: 0 0 1rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--accent-text);
}

.portfolio-title {
  margin: 0 0 1.5rem;
  font-family: var(--font-display);
  font-size: clamp(3rem, 11vw, 7rem);
  line-height: 0.9;
  font-weight: 900;
  letter-spacing: -0.045em;
  color: var(--fg);
}

.portfolio-desc {
  max-width: 40rem;
  margin: 0;
  font-size: 1.0625rem;
  line-height: 1.75;
  color: var(--fg-muted);

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
}
</style>
