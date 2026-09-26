// 后台通用 CRUD 接口：覆盖 21 张业务表。
// 路径约定：/api/admin/{resource}；变更操作需 blog:{resource}:edit 权限。
// 列表为全量返回（非分页），可按列等值筛选。
import service from '@/utils/request'
import {
  mockAdminList,
  mockAdminGet,
  mockAdminCreate,
  mockAdminUpdate,
  mockAdminDelete
} from '@/mock/adminArticle'

// TODO: 仅 article 资源临时走前端 mock（无后端也能演示增删改查），接入后端后删除本开关与下方分支。
const USE_ADMIN_MOCK = true

/** GET /api/admin/{resource}?col=val —— 列表（按列等值筛选 + 默认排序） */
export function adminList(resource: string, params?: Record<string, any>) {
  if (USE_ADMIN_MOCK && resource === 'article') return mockAdminList()
  return service.get<any[], any[]>('/api/admin/' + resource, { params })
}

/** GET /api/admin/{resource}/{id} —— 详情 */
export function adminGet(resource: string, id: string | number) {
  if (USE_ADMIN_MOCK && resource === 'article') return mockAdminGet(String(id))
  return service.get<any, any>('/api/admin/' + resource + '/' + id)
}

/** POST /api/admin/{resource} —— 新增 */
export function adminCreate(resource: string, body: Record<string, any>) {
  if (USE_ADMIN_MOCK && resource === 'article') return mockAdminCreate(body)
  return service.post<any, any>('/api/admin/' + resource, body)
}

/** PUT /api/admin/{resource}/{id} —— 修改 */
export function adminUpdate(resource: string, id: string | number, body: Record<string, any>) {
  if (USE_ADMIN_MOCK && resource === 'article') return mockAdminUpdate(String(id), body)
  return service.put<any, any>('/api/admin/' + resource + '/' + id, body)
}

/** DELETE /api/admin/{resource}/{id} —— 删除 */
export function adminDelete(resource: string, id: string | number) {
  if (USE_ADMIN_MOCK && resource === 'article') return mockAdminDelete(String(id))
  return service.delete('/api/admin/' + resource + '/' + id)
}
