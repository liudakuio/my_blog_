<!--
  文章页：分类侧栏/标签筛选 + 目录式文章条目列表，支持日期排序
  数据来源：列表与分类走 articleStore（/api/articles 分页、/api/article-categories）；页头文案为本地写死。
  注意：分类筛选与日期排序都由服务端处理，切换后重新请求，前端不做本地排序。
-->
<template>
  <div class="articles-page">
    <div class="u-container">
      <!-- 页面标题 + 描述 -->
      <header class="articles-header">
        <p class="articles-eyebrow">WRITINGS</p>
        <h1 class="articles-title">{{ pageData.title }}</h1>
        <p class="articles-desc">{{ pageData.description }}</p>
      </header>

      <div class="articles-layout">
        <!-- 桌面端：左侧分类侧栏（sticky 吸顶） -->
        <div class="sidebar-desktop">
          <div class="sidebar-sticky">
            <h3 class="sidebar-title">
              <el-icon :size="18"><Filter /></el-icon>
              {{ appStore.language === 'zh' ? '分类' : 'Categories' }}
            </h3>
            <div class="category-list">
              <button
                v-for="cat in categories"
                :key="cat"
                class="category-btn"
                :class="{ 'category-btn--active': filter === cat }"
                @click="selectCategory(cat)"
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
            @click="selectCategory(cat)"
          >
            {{ articleLabels[cat] || cat }}
          </button>
        </div>

        <!-- 文章列表区域 -->
        <div class="article-list-wrap">
          <!-- 顶部：文章数量 + 日期排序切换 -->
          <div class="article-list-head">
            <div class="article-count">
              {{ articleStore.total }} {{ appStore.language === 'zh' ? '篇' : 'articles' }}
            </div>
            <button class="sort-btn" @click="toggleSort()">
              <el-icon :size="15"><Calendar /></el-icon>
              <span>{{ appStore.language === 'zh' ? '时间' : 'Date' }}</span>
              <el-icon :size="15"><ArrowUp v-if="sortOrder === 'asc'" /><ArrowDown v-else /></el-icon>
            </button>
          </div>

          <!-- 文章条目：左侧强调色标记 + 封面 + 标题 + 元信息 -->
          <div class="article-cards">
            <article
              v-for="(article, aIndex) in filteredArticles"
              :key="article.id"
              class="article-card"
              :style="{ animationDelay: `${Math.min(aIndex, 9) * 0.05}s` }"
              @click="openArticle(article.id)"
            >
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
                  <div v-else class="article-cover-placeholder">
                    <el-icon :size="28" class="article-cover-icon"><Reading /></el-icon>
                  </div>
                  <div class="article-category-tag">
                    {{ articleShortLabels[article.category] || article.category }}
                  </div>
                </div>
                <!-- 文字信息 -->
                <div class="article-info">
                  <div class="article-info-head">
                    <h3 class="article-title">{{ article.title }}</h3>
                    <div class="article-arrow">
                      <el-icon><TopRight /></el-icon>
                    </div>
                  </div>
                  <div class="article-meta">
                    <span>{{ article.date || 'No Date' }}</span>
                    <span class="article-dot"></span>
                    <span class="article-source">
                      {{ appStore.language === 'zh' ? '阅读全文' : 'Read article' }}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <!-- 加载中 / 空状态 -->
          <div v-if="loading" class="article-empty">
            <p class="article-empty-text">{{ appStore.language === 'zh' ? '加载中…' : 'Loading…' }}</p>
          </div>
          <div v-else-if="filteredArticles.length === 0" class="article-empty">
            <p class="article-empty-text">
              {{ appStore.language === 'zh' ? '暂无文章' : 'No articles found' }}
            </p>
          </div>

          <!-- 加载更多 -->
          <div v-if="articleStore.hasMore()" class="article-more">
            <button class="more-btn" @click="handleLoadMore">
              {{ appStore.language === 'zh' ? '加载更多' : 'Load more' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Filter, Calendar, ArrowUp, ArrowDown, Reading, TopRight } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/app'
import { useArticleStore } from '@/store/articles'
import type { Language } from '@/types'
import { pickText } from '@/utils/i18n'

interface ArticlesPageContent {
  title: string
  description: string
}

const ARTICLES_PAGE_DATA: Record<Language, ArticlesPageContent> = {
  zh: { title: '文章', description: '个人思考、学习分享与生活记录。' },
  en: { title: 'Articles', description: 'Thoughts, learning journey, and life records.' }
}

const appStore = useAppStore()
const articleStore = useArticleStore()
const router = useRouter()

// 当前筛选分类 / 排序方向（切换后重新请求接口）
const filter = ref<string>('All')
const sortOrder = ref<'asc' | 'desc'>('desc')
const loading = computed(() => articleStore.loading)

// 页面标题和描述（本地维护）
const pageData = computed(() => ARTICLES_PAGE_DATA[appStore.language])

// 全部分类：接口下发的字典 + "全部"
const categories = computed(() => ['All', ...articleStore.categories.map(item => item.value)])

// 分类按钮文案
const articleLabels = computed(() => {
  const map: Record<string, string> = { All: appStore.language === 'zh' ? '全部' : 'All' }
  for (const item of articleStore.categories) {
    const value = item.zh ?? item.en
    map[item.value] = pickText(value?.label ?? item.label, appStore.language, item.value)
  }
  return map
})

// 封面角标文案
const articleShortLabels = computed(() => {
  const map: Record<string, string> = {}
  for (const item of articleStore.categories) {
    const value = item.zh ?? item.en
    map[item.value] = pickText(value?.shortLabel ?? value?.label ?? item.label, appStore.language, item.value)
  }
  return map
})

// 文章列表：接口已按分类与日期排序返回
const filteredArticles = computed(() =>
  articleStore.articles.map(article => ({
    id: article.id,
    ...article.common,
    ...(appStore.language === 'zh' ? article.zh : article.en)
  }))
)

// 切换分类：重新请求
function selectCategory(cat: string) {
  if (filter.value === cat) return
  filter.value = cat
  articleStore.setCategory(cat)
}

// 切换日期排序方向：重新请求
function toggleSort() {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  articleStore.setSort(sortOrder.value === 'asc' ? 'date_asc' : 'date_desc')
}

// 加载下一页
async function handleLoadMore() {
  await articleStore.loadMore()
}

// 进入站内文章详情页
function openArticle(id: string) {
  router.push({ name: 'ArticleDetail', params: { id } })
}

onMounted(() => {
  articleStore.loadCategories()
  articleStore.loadArticles()
})
</script>

<style lang="less" scoped>
.articles-page {
  width: 100%;
  padding-bottom: 4rem;
}

/* ---------- 页头 ---------- */
.articles-header {
  margin-bottom: 3rem;

  @media (min-width: 1024px) {
    margin-bottom: 4rem;
  }
}

.articles-eyebrow {
  margin: 0 0 1rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--accent-text);
}

