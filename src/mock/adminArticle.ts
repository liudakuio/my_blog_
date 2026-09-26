// 后台「文章列表」本地 mock（仅用于无后端演示）。
// 接入后端后，由 src/api/admin.ts 的 USE_ADMIN_MOCK 开关统一移除，本文件可删除。
// 字段与后台 article 资源 schema 保持一致（扁平结构）。

export interface AdminArticle {
  id: string
  category: string
  link: string
  cover_image: string
  publish_date: string
  sort: string
  status: string
  remark: string
  content: string
}

const SAMPLE_CONTENT = `# 设计驱动的产品体验

好的产品体验往往始于**设计**，而非功能堆砌。本文以一个虚构的案例，聊聊如何通过 structured 的设计语言提升可用性。

## 一、信息层级

- 用字号与留白区分主次
- 用颜色传递语义（而非装饰）
- 保持一致的间距节奏

## 二、一个代码示例

\`\`\`ts
function greet(name: string): string {
  return \`Hello, \${name}!\`
}
\`\`\`

> 设计不是让东西变漂亮，而是让东西变好用。

---

更多内容可继续在右侧实时预览中查看渲染效果。`

const articles: AdminArticle[] = [
  {
    id: 'a1',
    category: 'design',
    link: '',
    cover_image:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&q=80',
    publish_date: '2026-09-20 10:00:00',
    sort: '1',
    status: '0',
    remark: '设计类示例文章',
    content: SAMPLE_CONTENT
  },
  {
    id: 'a2',
    category: 'tech',
    link: '',
    cover_image:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900&q=80',
    publish_date: '2026-09-12 15:30:00',
    sort: '2',
    status: '0',
    remark: '技术类示例文章',
    content: `# 前端工程化实践

现代前端离不开**工程化**。本文梳理几个关键抓手。

## 构建工具

Vite 以极快的冷启动著称，配合 \`vue-tsc\` 可做类型检查与打包。

## 规范

- ESLint / Prettier 统一风格
- 组件按职责拆分层级
- API 层与 UI 层解耦`
  },
  {
    id: 'a3',
    category: 'life',
    link: '',
    cover_image:
      'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=900&q=80',
    publish_date: '2026-08-30 09:00:00',
    sort: '3',
    status: '1',
    remark: '生活类示例文章（停用）',
    content: `# 关于慢生活

在快节奏里，偶尔也需要停下来。

- 读书
- 散步
- 做饭

这些小事，构成了生活的质感。`
  }
]

// 模拟异步，保证组件调用路径与真实接口一致
function resolve<T>(data: T): Promise<T> {
  return Promise.resolve(data)
}

export function mockAdminList(): Promise<AdminArticle[]> {
  return resolve(articles.map((a) => ({ ...a })))
}

export function mockAdminGet(id: string): Promise<AdminArticle> {
  const item = articles.find((a) => a.id === id)
  if (!item) return Promise.reject(new Error('文章不存在'))
  return resolve({ ...item })
}

export function mockAdminCreate(body: Record<string, any>): Promise<AdminArticle> {
  const item: AdminArticle = {
    id: 'a' + Date.now(),
    category: body.category ?? '',
    link: body.link ?? '',
    cover_image: body.cover_image ?? '',
    publish_date: body.publish_date ?? '',
    sort: body.sort ?? '',
    status: body.status ?? '0',
    remark: body.remark ?? '',
    content: body.content ?? ''
  }
  articles.push(item)
  return resolve({ ...item })
}

export function mockAdminUpdate(
  id: string,
  body: Record<string, any>
): Promise<AdminArticle> {
  const idx = articles.findIndex((a) => a.id === id)
  if (idx >= 0) {
    articles[idx] = {
      ...articles[idx],
      ...body,
      id
    }
  }
  return resolve({ ...articles[idx] })
}

export function mockAdminDelete(id: string): Promise<void> {
  const idx = articles.findIndex((a) => a.id === id)
  if (idx >= 0) articles.splice(idx, 1)
  return resolve(undefined)
}
