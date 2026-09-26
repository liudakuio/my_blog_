// 菜单辅助：后端图标（旧 Element UI 命名 el-icon-xxx）映射到 Element Plus 全局图标组件名；
// 以及由菜单 component 推导前端路由路径。
import type { MenuItem } from '@/api/auth'

// 后端图标名 -> Element Plus 全局组件名（main.ts 已全局注册所有图标）
const ICON_MAP: Record<string, string> = {
  'el-icon-notebook': 'Notebook',
  'el-icon-document': 'Document',
  'el-icon-menu': 'Menu',
  'el-icon-picture': 'Picture',
  'el-icon-pictures': 'Picture',
  'el-icon-share': 'Share',
  'el-icon-files': 'Files',
  'el-icon-collection': 'Collection',
  'el-icon-language': 'Files',
  'el-icon-price-tag': 'PriceTag',
  'el-icon-trophy': 'Trophy',
  'el-icon-reading': 'Reading',
  'el-icon-headset': 'Headset',
  'el-icon-school': 'School',
  'el-icon-suitcase': 'Briefcase',
  'el-icon-medal': 'Medal',
  'el-icon-folder': 'Folder',
  'el-icon-odometer': 'Odometer',
  'el-icon-user': 'User',
  'el-icon-setting': 'Setting'
}

// 解析图标组件名；未知图标回退为 Menu
export function resolveIcon(name?: string): string {
  if (!name) return 'Menu'
  return ICON_MAP[name] || 'Menu'
}

// 由菜单 component 推导前端路由路径：blog/siteText -> /admin/siteText
export function menuRoutePath(menu: MenuItem): string {
  return '/admin/' + (menu.component || menu.path).replace(/^blog\//, '')
}
