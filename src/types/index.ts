// 全局类型定义：语言、分类枚举、项目/文章/歌曲等数据结构
export type Language = 'zh' | 'en'

export enum Category {
  ALL = 'All',
  VIDEO = 'Videography',
  DESIGN = 'Graphics & UI',
  PHOTO = 'Photography',
  DEV = 'Development',
  ARTICLE = 'Article'
}

export enum ArticleCategory {
  DIT = 'DiT',
  LUNA = 'LUNA',
  TALK = '瞎叨be叨',
  AFTER8 = 'After8',
  SERENITY = '山海疗养院'
}

export interface HeroItem {
  text: string
  annotation: string
  category: Category | null
}

export interface HomeContent {
  heroItems: HeroItem[]
  intro: string
  selectedWorks: string
  years: string
}

export interface PortfolioPageContent {
  title: string
  description: string
}

export interface ArticlesPageContent {
  title: string
  description: string
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

export interface NavItem {
  id: string
  label: string
}

export interface Experience {
  id: string
  year: string
  title: string
  institution: string
  description: string
  type: 'education' | 'work'
}

export interface HonorsData {
  scholarships: string[]
  titles: string[]
  competitions: CompetitionGroup[]
}

export interface CompetitionGroup {
  level: string
  awards: string[]
}

export interface EducationPageContent {
  title: string
  about: string
  openToWork: string
  viewHonorsLabel: string
  honorsTitle: string
  competitionsTitle: string
  scholarshipsLabel: string
  titlesLabel: string
  experiences: Experience[]
  honors: HonorsData
}

export interface Project {
  id: string
  common: {
    category: string
    image: string
    videoUrl?: string
    bilibiliId?: string
    figmaUrl?: string
    websiteUrl?: string
    githubUrl?: string
    icon?: string
    gallery?: string[]
  }
  zh: {
    title: string
    subtitle: string
    description: string
    role: string
    tags: string[]
    awards?: string[]
    concept?: string
    roleDetail?: string
  }
  en: {
    title: string
    subtitle: string
    description: string
    role: string
    tags: string[]
    awards?: string[]
    concept?: string
    roleDetail?: string
  }
}

export interface Article {
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

export interface Song {
  id: string
  title: string
  artist: string
  cover: string
  audio: string
}

export interface Skill {
  name: string
  level: number
  icon?: string
}
