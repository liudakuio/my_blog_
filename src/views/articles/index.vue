<!-- 文章页：分类侧栏/标签筛选 + 文章卡片列表，支持日期排序 -->
<template>
  <div class="articles-page">
    <!-- 页面标题 + 描述 -->
    <div class="articles-header">
      <h1 class="articles-title">{{ pageData.title }}</h1>
      <p class="articles-desc">{{ pageData.description }}</p>
    </div>

    <div class="articles-layout">
      <!-- 桌面端：左侧分类侧栏（sticky 吸顶） -->
      <div class="sidebar-desktop">
        <div class="sidebar-sticky">
          <h3 class="sidebar-title">
            <el-icon :size="20"><Filter /></el-icon>
            {{ appStore.language === 'zh' ? '分类' : 'Categories' }}
          </h3>
          <div class="category-list">
            <button
              v-for="cat in categories"
              :key="cat"
              class="category-btn"
              :class="{ 'category-btn--active': filter === cat }"
              @click="filter = cat"
            >
              {{ articleLabels[cat] || cat }}
            </button>
          </div>
        </div>
      </div>

      <!-- 移动端：水平滚动分类标签 -->
      <div class="category-mobile">
        <button
          v-for="cat in categories"
          :key="cat"
          class="category-pill"
          :class="{ 'category-pill--active': filter === cat }"
          @click="filter = cat"
        >
          {{ articleLabels[cat] || cat }}
        </button>
      </div>

      <!-- 文章列表区域 -->
      <div class="article-list-wrap">
        <!-- 顶部：文章数量 + 日期排序切换 -->
        <div class="article-list-head">
          <div class="article-count">
            {{ filteredArticles.length }} {{ appStore.language === 'zh' ? '篇文章' : 'Articles' }}
          </div>
          <button
            class="sort-btn"
            @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
          >
            <el-icon :size="16"><Calendar /></el-icon>
            <span>{{ appStore.language === 'zh' ? '时间排序' : 'Date' }}</span>
            <el-icon :size="16"><ArrowUp v-if="sortOrder === 'asc'" /><ArrowDown v-else /></el-icon>
          </button>
        </div>

        <!-- 文章卡片列表 -->
        <div class="article-cards">
          <div
            v-for="article in filteredArticles"
            :key="article.id"
            class="article-card"
            @click="openLink(article.link)"
          >
            <!-- 文章卡片：封面图 + 标题 + 日期 -->
            <div class="article-card-inner">
              <!-- 封面图区域 -->
              <div class="article-cover">
                <img
                  v-if="article.coverImage"
                  :src="article.coverImage"
                  :alt="article.title"
                  loading="lazy"
                  class="article-cover-img"
                  referrerpolicy="no-referrer"
                />
                <!-- 无封面图时显示占位图标 -->
                <div v-else class="article-cover-placeholder">
                  <el-icon :size="32" class="article-cover-icon"><Reading /></el-icon>
                </div>
                <!-- 左上角分类标签 -->
                <div class="article-category-tag">
                  {{ (articleLabels[article.category] || article.category).split('|')[0].trim() }}
                </div>
              </div>
              <!-- 文字信息：标题 + 日期 -->
              <div class="article-info">
                <div>
                  <div class="article-info-head">
                    <h3 class="article-title">{{ article.title }}</h3>
                    <!-- hover 时显示的箭头 -->
                    <div class="article-arrow">
                      <el-icon><TopRight /></el-icon>
                    </div>
                  </div>
                </div>
                <!-- 底部：日期 + 来源 -->
                <div class="article-meta">
                  <span>{{ article.date || 'No Date' }}</span>
                  <span class="article-dot"></span>
                  <span class="article-source">Read on WeChat</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 无文章时的空状态 -->
        <div
          v-if="filteredArticles.length === 0"
          class="article-empty"
        >
          <p class="article-empty-text">{{ appStore.language === 'zh' ? '暂无文章' : 'No articles found' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Filter, Calendar, ArrowUp, ArrowDown, Reading, TopRight } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/app'
import { ARTICLES_PAGE_DATA, ARTICLE_DATA, ARTICLE_LABELS } from '@/data/articles'
import { ArticleCategory } from '@/types'

const appStore = useAppStore()
// 当前筛选分类
const filter = ref<string>('All')
// 日期排序方向：desc=最新优先，asc=最早优先
const sortOrder = ref<'asc' | 'desc'>('desc')

// 页面标题和描述
const pageData = computed(() => ARTICLES_PAGE_DATA[appStore.language])
// 所有可用分类
const categories = ['All', ...Object.values(ArticleCategory)]
// 分类标签的中英文映射
const articleLabels = computed(() => ARTICLE_LABELS[appStore.language])

// 获取文章的当前语言内容
function articleContent(article: any) {
  return appStore.language === 'zh' ? article.zh : article.en
}

// 在新标签页打开文章链接
function openLink(link: string) {
  window.open(link, '_blank')
}

// 筛选 + 排序后的文章列表
const filteredArticles = computed(() => {
  return ARTICLE_DATA
    .filter(a => filter.value === 'All' || a.common.category === filter.value)
    .sort((a, b) => {
      const dateA = new Date(a.common.date || 0).getTime()
      const dateB = new Date(b.common.date || 0).getTime()
      return sortOrder.value === 'asc' ? dateA - dateB : dateB - dateA
    })
    .map(a => ({
      ...a.common,
      ...articleContent(a)
    }))
})
</script>

<style lang="less" scoped>
.articles-page {
  width: 100%;
  max-width: 96vw;
  margin: 0 auto;
  padding-bottom: 5rem;
}

.articles-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 6rem;
  text-align: center;
}

