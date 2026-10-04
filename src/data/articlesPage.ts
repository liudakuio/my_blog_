// 文章页标题和描述（中英双语，本地写死）
// 说明：仅取旧版 src/data/articles.ts 中的页面标题部分，
// 文章列表数据仍来自后端 /api/articles。
// 被谁引用：views/articles/index.vue 的页头。
// 注意：分类筛选与排序切换都由服务端接口处理，前端只负责传参并展示。
import type { Language } from '@/types'

export interface ArticlesPageContent {
  title: string
  description: string
}

export const ARTICLES_PAGE_DATA: Record<Language, ArticlesPageContent> = {
  zh: {
    title: '文章',
    description: '个人思考、学习分享与生活记录。'
  },
  en: {
    title: 'Articles',
    description: 'Thoughts, learning journey, and life records.'
  }
}
