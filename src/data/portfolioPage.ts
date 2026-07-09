// 作品页标题和描述（中英双语）
import { Language } from '@/types'

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
