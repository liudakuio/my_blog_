// 认证相关接口：登录 / 用户信息 / 菜单树 / 登出
import service, { requestRaw } from '@/utils/request'

/** 后端 SysMenu（菜单树节点，含 children） */
export interface MenuItem {
  menuId: number
  parentId: number
  menuName: string
  menuType: 'M' | 'C' | 'F'
  orderNum: number
  path: string
  component: string
  icon: string
  perms: string
  status: string
  createTime?: string
  children?: MenuItem[]
}

/** 后端 UserInfo（登录用户信息） */
export interface UserInfo {
  userId: number
  username: string
  permissions: string[]
}

/** 登录请求体 */
export interface LoginBody {
  username: string
  password: string
}

/** POST /api/auth/login —— 返回 JWT 字符串。
 *  兼容后端差异：令牌可能在 data（规范）或 msg（后端重载 bug 时）字段，优先取 data。 */
export function login(body: LoginBody) {
  return requestRaw.post('/api/auth/login', body).then((res: any) => {
    const token = res?.data ?? res?.msg
    if (!token) throw new Error('登录失败：未获取到令牌')
    return token as string
  })
}

/** GET /api/auth/info —— 当前登录用户信息（含权限集合） */
export function getInfo() {
  return service.get<UserInfo, UserInfo>('/api/auth/info')
}

/** GET /api/auth/menus —— 当前用户角色对应的菜单树 */
export function getMenus() {
  return service.get<MenuItem[], MenuItem[]>('/api/auth/menus')
}

/** POST /api/auth/logout —— 无状态登出（前端丢弃令牌） */
export function logout() {
  return service.post('/api/auth/logout')
}
