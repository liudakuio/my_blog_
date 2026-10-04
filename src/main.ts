// 应用入口：初始化 Vue 实例，注册 Pinia 状态管理、Vue Router、Element Plus 及其图标
// 插件注册顺序：Pinia -> Router -> Element Plus（顺序不可颠倒，路由守卫依赖 store）。
// 图标：全量注册 @element-plus/icons-vue，因此模板中可直接使用图标组件而无需逐个 import。
// 注意：全量注册会增大包体，若在意体积可改为按需引入。
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import './index.css'

const app = createApp(App)

// 全局注册所有 Element Plus 图标组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册插件：Pinia 状态管理 → Vue Router → Element Plus
app.use(createPinia())
app.use(router)
app.use(ElementPlus, { size: 'default' })

// 挂载到 #app
app.mount('#app')
