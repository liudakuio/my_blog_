// 后台「走专用接口」资源的类型化 VO（字段驼峰）。
// 事实依据：后端为 project / project_category / article / article_category 四个资源
//   各自实现了独立 Controller（AdminProjectController / AdminProjectCategoryController /
//   AdminArticleController / AdminArticleCategoryController），出入参是类型化 VO、字段驼峰，
//   本文件的定义与后端 VO 字段一一对应。
// 与通用 CRUD 的分工：通用 CRUD（见 admin.ts，后端 AdminController）仍然存在，
//   但只覆盖后端 TableRegistry 白名单内的少数资源，出入参是 Map、key 必须是下划线列名；
//   走通用接口的资源不在本文件定义类型。
// 被谁引用：adminResource.ts（列表 / 详情 / 增删改的返回类型推导锚点）、
//   views/admin/content/ 下的 project / projectCategory / article / articleCategory 四个页面。
// 维护注意：新增走专用接口的资源时，需同时在后端新增专用 Controller，
//   并在 AdminVoMap 与 adminResource.ts 的 DEDICATED_RESOURCES 中同步登记（两者必须完全一致）。
// 变更记录：site_text 已随后端下线移除（后端无 site_text 表 / VO / Controller，
//   原先它被误列为专用资源，调用只会返回 400「未知资源」）。

/** 作品 */
export interface AdminProjectVo {
  id: string
  category: string
  /** 分类中文名（后端联表带出，非表字段） */
  categoryValue?: string
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

/** 文章（主表，不含多语正文；多语在 article_i18n 维护） */
export interface AdminArticleVo {
  id: string
  title?: string
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

/** 走专用接口的资源名 -> VO 类型映射（key 必须与 adminResource.ts 的 DEDICATED_RESOURCES 完全一致） */
export interface AdminVoMap {
  project: AdminProjectVo
  project_category: AdminProjectCategoryVo
  article: AdminArticleVo
  article_category: AdminArticleCategoryVo
}

/** 新增 / 修改入参：字段可选；未提交（null）的字段在修改时保持原值 */
export type AdminSaveVo<T> = Partial<T>

/** 列表筛选入参：各资源支持的可查询字段见后端对应的 Query 类 */
export type AdminQuery<T> = Partial<T>
