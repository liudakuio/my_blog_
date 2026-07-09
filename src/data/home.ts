// 主页数据：Hero 大标题项、个人简介、精选作品标题；联系方式数据（中英双语）
import { Language, Category } from '@/types'

export interface HomeContent {
  heroItems: HeroItem[]
  intro: string
  selectedWorks: string
  years: string
}

export interface HeroItem {
  text: string
  annotation: string
  category: Category | null
}

export const HOME_DATA: Record<Language, HomeContent> = {
  zh: {
    heroItems: [
      { text: '软件开发', annotation: '（目前主业）', category: Category.DEV },
      { text: '嵌入式开发', annotation: '（想学习）', category: Category.DESIGN },
      { text: '旅游', annotation: '（游戏人生）', category: Category.VIDEO },
      { text: '做饭', annotation: '（还在学）', category: null }
    ],
    intro: 'Your personal catchphrase or introduction goes here.',
    selectedWorks: '精选作品',
    years: '[ 2024 — 2026 ]'
  },
  en: {
    heroItems: [
      { text: 'Software Development', annotation: '(Current main work)', category: Category.DEV },
      { text: 'Embedded development', annotation: '(I want to learn)', category: Category.DESIGN },
      { text: 'Development', annotation: '(Vibe Coder)', category: Category.VIDEO },
      { text: 'Cooking', annotation: '(Still Learning)', category: null }
    ],
    intro: 'Your personal catchphrase or introduction goes here.',
    selectedWorks: 'Selected Works',
    years: '[ 20XX — 20XX ]'
  }
}

export const CONTACT_DATA: Record<Language, ContactContent> = {
  zh: {
    baseLabel: 'BASE',
    locationValue: '河南 郑州',
    contactLabel: '取得联系',
    emailMeLabel: '邮箱',
    email: '1365693530@qq.com',
    hello: '你好 :-)',
    intro: '欢迎探讨与合作。',
    socials: {
      wechat: 'YourWeChatID',
      xiaohongshu: 'YourID',
      bilibili: 'YourID',
      px500: 'YourID'
    },
    githubLabel: 'GitHub',
    footerDesign: 'Powered by Gemini 3 Pro'
  },
  en: {
    baseLabel: 'BASE',
    locationValue: 'HENAN ZHENGZHOU',
    contactLabel: 'Get in touch',
    emailMeLabel: 'Email Me',
    email: '1365693530@qq.com',
    hello: 'Hello :-)',
    intro: 'Welcome to discuss & cooperate.',
    socials: {
      wechat: 'YourWeChatID',
      xiaohongshu: 'YourID',
      bilibili: 'YourID',
      px500: 'YourID'
    },
    githubLabel: 'GitHub',
    footerDesign: 'Powered by Gemini 3 Pro'
  }
}

export interface SocialLinks {
  wechat: string
  xiaohongshu: string
  bilibili: string
  px500: string
}

export interface ContactContent {
  baseLabel: string
  locationValue: string
  contactLabel: string
  emailMeLabel: string
  email: string
  hello: string
  intro: string
  socials: SocialLinks
  tooltip?: string
  githubLabel: string
  footerDesign: string
}
