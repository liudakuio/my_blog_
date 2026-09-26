// 教育经历接口
import service from '@/utils/request'
import type { EducationVo, LangParam } from './types'

/** GET /api/education —— 教育经历与荣誉 */
export function getEducation(lang: LangParam = 'all') {
  return service.get<EducationVo, EducationVo>('/api/education', { params: { lang } })
}
