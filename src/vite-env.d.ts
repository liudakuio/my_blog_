/// <reference types="vite/client" />
// Vite 环境类型声明：图片资源模块的 TypeScript 类型补充

declare module '*&format=webp' {
  const src: string;
  export default src;
}

declare module '*?w=600&format=webp' {
  const src: string;
  export default src;
}