.articles-title {
  margin: 0 0 2rem;
  font-size: 8vw;
  line-height: 1;
  font-weight: 900;
  color: #000000;
  transition: color 0.3s;

  .dark & {
    color: #ffffff;
  }
}

.articles-desc {
  max-width: 42rem;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
  color: #6b7280;
  transition: color 0.3s;

  .dark & {
    color: #9ca3af;
  }
}

.articles-layout {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2rem;

  @media (min-width: 1024px) {
    flex-direction: row;
    gap: 4rem;
  }
}

/* 桌面端分类侧栏 */
.sidebar-desktop {
  display: none;

  @media (min-width: 1024px) {
    display: block;
    width: 16rem;
    flex-shrink: 0;
  }
}

.sidebar-sticky {
  position: sticky;
  top: 8rem;
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 2rem;
  padding: 0 1rem;
  font-size: 1.25rem;
  font-weight: 900;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.category-btn {
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  border-radius: 0.75rem;
  text-align: left;
  font-size: 1.125rem;
  font-weight: 700;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    color: #000000;
    background: #f3f4f6;
  }

  .dark & {
    color: #6b7280;

    &:hover {
      color: #ffffff;
      background: #1f2937;
    }
  }

  &.category-btn--active {
    color: #ffffff;
    background: #000000;
    transform: scale(1.05);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);

    .dark & {
      color: #000000;
      background: #ffffff;
    }
  }
}

/* 移动端分类标签 */
.category-mobile {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
  padding: 1rem 0;
  margin-bottom: 2rem;
  position: sticky;
  top: 5rem;
  z-index: 30;
  background: rgba(255, 255, 255, 0.95);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);

  &::-webkit-scrollbar {
    display: none;
  }

  .dark & {
    background: rgba(0, 0, 0, 0.95);
  }

  @media (min-width: 1024px) {
    display: none;
  }
}

.category-pill {
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 9999px;
  background: none;
  white-space: nowrap;
  font-size: 0.875rem;
  font-weight: 700;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.3s;

  .dark & {
    border-color: #1f2937;
    color: #6b7280;
  }

  &.category-pill--active {
    border-color: #000000;
    background: #000000;
    color: #ffffff;

    .dark & {
      border-color: #ffffff;
      background: #ffffff;
      color: #000000;
    }
  }
}

/* 文章列表 */
.article-list-wrap {
  flex-grow: 1;
  max-width: 56rem;
}

.article-list-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;

  .dark & {
    border-color: #1f2937;
  }
}

.article-count {
  font-family: monospace;
  font-size: 0.875rem;
  color: #9ca3af;
}

.sort-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  background: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #4b5563;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background: #f3f4f6;
  }

  .dark & {
    color: #d1d5db;

    &:hover {
      background: #1f2937;
    }
  }
}

.article-cards {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.article-card {
  cursor: pointer;
}

.article-card-inner {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  height: auto;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 1rem;
  overflow: hidden;
  background: #ffffff;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
    transform: translateY(-0.25rem);
  }

  .dark & {
    background: rgba(17, 24, 39, 0.5);
    border-color: #1f2937;
  }

  @media (min-width: 768px) {
    flex-direction: row;
  }
}

.article-cover {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  aspect-ratio: 900 / 383;
  overflow: hidden;
  border-radius: 0.75rem;
  background: #f3f4f6;
  transform: translate3d(0, 0, 0);

  .dark & {
    background: #111827;
  }

  @media (min-width: 768px) {
    width: 45%;
  }
}

.article-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s;
  will-change: transform;

  .article-card:hover & {
    transform: scale(1.05);
  }
}

.article-cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f9fafb;

  .dark & {
    background: rgba(31, 41, 55, 0.5);
  }
}

.article-cover-icon {
  color: #d1d5db;

  .dark & {
    color: #4b5563;
  }
}

.article-category-tag {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  padding: 0.25rem 0.5rem;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 0.375rem;
  background: rgba(255, 255, 255, 0.9);
  color: #000000;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  .dark & {
    background: rgba(0, 0, 0, 0.9);
    color: #ffffff;
  }
}

.article-info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-grow: 1;
  min-width: 0;
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 1.5rem;
  }
}

.article-info-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.article-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 900;
  line-height: 1.375;
  color: #000000;
  transition: color 0.3s;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;

  .dark & {
    color: #ffffff;
  }

  .article-card:hover & {
    color: #4b5563;
  }

  .dark .article-card:hover & {
    color: #d1d5db;
  }

  @media (min-width: 768px) {
    font-size: 1.5rem;
  }
}

.article-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0.375rem;
  border-radius: 9999px;
  background: #000000;
  color: #ffffff;
  opacity: 0;
  transition: all 0.3s;

  .dark & {
    background: #ffffff;
    color: #000000;
  }

  .article-card:hover & {
    opacity: 1;
  }
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
  font-family: monospace;
  font-size: 0.75rem;
  color: #9ca3af;

  .dark & {
    border-color: #1f2937;
    color: #6b7280;
  }

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
}

.article-dot {
  width: 0.25rem;
  height: 0.25rem;
  border-radius: 9999px;
  background: #d1d5db;

  .dark & {
    background: #374151;
  }
}

.article-source {
  display: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (min-width: 768px) {
    display: inline;
  }
}

.article-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 16rem;
  margin-top: 2rem;
  border: 2px dashed #e5e7eb;
  border-radius: 1.5rem;
  color: #9ca3af;

  .dark & {
    color: #4b5563;
    border-color: #1f2937;
  }
}

.article-empty-text {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
}
</style>
