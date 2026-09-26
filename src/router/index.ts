// 路由配置：
// - 公开站点路由（原博客展示页）保持不变
// - 新增 /admin/login（公开）与 /admin 后台框架（需登录，动态菜单）
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/store/user'
import type { MenuItem } from '@/api/auth'

// 扩展路由元信息类型
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    title?: string
    resource?: string
    perms?: string
    icon?: string
  }
}

// 由菜单 component 推导前端路由路径：blog/siteText -> /admin/siteText
function leafPath(menu: MenuItem): string {
  return '/admin/' + (menu.component || menu.path).replace(/^blog\//, '')
}

// 由权限标识推导资源名：blog:project:edit -> project
function resourceOf(menu: MenuItem): string {
  if (!menu.perms) return ''
  const parts = menu.perms.split(':')
  return parts.length >= 2 ? parts[1] : ''
}

// 将菜单树转换为动态路由（仅叶子菜单 C 生成页面）
function buildDynamicRoutes(menus: MenuItem[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []
  const walk = (list: MenuItem[]) => {
    for (const m of list) {
      if (m.menuType === 'C' && m.status === '0') {
        const resource = resourceOf(m)
        if (resource) {
          routes.push({
            path: leafPath(m).replace(/^\/admin\//, ''),
            name: 'Admin_' + resource,
            component: () => import('@/views/admin/crud/index.vue'),
            meta: { requiresAuth: true, title: m.menuName, resource, perms: m.perms, icon: m.icon }
          })
        }
      }
      if (m.children && m.children.length) walk(m.children)
    }
  }
  walk(menus)
  return routes
}

// 标记动态路由是否已注入，避免重复 addRoute
let dynamicRoutesReady = false

// 重置路由注入状态（退出登录后下次进入重新拉取菜单并注入）
export function resetRouteState() {
  dynamicRoutesReady = false
}

// ---------------- 公开站点路由（保持不变） ----------------
const publicRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/dashboard/index.vue'), meta: { title: '主页', titleEn: 'Home' } },
      { path: 'portfolio', name: 'Portfolio', component: () => import('@/views/portfolio/index.vue'), meta: { title: '作品', titleEn: 'Portfolio' } },
      { path: 'articles', name: 'Articles', component: () => import('@/views/articles/index.vue'), meta: { title: '文章', titleEn: 'Articles' } },
      { path: 'articles/:id', name: 'ArticleDetail', component: () => import('@/views/articles/detail.vue'), meta: { title: '文章详情', titleEn: 'Article' } },
      { path: 'contact', name: 'Contact', component: () => import('@/views/contact/index.vue'), meta: { title: '联系', titleEn: 'Contact' } }
    ]
  }
]

// ---------------- 后台路由 ----------------
const adminLoginRoute: RouteRecordRaw = {
  path: '/admin/login',
  name: 'AdminLogin',
  component: () => import('@/views/admin/login/index.vue'),
  meta: { public: true }
}

const adminLayoutRoute: RouteRecordRaw = {
  path: '/admin',
  name: 'admin',
  component: () => import('@/views/admin/layout/index.vue'),
  meta: { requiresAuth: true },
  redirect: '/admin/dashboard',
  children: [
    {
      path: 'dashboard',
      name: 'AdminDashboard',
      component: () => import('@/views/admin/dashboard/index.vue'),
      meta: { requiresAuth: true, title: '仪表盘', icon: 'el-icon-odometer' }
    },
    {
      path: 'profile',
      name: 'AdminProfile',
      component: () => import('@/views/admin/profile/index.vue'),
      meta: { requiresAuth: true, title: '个人中心', icon: 'el-icon-user' }
    }
  ]
}

const router = createRouter({
  history: createWebHistory('/'),
  routes: [...publicRoutes, adminLoginRoute, adminLayoutRoute]
})

// ---------------- 全局导航守卫 ----------------
router.beforeEach(async (to) => {
  const userStore = useUserStore()

  // 登录页：已登录则直接进后台
  if (to.path === '/admin/login') {
    if (userStore.isLoggedIn) return '/admin'
    return true
  }

  // 后台路由需登录
  if (to.path.startsWith('/admin')) {
    if (!userStore.isLoggedIn) return '/admin/login'

    // 首次进入：拉取用户信息 + 动态菜单（仅以 userInfo 是否已加载为判定，
    // 避免后端菜单为空时因 !menus.length 永远为真而陷入重定向死循环）
    let needRerender = false
    if (!userStore.userInfo) {
      try {
        await userStore.fetchInfo()
        await userStore.fetchMenus()
        dynamicRoutesReady = false // 重新登录后允许按最新菜单重建动态路由
      } catch (e) {
        userStore.reset()
        return '/admin/login'
      }
    }

    // 注入动态路由（菜单为空时仅标记已处理，避免重复尝试）
    if (!dynamicRoutesReady) {
      if (userStore.menus.length) {
        const dynamic = buildDynamicRoutes(userStore.menus)
        dynamic.forEach((r) => router.addRoute('admin', r))
      }
      dynamicRoutesReady = true
      needRerender = true
    }

    if (needRerender) return { ...to, replace: true }
  }

  return true
})

export default router
