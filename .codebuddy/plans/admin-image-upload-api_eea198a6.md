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

## 需求概述
前端同步后端的删减变化，并把相关页面恢复为本地数据版本：

1. **移除 admin 专用接口残留**：后端已删除 `/api/admin/music` 与 `/api/admin/social` 的专用控制器，前端需把 `music` 从专用资源列表移除并清理 `AdminMusicVo`（`social` 前端本就走通用 CRUD，无需改动）。
2. **`/api/site/config` 收窄**：后端该接口现在只返回 `nav`，前端类型与 store 需同步收窄，避免拿到一堆永远为 null 的字段。
3. **恢复「联系/导航」相关数据为之前的本地版本**（即回退到 `c84781e 增加前后端对接` 之前）：
   - 布局页脚（版权 + 设计声明）
   - 联系页（硬编码社交卡片：邮箱 / 微信公众号 / 小红书 / Bilibili / 500px / GitHub）
   - 作品页内页标题与描述
   - 文章页内页标题与描述

## 受影响面（已核实）
- `siteStore.navItems()` 仍正常（nav 保留，侧边栏不动）
- `siteStore.footer` / `.contact` / `.pages` / `.home` / `.musicPlaylistLink` 均因后端收窄而失效，其中 home 与 musicPlaylistLink 已在前两次回退中不再被引用
- 侧边栏导航继续来自后端，`loadConfig()` 必须保留

## 技术方案
- 技术栈沿用现有：Vue3 + TypeScript + Pinia + Element Plus，前端仓库 `d:/lzkgit/my_blog_`
- 回退基准：`git show 2e93863:...`（c84781e 之前的状态）
- 改动策略：
  - **可整文件回退**（最后一次改动就是 c84781e）：`src/layout/index.vue`、`src/views/contact/index.vue`、`src/views/portfolio/index.vue` → 还原为 2e93863 版本
  - **只能定向回退**：`src/views/articles/index.vue`（`14e010c` 又改过，含后端文章集成逻辑），仅替换 `pageData` 的取值来源
  - **数据文件重建**：`src/data/portfolioPage.ts`（旧版原样）、`src/data/articlesPage.ts`（只取 `ARTICLES_PAGE_DATA`，不恢复含本地文章列表的 `src/data/articles.ts`，避免与后端文章集成冲突）
  - 联系页与页脚旧版数据源是 `@/data/home` 的 `CONTACT_DATA`（上次任务已恢复），**无需重建 `src/data/contact.ts`**（旧版该文件 email 是占位符，内容更旧）
  - 类型收窄：`SiteConfigVo` → `{ nav: NavItemVo[] }`；store 删除 `footer/home/pages/contact/musicPlaylistLink` 相关 computed 与导出；删除前 grep 确认 `MusicPlaylistLinkVo` 等类型无其他引用
- 验证：全局 grep 残留引用 + `vue-tsc --noEmit` + lint
