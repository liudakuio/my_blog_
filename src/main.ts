// 应用入口：初始化 Vue 实例，注册 Pinia 状态管理、Vue Router、Element Plus 及其图标
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
