// 文章页标题、描述、分类标签；文章列表数据（含封面图、链接、日期）
import { ArticleCategory, Language } from '@/types'

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

export interface ArticleItem {
  id: string
  common: {
    category: ArticleCategory
    link: string
    coverImage?: string
    date?: string
  }
  zh: {
    title: string
  }
  en: {
    title: string
  }
}

export const ARTICLE_DATA: ArticleItem[] = [
  {
    id: 't1',
    common: {
      category: ArticleCategory.TALK,
      link: 'https://github.com/yourname',
      coverImage: 'https://via.placeholder.com/800x450?text=Article+Cover',
      date: '2024-01-01'
    },
    zh: {
      title: '示例文章标题'
    },
    en: {
      title: 'Example Article Title'
    }
  }
]

export const ARTICLE_LABELS: Record<Language, Record<string, string>> = {
  zh: {
    'All': '全部',
    [ArticleCategory.DIT]: 'DiT | 数媒与课程',
    [ArticleCategory.LUNA]: 'LUNA | 影像相关',
    [ArticleCategory.TALK]: '瞎叨be叨 | 杂记',
    [ArticleCategory.AFTER8]: 'After8 | 聊艺术',
    [ArticleCategory.SERENITY]: '山海疗养院 | 游记'
  },
  en: {
    'All': 'All',
    [ArticleCategory.DIT]: 'DiT | DMT & Courses',
    [ArticleCategory.LUNA]: 'LUNA | Visual Arts',
    [ArticleCategory.TALK]: 'Random Thoughts',
    [ArticleCategory.AFTER8]: 'After8 | Art Talk',
    [ArticleCategory.SERENITY]: 'Serenity Vista | Travel'
  }
}
