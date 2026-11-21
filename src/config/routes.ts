// 后台路由路径映射：集中维护「后台资源 -> 前端路由路径」，避免路径散落在页面里。
// 背景：仪表盘原先硬编码了 4 条后台路径，与 router 动态路由的生成规则分处两地，
//   后端菜单 component 一旦调整，仪表盘入口就会指向不存在的路由。
// 路径规则：后端菜单 component 形如 blog/article/list，去掉 blog/ 前缀即 /admin/article/list，
//   与 src/router/index.ts 的 leafPath() 推导规则完全一致。
// 被谁引用：src/views/admin/dashboard/index.vue（统计卡片与快捷入口的跳转目标）。

/** 后台资源 -> 前端路由路径；键为资源名（与后端菜单 perms 推导出的 resource 一致） */
const RESOURCE_ROUTES: Record<string, string> = {
  article: '/admin/article/list',
  project: '/admin/project/list',
  article_category: '/admin/article/category',
  project_category: '/admin/project/category'
}

/**
 * 按资源名取后台路由路径。
 * @param resource 资源名，如 article / project / article_category
 * @returns 对应的路由路径；资源未登记时返回空串（调用方需自行兜底）
 */
export function adminRouteByResource(resource: string): string {
  return RESOURCE_ROUTES[resource] ?? ''
}
