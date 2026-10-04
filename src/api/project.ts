// 作品相关接口：列表 / 详情 / 分类字典
// 被 store/portfolio.ts 调用，最终由 components/PortfolioGrid.vue 消费
// 注意：作品页 /portfolio 走这里；首页「精选作品」是前端写死数据，不调用本模块
import service from '@/utils/request'
import type { CategoryVo, LangParam, ProjectVo } from './types'

/**
 * GET /api/projects —— 作品列表
 * 默认不返回图集内容（withGallery: false），仅带回 galleryCount 张数；
 * 图集在点开详情时由 getProjectDetail 按需补拉，避免列表接口过大。
 */
export function getProjectList(params?: { category?: string; lang?: LangParam; withGallery?: boolean }) {
  return service.get<ProjectVo[], ProjectVo[]>('/api/projects', {
    params: { lang: 'all', withGallery: false, ...(params || {}) }
  })
}

/** GET /api/projects/{id} —— 作品详情（含完整图集） */
export function getProjectDetail(id: string, lang: LangParam = 'all') {
  return service.get<ProjectVo, ProjectVo>(`/api/projects/${encodeURIComponent(id)}`, { params: { lang } })
}

/** GET /api/project-categories —— 作品分类字典 */
export function getProjectCategories(lang: LangParam = 'all') {
  return service.get<CategoryVo[], CategoryVo[]>('/api/project-categories', { params: { lang } })
}
