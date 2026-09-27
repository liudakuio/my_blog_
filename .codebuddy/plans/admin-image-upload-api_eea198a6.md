---
name: admin-image-upload-api
overview: 后台 CRUD 表单的 image 类型字段（封面 cover / coverImage、图集 image_url）从「手填 URL」改为「上传到后端接口」，字段值统一为后端返回的 /uploads 相对路径并移除 URL 输入框；同时补上 /uploads 的 dev 代理，否则开发态图片无法显示。
design:
  styleKeywords:
    - 简洁实用
    - 卡片化
    - 轻量留白
    - 浅色/深色双主题
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 16px
      weight: 600
    subheading:
      size: 14px
      weight: 500
    body:
      size: 13px
      weight: 400
  colorSystem:
    primary:
      - "#409EFF"
      - "#337ECC"
    background:
      - "#FFFFFF"
      - "#141414"
      - "#F3F4F6"
    text:
      - "#1A1A1A"
      - "#F0F0F0"
      - "#9CA3AF"
    functional:
      - "#67C23A"
      - "#F56C6C"
      - "#E6A23C"
todos:
  - id: add-upload-api
    content: 在 src/api/admin.ts 新增 adminUploadImage 与 AdminUploadResult 类型
    status: completed
  - id: create-upload-component
    content: 新建 src/views/admin/crud/ImageUpload.vue 上传控件（校验/预览/权限）
    status: completed
    dependencies:
      - add-upload-api
  - id: wire-crud-form
    content: 改造 crud/index.vue：新增 image 分支接入控件并清理兜底死代码
    status: completed
    dependencies:
      - create-upload-component
  - id: add-uploads-proxy
    content: 在 vite.config.ts 增加 /uploads 开发代理指向 8080
    status: completed
  - id: verify-build
    content: 运行 vue-tsc 类型检查并确认 lint 无错误
    status: completed
    dependencies:
      - add-upload-api
      - create-upload-component
      - wire-crud-form
      - add-uploads-proxy
---

## 产品概述
首页（访客端 Dashboard）的 Banner 与文案目前来自后端 `/api/site/config` 的 `home` 节点，需按「音乐播放器」同样的方式回退：恢复为 `c84781e 增加前后端对接` 之前的本地数据版本。

## 核心功能
1. **Banner（Hero 大标题）回退**：三项标题（软件开发 / 嵌入式开发 / 做饭）及注解、分类联动恢复为本地数据，中英双语各一套。
2. **首页文案回退**：简介、精选作品标题、年份区间恢复为本地数据。
3. **右侧联系卡片回退**：BASE、所在地、取得联系等文案恢复为本地 `CONTACT_DATA`。
4. **不再依赖后端 home 节点**：首页渲染不再读取 `/api/site/config` 的 `home`（该请求本身保留，供导航/页脚/联系页使用）。

## 边界
- 只回退首页内容的数据来源，**不动模板结构与样式**（c84781e 当时也只改了 script，模板未变）。
- `siteStore.loadConfig()` 保留，不可删除。
- 后台「首页 Banner」（`hero` 资源）保留，只是其数据不再影响首页展示。


## 技术栈
沿用现有项目栈：Vue 3 + TypeScript + Element Plus + Pinia + Vite。本次为纯前端数据源回退，不涉及后端改动。

## 实现思路
重建被 `c84781e` 删除的本地数据文件 `src/data/home.ts`，再把 `src/views/dashboard/index.vue` 中两个计算属性（`content`、`contactContent`）改回直读本地常量，移除 `useSiteStore` / `pickText` 依赖。由于旧版模板与本版模板一致，只需改 script，视觉与交互自然回到旧版。

## 关键技术决策
1. **重建而非 `git checkout` 旧文件**：旧 `home.ts` 自带 `HeroItem` / `HomeContent` 定义，而 `@/types` 现已存在同形状类型（`Language`、`Category`、`HeroItem`、`HomeContent`）。直接还原会造成重复定义，因此重建时**从 `@/types` 导入**，`home.ts` 仅定义 `@/types` 中没有的 `ContactContent` / `SocialLinks`。
2. **`heroItems` 保留 `|| []` 兜底**：旧版为 `content.value.heroItems || []`，回退时一并返回，避免本地数据异常时模板报错。
3. **保留 `loadConfig()`**：导航（SidebarNav / layout）、页脚、联系页仍依赖 `/api/site/config`，只让首页不再读 `home` 节点，避免误伤其他页面。
4. **不清理 `siteStore.home`**：它是从 config 派生的 computed，无副作用；删除属于范围外改动，留待用户决定。

## 实现要点（防回归）
- 移除 `useSiteStore` 与 `pickText` 后，需确认 dashboard 内无其他位置引用（当前仅 `content` / `contactContent` 两处用到 `siteStore.home`）。
- `tooltipText`（约 140-142 行）依赖 `contactContent.value.tooltip`，本地 `ContactContent` 的 `tooltip` 为可选字段，结构兼容，无需改动；但需确认旧版数据里 tooltip 未配置时文案走默认分支。
- 若回退后 `Category` / `HeroItem` 变成未使用导入，按 lint 结果移除，避免未使用变量告警。
- 首页 Banner 分类点击联动（`portfolioCategory`）逻辑不变，仅数据源变化。

## 目录结构
```
d:/lzkgit/my_blog_/src/
├── data/
│   └── home.ts                 # [NEW] 恢复本地首页数据：HOME_DATA（heroItems/intro/selectedWorks/years）
│                               #       与 CONTACT_DATA（BASE/所在地/取得联系等）双语常量；
│                               #       Language/Category/HeroItem/HomeContent 从 @/types 导入，
│                               #       仅本地定义 ContactContent、SocialLinks
└── views/dashboard/
    └── index.vue               # [MODIFY] script 回退：移除 useSiteStore、pickText、siteStore；
                                #          content = HOME_DATA[appStore.language]；
                                #          contactContent = CONTACT_DATA[appStore.language]；
                                #          heroItems = content.value.heroItems || []
```

## 关键代码结构
```ts
// src/data/home.ts —— 本地首页数据契约（复用 @/types 已有类型）
import type { Language, HeroItem, HomeContent } from '@/types'
import { Category } from '@/types'

export interface SocialLinks {
  wechat: string
  xiaohongshu: string
  bilibili: string
  px500: string
}

export interface ContactContent {
  baseLabel: string
  locationValue: string
  contactLabel: string
  emailMeLabel: string
  email: string
  hello: string
  intro: string
  socials: SocialLinks
  tooltip?: string
  githubLabel: string
  footerDesign: string
}

export const HOME_DATA: Record<Language, HomeContent>
export const CONTACT_DATA: Record<Language, ContactContent>
```

```ts
// src/views/dashboard/index.vue —— 回退后的数据源（与 c84781e 之前一致）
const content = computed(() => HOME_DATA[appStore.language])
const contactContent = computed(() => CONTACT_DATA[appStore.language])
const heroItems = computed(() => content.value.heroItems || [])
```

