// 文章页标题和描述（中英双语）
// 说明：仅取旧版 src/data/articles.ts 中的页面标题部分，
// 文章列表数据仍来自后端 /api/articles。
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
