/// <reference types="vite/client" />
// 根目录类型声明：Vue 单文件组件模块类型、Vite 环境变量类型

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_BASE_API: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
