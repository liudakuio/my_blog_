// 文章相关接口：分页列表（含分类筛选与日期排序）与分类字典
// 被 store/articles.ts 调用，由 views/articles 列表页与详情页消费
// 注意：分类筛选与排序均由服务端处理，切换后需重新请求，前端不做本地排序
import service from '@/utils/request'
import type { ArticleVo, CategoryVo, LangParam, PageResult } from './types'

/** GET /api/articles —— 文章列表（分页、分类筛选、日期排序） */
export function getArticlePage(params?: {
  category?: string
  sort?: 'date_desc' | 'date_asc'
  page?: number
  pageSize?: number
  lang?: LangParam
}) {
  return service.get<PageResult<ArticleVo>, PageResult<ArticleVo>>('/api/articles', {
    params: { lang: 'all', sort: 'date_desc', page: 1, pageSize: 20, ...(params || {}) }
  })
}

/** GET /api/article-categories —— 文章分类字典 */
export function getArticleCategories(lang: LangParam = 'all') {
  return service.get<CategoryVo[], CategoryVo[]>('/api/article-categories', { params: { lang } })
}
