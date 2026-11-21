// 系统管理接口：用户 / 角色 / 菜单。
// 路径约定：/api/system/{resource}；写操作需 system:{resource}:edit 权限。
// 注意三者主键名不同：userId / roleId / menuId。
// 被谁引用：views/admin/system/ 下的 user / role / menu 三个页面。
// 类型说明：本文件的 VO 已用于约束函数签名，页面侧通过 useAdminCrud 的泛型参数引用它们。
import service from '@/utils/request'
import type { MenuVo } from './types'

// ---------------- 用户 ----------------
export interface SysUserVo {
  userId: number
  username: string
  nickName?: string
  /** 0 正常 1 停用 */
  status?: string
  createTime?: string
}

/** password：新增必填（后端 BCrypt 加密）；修改时留空表示不修改 */
export type SysUserSaveVo = Partial<Omit<SysUserVo, 'userId'>> & { password?: string }

/**
 * 用户列表查询条件；用 type 而非 interface，便于作为泛型参数传入 useAdminCrud。
 * 字段为必填字符串：查询条件由页面的搜索表单直接绑定，空值在请求前会被剔除。
 */
export type SysUserQuery = {
  /** 模糊匹配 */
  username: string
  status: string
}
/** GET /api/system/user —— 用户列表 */
export function systemUserList(params?: SysUserQuery) {
  return service.get<SysUserVo[], SysUserVo[]>('/api/system/user', { params })
}
/** GET /api/system/user/{userId} —— 详情 */
export function systemUserGet(userId: number | string) {
  return service.get<SysUserVo, SysUserVo>('/api/system/user/' + userId)
}
/** POST /api/system/user —— 新增 */
export function systemUserCreate(body: SysUserSaveVo) {
  return service.post<SysUserVo, SysUserVo>('/api/system/user', body)
}
/** PUT /api/system/user/{userId} —— 修改（null 字段不更新） */
export function systemUserUpdate(userId: number | string, body: SysUserSaveVo) {
  return service.put<SysUserVo, SysUserVo>('/api/system/user/' + userId, body)
}
/** DELETE /api/system/user/{userId} —— 删除（内置 admin 不可删） */
export function systemUserDelete(userId: number | string) {
  return service.delete('/api/system/user/' + userId)
}

// ---------------- 角色 ----------------
export interface SysRoleVo {
  roleId: number
  roleKey: string
  roleName?: string
  status?: string
  createTime?: string
  /** 该角色可访问的菜单 id 集合（详情/保存时使用） */
  menuIds?: number[]
}

/** menuIds 为空表示不调整菜单绑定 */
export type SysRoleSaveVo = Partial<Omit<SysRoleVo, 'roleId'>>

/** 角色列表查询条件；字段为必填字符串，便于搜索表单直接绑定 */
export type SysRoleQuery = {
  roleKey: string
  status: string
}

/** GET /api/system/role —— 角色列表 */
export function systemRoleList(params?: SysRoleQuery) {
  return service.get<SysRoleVo[], SysRoleVo[]>('/api/system/role', { params })
}
/** GET /api/system/role/{roleId} —— 详情（含 menuIds） */
export function systemRoleGet(roleId: number | string) {
  return service.get<SysRoleVo, SysRoleVo>('/api/system/role/' + roleId)
}
/** POST /api/system/role —— 新增（roleKey 必填且唯一） */
export function systemRoleCreate(body: SysRoleSaveVo) {
  return service.post<SysRoleVo, SysRoleVo>('/api/system/role', body)
}
/** PUT /api/system/role/{roleId} —— 修改 */
export function systemRoleUpdate(roleId: number | string, body: SysRoleSaveVo) {
  return service.put<SysRoleVo, SysRoleVo>('/api/system/role/' + roleId, body)
}
/** DELETE /api/system/role/{roleId} —— 删除（内置 admin 角色不可删） */
export function systemRoleDelete(roleId: number | string) {
  return service.delete('/api/system/role/' + roleId)
}

// ---------------- 菜单 ----------------
/**
 * 系统管理接口的菜单 VO。
 * 与认证接口 /api/auth/menus 返回的是同一张 sys_menu 表，已统一复用 api/types.ts 的 MenuVo；
 * 此处保留 SysMenuVo 别名，避免既有引用失效。
 */
export type SysMenuVo = MenuVo

/** 新增：menuName 必填，menuType 缺省 C，parentId 缺省 0 */
export type SysMenuSaveVo = Partial<Omit<SysMenuVo, 'menuId' | 'children'>>

/**
 * 菜单列表查询条件；字段可选。
 * 说明：菜单页的搜索表单只绑定 menuName / menuType / status，
 * 而「上级菜单下拉」只需 tree=true，因此这里的字段必须保持可选。
 */
export type SysMenuQuery = {
  /** 模糊匹配 */
  menuName?: string
  menuType?: string
  status?: string
  /** true 返回树形，默认平铺 */
  tree?: boolean
}

/** GET /api/system/menu —— 菜单列表（tree=true 返回树形） */
export function systemMenuList(params?: SysMenuQuery) {
  return service.get<SysMenuVo[], SysMenuVo[]>('/api/system/menu', { params })
}
/** GET /api/system/menu/{menuId} —— 详情 */
export function systemMenuGet(menuId: number | string) {
  return service.get<SysMenuVo, SysMenuVo>('/api/system/menu/' + menuId)
}
/** POST /api/system/menu —— 新增 */
export function systemMenuCreate(body: SysMenuSaveVo) {
  return service.post<SysMenuVo, SysMenuVo>('/api/system/menu', body)
}
/** PUT /api/system/menu/{menuId} —— 修改（null 字段不更新） */
export function systemMenuUpdate(menuId: number | string, body: SysMenuSaveVo) {
  return service.put<SysMenuVo, SysMenuVo>('/api/system/menu/' + menuId, body)
}
/** DELETE /api/system/menu/{menuId} —— 删除（存在子菜单时返回 400） */
export function systemMenuDelete(menuId: number | string) {
  return service.delete('/api/system/menu/' + menuId)
}
