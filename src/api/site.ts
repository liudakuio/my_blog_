// 站点全局配置接口：导航、页脚、首页/内页文案、联系信息、歌单外链
// 被 store/site.ts 的 loadConfig() 调用，App.vue 启动时拉取一次
// 注意：当前前端只在 SidebarNav 中使用其中的导航（nav），
// 首页文案等仍以 src/data/home.ts 的本地写死数据为准
import service from '@/utils/request'
import type { LangParam, SiteConfigVo } from './types'

/** GET /api/site/config —— 导航、页脚、首页、内页文案、联系信息、歌单外链 */
export function getSiteConfig(lang: LangParam = 'all') {
  return service.get<SiteConfigVo, SiteConfigVo>('/api/site/config', { params: { lang } })
}