.articles-title {
  margin: 0 0 1.5rem;
  font-family: var(--font-display);
  font-size: clamp(3rem, 11vw, 7rem);
  line-height: 0.9;
  font-weight: 900;
  letter-spacing: -0.045em;
  color: var(--fg);
}

.articles-desc {
  max-width: 40rem;
  margin: 0;
  font-size: 1.0625rem;
  line-height: 1.75;
  color: var(--fg-muted);

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
}

/* ---------- 布局 ---------- */
.articles-layout {
  display: flex;
  flex-direction: column;
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
    width: 14rem;
    flex-shrink: 0;
  }
}

.sidebar-sticky {
  position: sticky;
  top: 5.5rem;
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1.25rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--fg-faint);
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.category-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid transparent;
  border-radius: var(--radius-xs);
  background: none;
  text-align: left;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--fg-muted);
  cursor: pointer;
  transition: background-color var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);

  &:hover {
    border-color: var(--border);
    color: var(--fg);
  }

  &.category-btn--active {
    background: var(--inverse-bg);
    border-color: var(--ink);
    color: var(--inverse-fg);
  }
}

/* 移动端分类标签 */
.category-mobile {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
  padding: 0.75rem 0;
  margin-bottom: 1.5rem;
  position: sticky;
  top: 4.5rem;
  z-index: 30;
  background: var(--bg);
  transition: background-color var(--dur) var(--ease-out);

  &::-webkit-scrollbar {
    display: none;
  }

  @media (min-width: 1024px) {
    display: none;
  }
}

