// 后台 7 个「专用接口」资源的类型化 VO（字段驼峰）。
// 字段与约束详见《后台专用接口说明》第二节。
// 通用 CRUD 资源返回下划线列名，不走这里的类型。

/** 站点全局配置（KV 文案） */
export interface AdminSiteTextVo {
  id: number
  configKey: string
  valueZh?: string
  valueEn?: string
  remark?: string
}

/** 教育经历与荣誉（文案）；remark 仅写入、不返回 */
export interface AdminEducationTextVo {
  id: number
  configKey: string
  valueZh?: string
  valueEn?: string
  remark?: string
}

/** 作品 */
export interface AdminProjectVo {
  id: string
  category: string
  cover?: string
  icon?: string
  videoUrl?: string
  bilibiliId?: string
  figmaUrl?: string
  websiteUrl?: string
  githubUrl?: string
  sort?: number
  status?: string
  /** 备注 */
  remark?: string
  createBy?: string
  createTime?: string
  updateBy?: string
  updateTime?: string
}

/** 作品分类字典 */
export interface AdminProjectCategoryVo {
  id: number
  categoryValue: string
  labelZh?: string
  labelEn?: string
  sort?: number
  status?: string
}

/** 文章（主表，不含正文；正文在 article_i18n 维护） */
export interface AdminArticleVo {
  id: string
  category: string
  link?: string
  coverImage?: string
  /** YYYY-MM-DD */
  publishDate?: string
  sort?: number
  status?: string
  /** 正文（Markdown） */
  content?: string
  /** 备注 */
  remark?: string
  createBy?: string
  createTime?: string
  updateBy?: string
  updateTime?: string
}

/** 文章分类字典 */
export interface AdminArticleCategoryVo {
  id: number
  categoryValue: string
  labelZh?: string
  labelEn?: string
  shortLabelZh?: string
  shortLabelEn?: string
  sort?: number
  status?: string
}

/** 音乐播放列表 */
export interface AdminMusicVo {
  id: string
  title: string
  artist?: string
  cover?: string
  audio?: string
  sort?: number
  status?: string
}

/** 资源名 -> VO 类型映射 */
export interface AdminVoMap {
  site_text: AdminSiteTextVo
  project: AdminProjectVo
  project_category: AdminProjectCategoryVo
  article: AdminArticleVo
  article_category: AdminArticleCategoryVo
  music: AdminMusicVo
  education_text: AdminEducationTextVo
}

/** 新增 / 修改入参：字段可选；PUT 时 null 表示「不更新」 */
export type AdminSaveVo<T> = Partial<T>

/** 列表筛选入参：按字段等值筛选 */
export type AdminQuery<T> = Partial<T>
