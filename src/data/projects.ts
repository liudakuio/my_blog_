// 项目总数据：聚合摄影、动态影像、平面交互、应用开发四个分类的项目
// 说明：这些是「前端写死」的本地数据（对接前方案），不依赖后端接口。
// 首页「精选作品」使用 FEATURED_PROJECTS；作品页 /portfolio 仍走 /api/projects。
import { Project } from '@/types'
import { VIDEOGRAPHY_DATA } from './videography'
import { DESIGN_DATA } from './design'
import { DEV_DATA } from './dev'
import { PHOTOGRAPHY_PROJECTS } from './photography_projects'

/** 全量本地作品（含摄影/影像的占位样例，一般仅用于联调或后续扩展） */
export const PROJECT_DATA: Project[] = [
  ...PHOTOGRAPHY_PROJECTS as Project[],
  ...VIDEOGRAPHY_DATA as Project[],
  ...DESIGN_DATA as Project[],
  ...DEV_DATA as Project[]
]

/**
 * 首页「精选作品」：前端写死的 4 个开发类作品。
 * 摄影 /videography 的旧数据目前是「示例项目标题」占位，故未纳入精选；
 * 若要展示更多（如平面交互），把 DESIGN_DATA 加进来即可：
 *   export const FEATURED_PROJECTS: Project[] = [...DEV_DATA, ...DESIGN_DATA]
 */
export const FEATURED_PROJECTS: Project[] = [...DEV_DATA as Project[]]
