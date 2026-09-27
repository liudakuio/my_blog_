// 文章数据：文章列表（分页）+ 文章分类字典
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getArticlePage, getArticleCategories } from '@/api'
import type { ArticleVo, CategoryVo } from '@/api/types'
import type { Article } from '@/types'

/** 将后端 ArticleVo 归一化为前端使用的 Article 结构 */
function normalize(vo: ArticleVo): Article {
  return {
    id: vo.id,
    common: {
      category: (vo.category ?? '') as Article['common']['category'],
      link: vo.link ?? '',
      coverImage: vo.coverImage || undefined,
      date: vo.date || undefined
    },
    zh: {
      title: vo.zh ? (vo.zh.title ?? '') : (vo.title ?? ''),
      content: vo.content ?? vo.zh?.content ?? ''
    },
    en: {
      title: vo.en ? (vo.en.title ?? '') : (vo.title ?? ''),
      content: vo.content ?? vo.en?.content ?? ''
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
  const query = ref({ category: '', sort: 'date_desc' as 'date_desc' | 'date_asc', page: 1, pageSize: 20 })

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
  function setSort(sort: 'date_desc' | 'date_asc') {
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
