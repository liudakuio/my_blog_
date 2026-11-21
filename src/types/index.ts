// 全局类型定义：语言、分类枚举、项目 / 文章等前端内部数据结构
// 使用约定：
//   1) 接口返回对象（VO）类型在 src/api/types.ts，这里只放前端内部使用的结构；
//   2) 页面文案类结构（SocialLinks / ContactContent / PortfolioPageContent /
//      ArticlesPageContent / Song）统一在 src/data/site.ts 定义并导出，
//      不要在页面里重复声明，也不要在本文件保留同名副本；
//   3) Category 枚举的取值需与后端 /api/project-categories 下发的 value 保持一致，
//      否则首页 Hero 点击筛选时会命中不到分类。
export type Language = 'zh' | 'en'

/** 作品分类；取值与后端 /api/project-categories 的 value 字段一一对应 */
export enum Category {
  ALL = 'All',
  VIDEO = 'Videography',
  DESIGN = 'Graphics & UI',
  PHOTO = 'Photography',
  DEV = 'Development',
  ARTICLE = 'Article'
}

/** 文章分类；取值与后端文章分类字典的 value 字段一一对应 */
export enum ArticleCategory {
  DIT = 'DiT',
  LUNA = 'LUNA',
  TALK = '瞎叨be叨',
  AFTER8 = 'After8',
  SERENITY = '山海疗养院'
}

/** 首页 Hero 区的一条标题文案 */
export interface HeroItem {
  text: string
  annotation: string
  /** 点击该标题时按此分类筛选作品；null 表示不做筛选 */
  category: Category | null
}

/** 首页静态文案 */
export interface HomeContent {
  heroItems: HeroItem[]
  intro: string
  selectedWorks: string
  years: string
}

/** 前端使用的作品结构（由 api/types.ts 的 ProjectVo 归一化而来） */
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
    /** 图集张数，由接口下发；列表接口默认不返回图集内容 */
    galleryCount?: number
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

/** 前端使用的文章结构（由 api/types.ts 的 ArticleVo 归一化而来） */
export interface Article {
  id: string
  common: {
    category: ArticleCategory
    link: string
    coverImage?: string
    date?: string
    /** 详情页正文配图（可选） */
    images?: string[]
  }
  zh: {
    title: string
    content: string
  }
  en: {
    title: string
    content: string
  }
}
