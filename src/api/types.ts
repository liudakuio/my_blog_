// 后端返回对象（VO）类型定义
// 多语字段规则：lang=zh/en 时平铺为 string / string[]；lang=all（默认）时收进 { zh, en }

import type { Language } from '@/types'

/** 多语文本：单语模式为字符串，双语模式为 { zh, en } */
export type I18nText = string | Record<string, string> | null | undefined

/** 双语模式下的字段集合 */
export type I18nMap = Record<string, any> | undefined

export interface TooltipVo {
  text?: string
  domain?: string
}

export interface NavItemVo {
  id: string
  label: I18nText
  sort?: number
}

export interface FooterVo {
  copyright: I18nText
  designStatement: I18nText
}

export interface ContactCardVo {
  baseLabel: string
  locationValue: I18nText
  contactLabel: I18nText
  tooltip: I18nText
}

export interface HeroItemVo {
  text: I18nText
  annotation: I18nText
  category: string | null
  sort?: number
}

export interface HomeVo {
  heroItems: HeroItemVo[]
  intro: I18nText
  selectedWorks: I18nText
  years: string
  contactCard: ContactCardVo
}

export interface PageTextVo {
  title: I18nText
  description: I18nText
}

export interface PagesVo {
  portfolio: PageTextVo
  articles: PageTextVo
}

export interface SocialItemVo {
  key: string
  name: I18nText
  account: string
  url: string
  icon: string
  clickable: boolean
  tooltip: TooltipVo | null
}

export interface ContactVo {
  hello: I18nText
  intro: I18nText
  email: string
  emailLabel: I18nText
  socials: SocialItemVo[]
}

export interface MusicPlaylistLinkVo {
  title: I18nText
  subtitle: I18nText
  url: string
}

export interface SiteConfigVo {
  nav: NavItemVo[]
  footer: FooterVo
  home: HomeVo
  pages: PagesVo
  contact: ContactVo
  musicPlaylistLink: MusicPlaylistLinkVo
}

export interface ProjectVo {
  id: string
  category: string
  cover: string
  icon?: string
  videoUrl?: string
  bilibiliId?: string
  figmaUrl?: string
  websiteUrl?: string
  githubUrl?: string
  gallery?: string[]
  galleryCount: number
  sort?: number
  /** 单语模式下的平铺字段 */
  title?: string
  subtitle?: string
  description?: string
  role?: string
  roleDetail?: string
  concept?: string
  tags?: string[]
  awards?: string[]
  /** 双语模式 */
  zh?: I18nMap
  en?: I18nMap
}

export interface CategoryVo {
  value: string
  sort?: number
  /** 单语模式 */
  label?: I18nText
  shortLabel?: I18nText
  /** 双语模式 */
  zh?: I18nMap
  en?: I18nMap
}

export interface ArticleVo {
  id: string
  category: string
  link: string
  coverImage: string
  date: string
  /** 单语模式 */
  title?: string
  /** 双语模式 */
  zh?: I18nMap
  en?: I18nMap
}

export interface PageResult<T> {
  total: number
  list: T[]
}

export interface SongVo {
  id: string
  title: string
  artist: string
  cover: string
  audio: string
}

export interface ExperienceVo {
  id: string
  year: string
  title: I18nText
  institution: I18nText
  description: I18nText
  type: string
}

export interface CompetitionVo {
  level: I18nText
  awards: I18nText[]
}

export interface HonorsVo {
  scholarships: I18nText[]
  titles: I18nText[]
  competitions: CompetitionVo[]
}

export interface EducationVo {
  title: I18nText
  about: I18nText
  openToWork: I18nText
  viewHonorsLabel: I18nText
  honorsTitle: I18nText
  competitionsTitle: I18nText
  scholarshipsLabel: I18nText
  titlesLabel: I18nText
  experiences: ExperienceVo[]
  honors: HonorsVo
}

/** 接口通用的语言参数 */
export type LangParam = Language | 'all'
