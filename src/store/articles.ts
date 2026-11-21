// 文章数据：文章列表（分页）+ 文章分类字典
// 被谁引用：views/articles/index.vue（列表、分类、排序、加载更多）
// 与 views/articles/detail.vue（详情直接从 articles 中按 id 查找，不单独请求详情接口）。
// 分页语义：articles 为已加载的累计列表；append=true 时追加，否则替换。
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getArticlePage, getArticleCategories } from '@/api'
import type { ArticleVo, CategoryVo } from '@/api/types'
import type { Article } from '@/types'
import { ArticleCategory } from '@/types'
import { pickField } from '@/utils/i18n'

/** 文章列表排序方式：按发布时间倒序 / 正序 */
export type ArticleSort = 'date_desc' | 'date_asc'

/**
 * 将后端分类值转为前端的 ArticleCategory。
 * 后端分类值与枚举一一对应；命中枚举时返回枚举常量，
 * 未命中时原样保留字符串（不抛错），以兼容后端新增分类而前端尚未跟进的情况。
 */
function toArticleCategory(value: string | undefined): Article['common']['category'] {
  const raw = value ?? ''
  return (Object.values(ArticleCategory) as string[]).includes(raw)
    ? (raw as ArticleCategory)
    : (raw as Article['common']['category'])
}

/**
 * 将后端 ArticleVo 归一化为前端使用的 Article 结构。
 * 多语取值：lang=all 时标题收在 vo.zh / vo.en 内，lang=zh|en 时直接平铺在 vo.title 上，
 *   两套字段都需兼容，故统一经 utils/i18n.ts 的 pickField 取值。
 */
function normalize(vo: ArticleVo): Article {
  return {
    id: vo.id,
    common: {
      category: toArticleCategory(vo.category),
      link: vo.link ?? '',
      coverImage: vo.coverImage || undefined,
      date: vo.date || undefined
    },
    zh: {
      title: vo.zh ? pickField(vo.zh, 'title') : (vo.title ?? ''),
      content: vo.content ?? pickField(vo.zh, 'content')
    },
    en: {
      title: vo.en ? pickField(vo.en, 'title') : (vo.title ?? ''),
      content: vo.content ?? pickField(vo.en, 'content')
    }
  }
}

export const useArticleStore = defineStore('articles', () => {
  const articles = ref<Article[]>([])
  const categories = ref<CategoryVo[]>([])
  const total = ref(0)
  const loading = ref(false)
  const categoriesLoaded = ref(false)

  /** 当前查询条件，翻页/筛选/排序时复用 */
  const query = ref({ category: '', sort: 'date_desc' as ArticleSort, page: 1, pageSize: 20 })

  async function loadArticles(options?: { append?: boolean }) {
    const append = options?.append ?? false
    loading.value = true
    try {
      const res = await getArticlePage({
        category: query.value.category || undefined,
        sort: query.value.sort,
        page: query.value.page,
        pageSize: query.value.pageSize
      })
      const list = (res?.list ?? []).map(normalize)
      articles.value = append ? [...articles.value, ...list] : list
      total.value = res?.total ?? articles.value.length
    } catch {
      if (!append) articles.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadCategories(force = false) {
    if (categoriesLoaded.value && !force) return
    try {
      categories.value = (await getArticleCategories()) ?? []
      categoriesLoaded.value = true
    } catch {
      categories.value = []
    }
  }

  /** 切换分类 */
  function setCategory(category: string) {
    query.value.category = category === 'All' ? '' : category
    query.value.page = 1
    return loadArticles()
  }

  /** 切换排序方向 */
  function setSort(sort: ArticleSort) {
    query.value.sort = sort
    query.value.page = 1
    return loadArticles()
  }

  /** 加载下一页（返回是否还有更多） */
  async function loadMore() {
    if (articles.value.length >= total.value) return false
    query.value.page += 1
    await loadArticles({ append: true })
    return articles.value.length < total.value
  }

  const hasMore = () => articles.value.length < total.value

  return {
    articles,
    categories,
    total,
    loading,
    query,
    loadArticles,
    loadCategories,
    setCategory,
    setSort,
    loadMore,
    hasMore
  }
})
