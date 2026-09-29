// 后台「内容资源 -> 独立页面」注册表（若依风格拆分后的 19 个页面）。
// 路由按后端菜单 perms 推导出的 resource 命中此处；未登记的资源回退通用 CRUD 页兜底。
export const CONTENT_PAGES: Record<string, () => Promise<any>> = {
  // 站点与首页
  site_text: () => import('@/views/admin/content/siteText/index.vue'),
  nav: () => import('@/views/admin/content/nav/index.vue'),
  hero: () => import('@/views/admin/content/hero/index.vue'),

  // 作品
  project: () => import('@/views/admin/content/project/index.vue'),
  project_category: () => import('@/views/admin/content/projectCategory/index.vue'),
  project_i18n: () => import('@/views/admin/content/projectI18n/index.vue'),
  project_tag: () => import('@/views/admin/content/projectTag/index.vue'),
  project_award: () => import('@/views/admin/content/projectAward/index.vue'),
  project_gallery: () => import('@/views/admin/content/projectGallery/index.vue'),

  // 文章
  article: () => import('@/views/admin/content/article/index.vue'),
  article_category: () => import('@/views/admin/content/articleCategory/index.vue'),
  article_i18n: () => import('@/views/admin/content/articleI18n/index.vue'),

  // 教育 / 经历
  education_text: () => import('@/views/admin/content/educationText/index.vue'),
  experience: () => import('@/views/admin/content/experience/index.vue'),
  experience_i18n: () => import('@/views/admin/content/experienceI18n/index.vue'),

  // 荣誉 / 竞赛
  honor: () => import('@/views/admin/content/honor/index.vue'),
  honor_i18n: () => import('@/views/admin/content/honorI18n/index.vue'),
  competition: () => import('@/views/admin/content/competition/index.vue'),
  competition_award: () => import('@/views/admin/content/competitionAward/index.vue')
}
