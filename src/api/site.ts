// 站点全局配置接口：当前后端 SiteConfigVo 只返回导航菜单
// 被 store/site.ts 的 loadConfig() 调用，App.vue 启动时拉取一次
// 注意：当前前端只在 SidebarNav 中使用其中的导航（nav）；
// 首页 / 作品 / 文章等页面的文案仍写死在各自 view 内（见 src/views/dashboard 等），不来自本接口。
import service from '@/utils/request'
import type { LangParam, SiteConfigVo } from './types'

/** GET /api/site/config —— 站点配置（当前后端仅返回 nav 导航） */
export function getSiteConfig(lang: LangParam = 'all') {
  return service.get<SiteConfigVo, SiteConfigVo>('/api/site/config', { params: { lang } })
}
