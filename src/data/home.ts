// 主页数据：Hero 大标题项、个人简介、精选作品标题、年份区间；右侧联系卡片（中英双语）
// 说明：这些数据在「增加前后端对接」中一度改为读取 /api/site/config 的 home 节点，
// 现回退为本地数据。HeroItem / HomeContent 等类型复用 @/types 中的定义，避免重复声明。
import { Category, type Language, type HeroItem, type HomeContent } from '@/types'

export const HOME_DATA: Record<Language, HomeContent> = {
  zh: {
    heroItems: [
      { text: '软件开发', annotation: '（目前主业）', category: Category.DEV },
      { text: '嵌入式开发', annotation: '（想学习）', category: Category.DESIGN },
      { text: '做饭', annotation: '（还在学）', category: null }
    ],
    intro: '',
    selectedWorks: '精选作品',
    years: '[ 2024 — 2026 ]'
  },
  en: {
    heroItems: [
      { text: 'Software Dev', annotation: '(Current main work)', category: Category.DEV },
      { text: 'Embedded dev', annotation: '(I want to learn)', category: Category.DESIGN },
      { text: 'Cooking', annotation: '(Still Learning)', category: null }
    ],
    intro: '',
    selectedWorks: 'Selected Works',
    years: '[ 20XX — 20XX ]'
  }
}

/** 社交账号 */
export interface SocialLinks {
  wechat: string
  xiaohongshu: string
  bilibili: string
  px500: string
}

/** 首页右侧联系卡片内容 */
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

export const CONTACT_DATA: Record<Language, ContactContent> = {
  zh: {
    baseLabel: 'BASE',
    locationValue: '河南 郑州',
    contactLabel: '取得联系',
    emailMeLabel: '邮箱',
    email: 'liudakuio@gmail.com',
    hello: '你好 :-)',
    intro: '欢迎探讨与合作。',
    socials: {
      wechat: 'vv8886666999',
      xiaohongshu: 'YourID',
      bilibili: 'YourID',
      px500: 'YourID'
    },
    githubLabel: 'Gitee',
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
    githubLabel: 'Gitee',
    footerDesign: 'Powered by Gemini 3 Pro'
  }
}

// 类型再导出，便于外部按需引用
export type { HeroItem, HomeContent }
