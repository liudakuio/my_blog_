<!-- 文章详情页：按 id 从 store 取文章，渲染封面 + 标题 + 正文 + 配图，支持中英文 -->
<template>
  <div class="article-detail">
    <button class="back-btn" @click="goBack">
      <el-icon :size="18"><ArrowLeft /></el-icon>
      <span>{{ appStore.language === 'zh' ? '返回文章列表' : 'Back to articles' }}</span>
    </button>

    <div v-if="!ready" class="detail-state">
      <p class="detail-state-text">{{ appStore.language === 'zh' ? '加载中…' : 'Loading…' }}</p>
    </div>

    <div v-else-if="!article" class="detail-state">
      <p class="detail-state-text">{{ appStore.language === 'zh' ? '未找到该文章' : 'Article not found' }}</p>
      <button class="ghost-btn" @click="goBack">
        {{ appStore.language === 'zh' ? '返回列表' : 'Back' }}
      </button>
    </div>

    <article v-else class="detail-body">
      <header class="detail-header">
        <div class="detail-category">{{ category }}</div>
        <h1 class="detail-title">{{ title }}</h1>
        <div class="detail-meta">
          <span>{{ date }}</span>
          <span class="detail-dot"></span>
          <span>{{ category }}</span>
        </div>
      </header>

      <div v-if="coverImage" class="detail-cover">
        <img :src="coverImage" :alt="title" class="detail-cover-img" referrerpolicy="no-referrer" />
      </div>

      <div class="detail-content">
        <MdPreview :modelValue="content" :theme="mdTheme" class="detail-markdown" />
      </div>

      <div v-if="images.length" class="detail-gallery">
        <img
          v-for="(img, i) in images"
          :key="i"
          :src="img"
          :alt="`${title} - ${i + 1}`"
          class="detail-gallery-img"
          referrerpolicy="no-referrer"
        />
      </div>

      <footer class="detail-footer">
        <button class="ghost-btn" @click="goBack">
          {{ appStore.language === 'zh' ? '← 返回文章列表' : '← Back to articles' }}
        </button>
      </footer>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/app'
import { useArticleStore } from '@/store/articles'
import type { Article } from '@/types'
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const articleStore = useArticleStore()

const ready = ref(false)

// 路由参数中的文章 id
const id = computed(() => (route.params.id as string) || '')

// 与列表同源：从 store 中按 id 查找
const article = computed<Article | undefined>(() =>
  articleStore.articles.find((a) => a.id === id.value)
)

const isZh = computed(() => appStore.language === 'zh')

// Markdown 预览主题跟随全局深色模式
const mdTheme = computed(() => (appStore.isDark ? 'dark' : 'light'))

const title = computed(() => {
  if (!article.value) return ''
  return isZh.value ? article.value.zh.title : article.value.en.title
})

// 正文（Markdown 源码），交由 MdPreview 渲染
const content = computed(() => {
  if (!article.value) return ''
  return isZh.value ? article.value.zh.content : article.value.en.content
})

const coverImage = computed(() => article.value?.common.coverImage || '')
const images = computed(() => article.value?.common.images ?? [])
const category = computed(() => article.value?.common.category ?? '')
const date = computed(() => article.value?.common.date ?? '')

onMounted(async () => {
  window.scrollTo(0, 0)
  // 直接访问详情页或刷新时列表数据可能未加载，先确保加载
  if (!articleStore.articles.length) {
    await articleStore.loadArticles()
  }
  ready.value = true
})

function goBack() {
  router.push({ name: 'Articles' })
}
</script>

<style lang="less" scoped>
.article-detail {
  width: 100%;
  max-width: 96vw;
  margin: 0 auto;
  padding-bottom: 5rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.1rem;
  margin-bottom: 2.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 9999px;
  background: transparent;
  font-size: 0.875rem;
  font-weight: 700;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    color: #000000;
    border-color: #000000;
    transform: translateX(-3px);
  }

  .dark & {
    border-color: #1f2937;
    color: #d1d5db;

    &:hover {
      color: #ffffff;
      border-color: #ffffff;
    }
  }
}

.detail-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  width: 100%;
  height: 16rem;
  border: 2px dashed #e5e7eb;
  border-radius: 1.5rem;
  color: #9ca3af;

  .dark & {
    color: #4b5563;
    border-color: #1f2937;
  }
}

.detail-state-text {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
}

.ghost-btn {
  padding: 0.75rem 2rem;
  border: 2px solid #000000;
  border-radius: 9999px;
  background: transparent;
  font-size: 0.875rem;
  font-weight: 700;
  color: #000000;
  cursor: pointer;
  transition: opacity 0.3s, border-color 0.3s, color 0.3s;

  &:hover {
    opacity: 0.7;
  }

  .dark & {
    border-color: #ffffff;
    color: #ffffff;
  }
}

.detail-body {
  max-width: 56rem;
  margin: 0 auto;
}

.detail-header {
  margin-bottom: 2.5rem;
}

.detail-category {
  display: inline-block;
  padding: 0.25rem 0.7rem;
  margin-bottom: 1.25rem;
  border-radius: 0.375rem;
  background: #000000;
  color: #ffffff;
  font-family: monospace;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  .dark & {
    background: #ffffff;
    color: #000000;
  }
}

.detail-title {
  margin: 0 0 1rem;
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.15;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: #000000;
  transition: color 0.3s;

  .dark & {
    color: #ffffff;
  }
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: monospace;
  font-size: 0.875rem;
  color: #9ca3af;

  .dark & {
    color: #6b7280;
  }
}

.detail-dot {
  width: 0.25rem;
  height: 0.25rem;
  border-radius: 9999px;
  background: #d1d5db;

  .dark & {
    background: #374151;
  }
}

.detail-cover {
  width: 100%;
  aspect-ratio: 900 / 383;
  margin-bottom: 3rem;
  overflow: hidden;
  border-radius: 1rem;
  background: #f3f4f6;

  .dark & {
    background: #111827;
  }
}

.detail-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s;
  will-change: transform;

  &:hover {
    transform: scale(1.03);
  }
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

// Markdown 正文：颜色交给 md-editor-v3 主题，这里只调排版
.detail-markdown {
  font-size: 1.0625rem;

  :deep(p) {
    margin: 0 0 1.25rem;
    line-height: 1.9;
    word-break: break-word;
  }

  :deep(img) {
    max-width: 100%;
    border-radius: 0.75rem;
  }

  :deep(pre) {
    border-radius: 0.75rem;
  }
}

.detail-gallery {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 3rem;
}

.detail-gallery-img {
  width: 100%;
  border-radius: 0.875rem;
  object-fit: cover;
  transition: transform 0.5s;

  &:hover {
    transform: scale(1.02);
  }
}

.detail-footer {
  display: flex;
  justify-content: center;
  margin-top: 4rem;
  padding-top: 2.5rem;
  border-top: 1px solid #e5e7eb;

  .dark & {
    border-color: #1f2937;
  }
}
</style>
