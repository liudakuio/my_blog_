// 后端已把 7 个常用资源从通用 CRUD 拆出「专用接口」：类型化 VO、字段驼峰。
// 路径与通用 CRUD 一致（/api/admin/{resource}），差异只在出入参：
//   专用接口 -> 驼峰；通用 CRUD -> 下划线列名。
// 详见《前端改造方案》第二、四节。
// 被谁引用：views/admin/content/ 下对应的专用页面（siteText / project / projectCategory /
// article / articleCategory / educationText），以及 crud/index.vue 中 isDedicatedResource 为真时的分支。
// 维护注意：DEDICATED_RESOURCES 的取值必须与 adminTypes.ts 的 AdminVoMap key 完全一致，
// 否则 isDedicatedResource 的类型守卫会与实际返回类型脱节。
import service from '@/utils/request'
import type { AdminVoMap } from './adminTypes'

/** 走专用接口的资源（顺序与后端文档一致；music / social 的专用接口已由后端移除，走通用 CRUD） */
export const DEDICATED_RESOURCES = [
  'site_text',
  'project',
  'project_category',
  'article',
  'article_category',
  'education_text'
] as const

export type DedicatedResource = keyof AdminVoMap

/** 判断资源是否走专用接口（类型守卫，可直接用于收窄 resource） */
export function isDedicatedResource(resource: string): resource is DedicatedResource {
  return (DEDICATED_RESOURCES as readonly string[]).includes(resource)
}

function path(resource: string, id?: string | number) {
  const base = '/api/admin/' + resource
  return id === undefined || id === null || id === ''
    ? base
    : base + '/' + encodeURIComponent(String(id))
}

/** GET /api/admin/{resource} —— 列表（Query 对象按字段等值筛选） */
export function adminResourceList<R extends DedicatedResource>(
  resource: R,
  params?: Record<string, any>
) {
  return service.get<AdminVoMap[R][], AdminVoMap[R][]>(path(resource), { params })
}

/** GET /api/admin/{resource}/{id} —— 详情 */
export function adminResourceGet<R extends DedicatedResource>(resource: R, id: string | number) {
  return service.get<AdminVoMap[R], AdminVoMap[R]>(path(resource, id))
}

/** POST /api/admin/{resource} —— 新增，返回完整对象 */
export function adminResourceCreate<R extends DedicatedResource>(
  resource: R,
  body: Record<string, any>
) {
  return service.post<AdminVoMap[R], AdminVoMap[R]>(path(resource), body)
}

/** PUT /api/admin/{resource}/{id} —— 修改；null 字段表示不更新 */
export function adminResourceUpdate<R extends DedicatedResource>(
  resource: R,
  id: string | number,
  body: Record<string, any>
) {
  return service.put<AdminVoMap[R], AdminVoMap[R]>(path(resource, id), body)
}

/** DELETE /api/admin/{resource}/{id} —— 删除主表（不级联子表） */
export function adminResourceDelete(resource: DedicatedResource, id: string | number) {
  return service.delete(path(resource, id))
}
