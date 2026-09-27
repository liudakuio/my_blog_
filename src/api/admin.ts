// 后台通用 CRUD 接口：覆盖 21 张业务表。
// 路径约定：/api/admin/{resource}；变更操作需 blog:{resource}:edit 权限。
// 列表为全量返回（非分页），可按列等值筛选。
import service from '@/utils/request'

/** GET /api/admin/{resource}?col=val —— 列表（按列等值筛选 + 默认排序） */
export function adminList(resource: string, params?: Record<string, any>) {
  return service.get<any[], any[]>('/api/admin/' + resource, { params })
}

/** GET /api/admin/{resource}/{id} —— 详情 */
export function adminGet(resource: string, id: string | number) {
  return service.get<any, any>('/api/admin/' + resource + '/' + id)
}

/** POST /api/admin/{resource} —— 新增 */
export function adminCreate(resource: string, body: Record<string, any>) {
  return service.post<any, any>('/api/admin/' + resource, body)
}

/** PUT /api/admin/{resource}/{id} —— 修改 */
export function adminUpdate(resource: string, id: string | number, body: Record<string, any>) {
  return service.put<any, any>('/api/admin/' + resource + '/' + id, body)
}

/** DELETE /api/admin/{resource}/{id} —— 删除 */
export function adminDelete(resource: string, id: string | number) {
  return service.delete('/api/admin/' + resource + '/' + id)
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
 */
export function adminUploadImage(file: File) {
  const form = new FormData()
  form.append('file', file)
  return service.post<AdminUploadResult, AdminUploadResult>('/api/admin/upload/image', form)
}
