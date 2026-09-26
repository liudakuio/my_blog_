// 站点全局配置接口
import service from '@/utils/request'
import type { LangParam, SiteConfigVo } from './types'

/** GET /api/site/config —— 导航、页脚、首页、内页文案、联系信息、歌单外链 */
export function getSiteConfig(lang: LangParam = 'all') {
  return service.get<SiteConfigVo, SiteConfigVo>('/api/site/config', { params: { lang } })
}
