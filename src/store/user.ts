// 用户状态管理：token / 用户信息 / 权限 / 动态菜单，登录态持久化到 localStorage。
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getInfo, getMenus, logout as logoutApi, type UserInfo, type MenuItem } from '@/api/auth'
import { TOKEN_KEY } from '@/utils/request'

export const useUserStore = defineStore('user', () => {
  // 登录令牌（持久化到 localStorage）
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) || '')

  // 当前登录用户信息
  const userInfo = ref<UserInfo | null>(null)

  // 权限标识集合（如 blog:project:edit）
  const permissions = ref<string[]>([])

  // 后端下发的动态菜单树
  const menus = ref<MenuItem[]>([])

  // 是否已登录
  const isLoggedIn = computed(() => !!token.value)

  // 用户名（用于顶栏展示）
  const username = computed(() => userInfo.value?.username || '管理员')

  // 登录：获取 JWT 并持久化
  async function login(username: string, password: string) {
    const tk = await loginApi({ username, password })
    token.value = tk
    localStorage.setItem(TOKEN_KEY, tk)
    return tk
  }

  // 拉取用户信息（含权限集合）
  async function fetchInfo() {
    const info = await getInfo()
    userInfo.value = info
    permissions.value = info.permissions || []
    return info
  }

  // 拉取动态菜单树
  async function fetchMenus() {
    const tree = await getMenus()
    menus.value = tree || []
    return tree || []
  }

  // 是否已具备某权限
  function hasPerm(perm: string) {
    if (!perm) return true
    return permissions.value.includes(perm)
  }

  // 是否已具备某资源的编辑权限（约定 blog:{resource}:edit）
  function canEdit(resource: string) {
    return hasPerm('blog:' + resource + ':edit')
  }

  // 退出登录：调用后端（忽略异常）+ 清理本地状态并跳转登录页
  async function logout() {
    try {
      await logoutApi()
    } catch (e) {
      // 无状态登出，忽略网络错误
    }
    reset()
    window.location.href = '/admin/login'
  }

  // 清理登录态（不跳转）
  function reset() {
    token.value = ''
    userInfo.value = null
    permissions.value = []
    menus.value = []
    localStorage.removeItem(TOKEN_KEY)
  }

  return {
    token,
    userInfo,
    permissions,
    menus,
    isLoggedIn,
    username,
    login,
    fetchInfo,
    fetchMenus,
    hasPerm,
    canEdit,
    logout,
    reset
  }
})
