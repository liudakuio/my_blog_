// 认证相关接口：登录 / 用户信息 / 菜单树 / 登出
// 被 store/user.ts 调用（登录、拉取信息与菜单、登出），后台路由注入依赖这里返回的菜单树
// 登录用 requestRaw（拿未拆包的原始响应），其余走 service（自动取 data 并按业务码校验）
import service, { requestRaw } from '@/utils/request'
import type { MenuVo } from './types'

/**
 * 后端菜单树节点（sys_menu 表，含 children）。
 * 该结构与 system.ts 的菜单管理接口返回的是同一张表，已统一到 api/types.ts 的 MenuVo；
 * 此处保留 MenuItem 别名，避免既有引用（store/user.ts、config/menu.ts）失效。
 */
export type MenuItem = MenuVo

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

/** 登录接口的原始响应体（requestRaw 不剥外壳，直接拿到后端统一响应体） */
interface LoginRawResponse {
  /** 规范位置：令牌在 data 字段 */
  data?: string
  /** 兼容位置：后端重载 bug 时令牌在 msg 字段 */
  msg?: string
}

/** POST /api/auth/login —— 返回 JWT 字符串。
 *  兼容后端差异：令牌可能在 data（规范）或 msg（后端重载 bug 时）字段，优先取 data。 */
export function login(body: LoginBody) {
  return requestRaw.post('/api/auth/login', body).then((res) => {
    const payload = res as unknown as LoginRawResponse
    const token = payload?.data ?? payload?.msg
    if (!token) throw new Error('登录失败：未获取到令牌')
    return token
  })
}

/** GET /api/auth/info —— 当前登录用户信息（含权限集合） */
export function getInfo() {
  return service.get<UserInfo, UserInfo>('/api/auth/info')
}

/** GET /api/auth/menus —— 当前用户角色对应的菜单树 */
export function getMenus() {
  return service.get<MenuVo[], MenuVo[]>('/api/auth/menus')
}

/** POST /api/auth/logout —— 无状态登出（前端丢弃令牌） */
export function logout() {
  return service.post('/api/auth/logout')
}