.category-pill {
  flex-shrink: 0;
  padding: 0.4375rem 0.875rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  background: none;
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--fg-muted);
  cursor: pointer;
  transition: background-color var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);

  &.category-pill--active {
    background: var(--inverse-bg);
    border-color: var(--ink);
    color: var(--inverse-fg);
  }
}

/* ---------- 列表 ---------- */
.article-list-wrap {
  flex-grow: 1;
  min-width: 0;

  @media (min-width: 1024px) {
    max-width: 48rem;
  }
}

.article-list-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.875rem;
  border-bottom: 2px solid var(--ink);
}

.article-count {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--fg-faint);
}

.sort-btn {
  display: flex;
  align-items: center;
  gap: 0.4375rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  background: none;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--fg-muted);
  cursor: pointer;
  transition: background-color var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);

  &:hover {
    border-color: var(--ink);
    color: var(--fg);
  }
}

.article-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* 目录式条目：左侧 2px 标记，hover 变强调色 */
.article-card {
  cursor: pointer;
  animation: fadeUp 0.55s var(--ease-out) both;
}

.article-card-inner {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.875rem;
  border: 1px solid var(--border);
  border-left: 2px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  transition: border-color var(--dur) var(--ease-out), transform var(--dur) var(--ease-out);

  &:hover {
    border-color: var(--border);
    border-left-color: var(--accent);
    transform: translateX(3px);
  }

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: stretch;
    padding: 1rem;
    gap: 1.25rem;
  }
}

.article-cover {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: var(--radius-xs);
  background: var(--surface-sunken);

  @media (min-width: 768px) {
    width: 12rem;
    aspect-ratio: 4 / 3;
  }
}

.article-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s var(--ease-out);
  will-change: transform;

  .article-card:hover & {
    transform: scale(1.06);
  }
}

.article-cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--surface-sunken);
}

.article-cover-icon {
  color: var(--fg-faint);
}

.article-category-tag {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  padding: 0.1875rem 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.5625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-radius: var(--radius-xs);
  background: var(--inverse-bg);
  color: var(--inverse-fg);
}

.article-info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-grow: 1;
  min-width: 0;
}

.article-info-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.article-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.0625rem;
  font-weight: 900;
  line-height: 1.4;
  letter-spacing: -0.02em;
  color: var(--fg);
  transition: color var(--dur) var(--ease-out);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;

  .article-card:hover & {
    color: var(--accent-text);
  }

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
}

.article-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  opacity: 0;
  transition: opacity var(--dur) var(--ease-out);

  .article-card:hover & {
    opacity: 1;
  }
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding-top: 0.625rem;
  border-top: 1px dashed var(--border);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--fg-faint);

  @media (min-width: 768px) {
    font-size: 0.6875rem;
  }
}

.article-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--fg-faint);
}

.article-source {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 479px) {
    display: none;
  }
}

/* ---------- 加载更多 / 空状态 ---------- */
.article-more {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.more-btn {
  padding: 0.75rem 2rem;
  border: 2px solid var(--ink);
  border-radius: var(--radius-xs);
  background: transparent;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--fg);
  cursor: pointer;
  transition: background-color var(--dur) var(--ease-out), color var(--dur) var(--ease-out);

  &:hover {
    background: var(--inverse-bg);
    color: var(--inverse-fg);
  }
}

.article-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 14rem;
  margin-top: 1.5rem;
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  color: var(--fg-faint);
}

.article-empty-text {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
</style>
