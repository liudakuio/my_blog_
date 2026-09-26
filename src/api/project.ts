// 作品相关接口
import service from '@/utils/request'
import type { CategoryVo, LangParam, ProjectVo } from './types'

/** GET /api/projects —— 作品列表 */
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
