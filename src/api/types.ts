// 后端返回对象（VO）类型定义
// 多语字段规则：lang=zh/en 时字段平铺（string / string[]）；lang=all（默认）时收进 { zh, en }
// 被谁引用：src/api 下各接口模块（作 service.get/post 的泛型）、src/store（归一化函数入参）。
// 取值约定：
//   1) 单个多语值（I18nText，如导航文案 label）统一用 utils/i18n.ts 的 pickText 解析；
//   2) 多语字段集合（I18nMap，如 ProjectVo.zh 里的 title/tags）统一用 pickField / pickFieldList 取值，
//      不要直接读 .zh / .en —— 单语模式下字段是平铺的，直接读会取不到值。
import type { Language } from '@/types'

/** 多语文本：单语模式为字符串，双语模式为 { zh, en } */
export type I18nText = string | Record<string, string> | null | undefined

/** 双语模式下的字段集合：每个字段的值可能是字符串或字符串数组（如 tags / awards） */
export type I18nMap = Record<string, string | string[]> | undefined

export interface NavItemVo {
  id: string
  label: I18nText
  sort?: number
}

/** 站点配置（后端目前仅返回导航） */
export interface SiteConfigVo {
  nav: NavItemVo[]
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
  /** 正文（Markdown，取自主表不区分语言） */
  content?: string
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

/** 接口通用的语言参数 */
export type LangParam = Language | 'all'

// ---------------- 后台通用类型 ----------------

/**
 * 后台通用 CRUD（admin.ts）返回的行数据基类型。
 * 后端通用 CRUD 用 Map<String,Object> 承接，key 必须是数据库列名（下划线），
 * 字段集合随资源而变，因此这里只给出「未知键值对」这一最低约束，
 * 由各页面在自己的泛型参数里收窄到具体资源。
 */
export type AdminRow = Record<string, unknown>

/**
 * 后端 sys_menu 菜单树节点。
 * 事实依据：认证接口 /api/auth/menus 与系统管理接口 /api/system/menu 返回的是同一张菜单表，
 *   两处原先各自定义了一份结构（MenuItem / SysMenuVo），字段几乎完全相同；
 *   现统一到本定义，auth.ts 与 system.ts 均引用它。
 * 字段可选性说明：菜单树接口（auth）字段齐全，系统管理接口（system）部分字段可能为空，
 *   因此除 menuId / menuName 外统一按可选处理，取值处请做兜底。
 */
export interface MenuVo {
  menuId: number
  menuName: string
  parentId?: number
  /** M 目录 C 菜单 F 按钮 */
  menuType?: 'M' | 'C' | 'F'
  orderNum?: number
  path?: string
  /** 前端路由来源，形如 blog/project；去掉 blog/ 前缀即 /admin 下的路由路径 */
  component?: string
  /** 后端旧 Element UI 图标名，需经 config/menu.ts 映射为 Element Plus 图标 */
  icon?: string
  /** 权限标识，如 blog:project:edit */
  perms?: string
  status?: string
  createTime?: string
  /** tree=true 时的子节点 */
  children?: MenuVo[]
}
