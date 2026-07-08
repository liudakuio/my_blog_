// 项目总数据：聚合摄影、动态影像、平面交互、应用开发四个分类的项目
import { Project } from '@/types'
import { VIDEOGRAPHY_DATA } from './videography'
import { DESIGN_DATA } from './design'
import { DEV_DATA } from './dev'
import { PHOTOGRAPHY_PROJECTS } from './photography_projects'

export const PROJECT_DATA: Project[] = [
  ...PHOTOGRAPHY_PROJECTS as Project[],
  ...VIDEOGRAPHY_DATA as Project[],
  ...DESIGN_DATA as Project[],
  ...DEV_DATA as Project[]
]
