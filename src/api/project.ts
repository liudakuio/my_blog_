// 作品相关接口：列表 / 详情 / 分类字典
// 被 store/portfolio.ts 调用，最终由 components/PortfolioGrid.vue 消费
// 注意：首页与作品页都走这里；列表按 category 由后端筛选，前端不再本地过滤
import service from '@/utils/request'
import type { CategoryVo, LangParam, ProjectVo } from './types'

/**
 * GET /api/projects —— 作品列表（分类筛选由后端完成）
 * @param params.category 分类值（取自 /api/project-categories 的 value）；不传 / 空表示全部
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
