// 后台「内容资源 -> 独立页面」注册表（若依风格拆分后的 8 个页面）。
// 路由按后端菜单 perms 推导出的 resource 命中此处；未登记的资源回退通用 CRUD 页兜底。
// 重要：这里的值是 lazy import，**页面文件不会被任何模块静态 import**，
// 静态分析时切勿因「无 import」把 views/admin/content/ 下的页面判为孤儿文件而删除。
// 新增内容页流程：写好 views/admin/content/xxx/index.vue -> 在此登记 resource 名
// （与后端菜单 perms 推导出的 resource 完全一致）-> 后端菜单下发该资源即可出现入口。
// 维护注意：后端已下线 project_i18n / project_tag / project_award / project_gallery
// 以及教育、竞赛相关表，对应页面与条目已移除；后端菜单需同步摘除这些资源，
// 否则路由会回退到通用 CRUD 页（crud/index.vue）渲染空表格。
export const CONTENT_PAGES: Record<string, () => Promise<any>> = {
  // 站点与首页
  site_text: () => import('@/views/admin/content/siteText/index.vue'),
  nav: () => import('@/views/admin/content/nav/index.vue'),
  hero: () => import('@/views/admin/content/hero/index.vue'),

  // 作品
  project: () => import('@/views/admin/content/project/index.vue'),
  project_category: () => import('@/views/admin/content/projectCategory/index.vue'),

  // 文章
  article: () => import('@/views/admin/content/article/index.vue'),
  article_category: () => import('@/views/admin/content/articleCategory/index.vue'),
  article_i18n: () => import('@/views/admin/content/articleI18n/index.vue')
}
