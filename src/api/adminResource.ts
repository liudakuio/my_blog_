// 后台「走专用接口」的 4 个资源的 CRUD 封装（出入参字段驼峰）。
// 后端为这 4 个资源各自实现了独立 Controller，路径与通用 CRUD 相同（均为 /api/admin/{resource}），
//   差异在出入参：专用接口是类型化 VO（驼峰字段），通用 CRUD 是 Map（下划线列名）。
//   走通用接口的资源见 admin.ts（后端通用 CRUD 仍然存在，只覆盖白名单内的资源）。
// 筛选参数：专用接口各资源有自己的 Query 对象，字段受限且匹配方式不同——
//   article_category / project_category：仅 status（等值）；
//   article：title、category（LIKE 模糊匹配）、status（等值）；
//   project：category、status（均等值）。
//   不在支持范围内的参数会被后端静默忽略，不要依赖其生效。
//   四个接口均为全量返回、无分页。
// 权限：变更操作（POST / PUT / DELETE）需 blog:{resource}:edit，由后端按请求路径推导校验。
// 被谁引用：views/admin/content/ 下的 project / projectCategory / article / articleCategory 四个页面、
//   crud/index.vue 中 isDedicatedResource 为真时的分支、dashboard/index.vue 的内容统计。
// 维护注意：DEDICATED_RESOURCES 必须与 adminTypes.ts 的 AdminVoMap key 完全一致
//   （下方由类型断言双向校验），否则 isDedicatedResource 的类型守卫会与实际返回类型脱节。
// 变更记录：site_text 已随后端下线移除（原被误列为专用资源，调用只会返回 400「未知资源」）；
//   music / social 后端从未提供任何接口，不要再按「走通用 CRUD」理解。
import service from '@/utils/request'
import type { AdminVoMap } from './adminTypes'

/** 走专用接口的资源（与后端 4 个专用 Controller 一一对应；顺序按资源分组排列） */
export const DEDICATED_RESOURCES = [
  'project',
  'project_category',
  'article',
  'article_category'
] as const satisfies readonly (keyof AdminVoMap)[]

export type DedicatedResource = keyof AdminVoMap

/**
 * 编译期断言：DEDICATED_RESOURCES 与 AdminVoMap 的 key 集合必须完全一致。
 * 任一侧多出或缺少 key，下面的常量赋值就会类型报错。
 */
type MissingInDedicated = Exclude<keyof AdminVoMap, (typeof DEDICATED_RESOURCES)[number]>
type ExtraInDedicated = Exclude<(typeof DEDICATED_RESOURCES)[number], keyof AdminVoMap>
export type DedicatedResourcesInSync = [MissingInDedicated, ExtraInDedicated] extends [never, never]
  ? true
  : { missingInDedicated: MissingInDedicated; extraInDedicated: ExtraInDedicated }
const _dedicatedResourcesInSync: DedicatedResourcesInSync = true

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

/**
 * GET /api/admin/{resource} —— 列表（全量返回，无分页）
 * params 为该资源自己的查询对象，可选字段见本文件头注释；超出范围的后端会静默忽略。
 */
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

/** PUT /api/admin/{resource}/{id} —— 修改；未提交（null）的字段保持原值 */
export function adminResourceUpdate<R extends DedicatedResource>(
  resource: R,
  id: string | number,
  body: Record<string, any>
) {
  return service.put<AdminVoMap[R], AdminVoMap[R]>(path(resource, id), body)
}

/** DELETE /api/admin/{resource}/{id} —— 删除指定记录 */
export function adminResourceDelete(resource: DedicatedResource, id: string | number) {
  return service.delete(path(resource, id))
}
