// 后台通用 CRUD 接口封装（后端 AdminController 仍然存在，只覆盖白名单内的资源）。
// 路径约定：/api/admin/{resource}、/api/admin/{resource}/{id}，共列表 / 详情 / 新增 / 修改 / 删除 5 个操作。
//   路径前缀统一由 src/api/paths.ts 的 adminPath() 拼接，本文件不再出现 '/api/admin/' 字面量。
// 资源白名单（后端 TableRegistry 硬编码，共 6 个）：
//   nav、project_category、project、article_category、article、article_i18n；
//   未注册的 resource 一律返回 400「未知资源」，因此不要往本模块塞新资源。
// 出入参命名：**必须是数据库列名（下划线）**。后端用 Map<String,Object> 承接（resultType=HashMap +
//   SELECT *，驼峰转换对 Map 不生效），传驼峰 key 不会被识别。
// 列表筛选：按列等值筛选，且参数必须是白名单列，否则被静默丢弃（不报错、不生效）；
//   列表全量返回、无分页。
// 字段为下划线的资源（nav、article_i18n）走这里；走专用接口（驼峰字段）的资源见 adminResource.ts。
// 权限：变更操作需 blog:{resource}:edit，由后端按请求路径推导校验。
// 被谁引用：views/admin/content/nav（导航菜单）、views/admin/content/articleI18n（文章多语），
//   以及 crud/index.vue 中 isDedicatedResource 为假时的分支。
import service from '@/utils/request'
import { adminPath, ADMIN_UPLOAD_IMAGE_PATH } from './paths'
import type { AdminRow } from './types'

/**
 * GET /api/admin/{resource}?col=val —— 列表（按列等值筛选 + 默认排序，全量无分页）
 * @param resource 资源名，必须命中后端 TableRegistry 白名单
 * @param params 查询条件，键名必须是数据库列名（下划线）；空值由调用方自行剔除
 * @returns 行数据数组（字段为下划线列名）；可用泛型把行收窄到具体资源
 */
export function adminList<T extends AdminRow = AdminRow>(
  resource: string,
  params?: Record<string, unknown>
) {
  return service.get<T[], T[]>(adminPath(resource), { params })
}

/**
 * GET /api/admin/{resource}/{id} —— 详情
 * @param resource 资源名，必须命中后端 TableRegistry 白名单
 * @param id 记录主键值
 * @returns 单行数据（字段为下划线列名）
 */
export function adminGet<T extends AdminRow = AdminRow>(resource: string, id: string | number) {
  return service.get<T, T>(adminPath(resource, id))
}

/**
 * POST /api/admin/{resource} —— 新增
 * @param resource 资源名，必须命中后端 TableRegistry 白名单
 * @param body 请求体，键名必须是数据库列名（下划线）
 * @returns 后端回写的整行数据
 */
export function adminCreate<T extends AdminRow = AdminRow>(resource: string, body: Record<string, unknown>) {
  return service.post<T, T>(adminPath(resource), body)
}

/**
 * PUT /api/admin/{resource}/{id} —— 修改（未提交的字段保持原值）
 * @param resource 资源名，必须命中后端 TableRegistry 白名单
 * @param id 记录主键值
 * @param body 请求体，键名必须是数据库列名（下划线）
 * @returns 后端回写的整行数据
 */
export function adminUpdate<T extends AdminRow = AdminRow>(
  resource: string,
  id: string | number,
  body: Record<string, unknown>
) {
  return service.put<T, T>(adminPath(resource, id), body)
}

/**
 * DELETE /api/admin/{resource}/{id} —— 删除
 * @param resource 资源名，必须命中后端 TableRegistry 白名单
 * @param id 记录主键值
 */
export function adminDelete(resource: string, id: string | number) {
  return service.delete(adminPath(resource, id))
}

/** 后台图片上传结果（对应后端 FileUploadController.UploadResult） */
export interface AdminUploadResult {
  /** 可直接访问的相对 URL，如 /uploads/2026/09/26/uuid.jpg */
  url: string
  originalName: string
  size: number
  ext: string
}

/**
 * POST /api/admin/upload/image —— 单图上传，需 blog:upload:edit 权限。
 * 用 FormData 提交 file 字段；不手动设置 Content-Type，由 axios 自动带 boundary。
 * 响应拦截器已剥出 data，此处直接拿到 AdminUploadResult。
 * 注意：后端种子数据只按业务表生成权限，blog:upload:edit 不在其中，
 *   需在 sys_permission 手工插入该权限，否则上传必然 403。
 */
export function adminUploadImage(file: File) {
  const form = new FormData()
  form.append('file', file)
  return service.post<AdminUploadResult, AdminUploadResult>(ADMIN_UPLOAD_IMAGE_PATH, form)
}
