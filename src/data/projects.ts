// 首页「精选作品」数据源：前端写死的本地数据，不依赖后端接口
// 数据链路（勿改）：
//   首页 dashboard -> <PortfolioGrid :static-projects="FEATURED_PROJECTS" />
//   -> 不发 /api/projects 请求；分类字典仍走 /api/project-categories
// 作品页 /portfolio 不使用本文件，它走 portfolioStore.loadProjects()（/api/projects）
import { Project } from '@/types'
import { DEV_DATA } from './dev'

/**
 * 首页「精选作品」：前端写死的 4 个开发类作品。
 * 若后续要纳入更多写死分类，在这里追加即可（如其它本地数据集）。
 */
export const FEATURED_PROJECTS: Project[] = [...DEV_DATA as Project[]]
