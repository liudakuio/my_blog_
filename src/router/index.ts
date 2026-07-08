// 路由配置：所有页面共享 Layout 布局，默认重定向到主页
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory('/'),
  routes: [
    {
      path: '/',
      // 共享布局组件（导航栏 + 页脚 + 音乐播放器）
      component: () => import('@/layout/index.vue'),
      // 默认重定向到主页
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/index.vue'),
          meta: { title: '主页', titleEn: 'Home' }
        },
        {
          path: 'portfolio',
          name: 'Portfolio',
          component: () => import('@/views/portfolio/index.vue'),
          meta: { title: '作品', titleEn: 'Portfolio' }
        },
        {
          path: 'articles',
          name: 'Articles',
          component: () => import('@/views/articles/index.vue'),
          meta: { title: '文章', titleEn: 'Articles' }
        },
        {
          path: 'contact',
          name: 'Contact',
          component: () => import('@/views/contact/index.vue'),
          meta: { title: '联系', titleEn: 'Contact' }
        }
      ]
    }
  ]
})

export default router
