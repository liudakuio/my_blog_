// 作品页标题和描述（中英双语，本地写死）
// 被谁引用：views/portfolio/index.vue 的页头。
// 注意：只有页头文案是写死的，作品列表本身来自后端 /api/projects。
import type { Language } from '@/types'

export interface PortfolioPageContent {
  title: string
  description: string
}

export const PORTFOLIO_PAGE_DATA: Record<Language, PortfolioPageContent> = {
  zh: {
    title: '作品',
    description: '路上拍的照片、应用开发作品和美食。'
  },
  en: {
    title: 'Portfolio',
    description: 'Photos taken on the road, application development works, and food.'
  }
}
