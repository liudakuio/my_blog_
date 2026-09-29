---
name: admin-split-independent-pages-ruoyi
overview: 将后台 19 个内容资源（当前由通用 CRUD 页 schema 驱动）拆成各自独立的 Vue 页面，并把已有的 user/menu/role 系统页一并改为若依（RuoYi-Vue3 / Element Plus）风格：搜索区可折叠、工具栏按钮组、表格多选+批量删除、弹窗确定/取消；不做分页；通用 CRUD 页保留为兜底。
design:
  architecture:
    framework: vue
  styleKeywords:
    - 若依后台风格
    - 企业级信息密集
    - 白卡片
    - 紧凑控件密度
    - 克制的单色主色
    - 表格多选与批量操作
    - 折叠搜索区
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 16px
      weight: 600
    subheading:
      size: 14px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#1890FF"
      - "#409EFF"
      - "#1A1A1A"
    background:
      - "#F0F2F5"
      - "#FFFFFF"
      - "#FAFAFA"
    text:
      - "#1A1A1A"
      - "#5A5A5A"
      - "#8C8C8C"
    functional:
      - "#13CE66"
      - "#F56C6C"
      - "#FFBA00"
      - "#909399"
todos:
  - id: shared-layer
    content: 用 [subagent:code-explorer] 核对 19 个资源字段与接口约定，搭建 shared 层：useResourceCrud、RySearchBar、RyToolbar、RyFormDialog、RyStatusTag、ry-theme.less，并上移 ImageUpload
    status: completed
  - id: content-project
    content: 实现作品相关 6 个独立页面：project、project_category、project_i18n、project_tag、project_award、project_gallery
    status: completed
    dependencies:
      - shared-layer
  - id: content-article-site
    content: 实现文章与站点相关 6 个独立页面：article、article_category、article_i18n、site_text、nav、hero
    status: completed
    dependencies:
      - shared-layer
  - id: content-rest
    content: 实现经历荣誉竞赛 7 个独立页面：education_text、experience、experience_i18n、honor、honor_i18n、competition、competition_award
    status: completed
    dependencies:
      - shared-layer
  - id: system-pages
    content: 改造系统管理 3 个页面 user/menu/role 为若依风格，复用 shared 组件
    status: completed
    dependencies:
      - shared-layer
  - id: router-registry
    content: 新增 config/adminPages.ts 注册表并改造 router：按 resource 命中独立页，未命中回退通用 CRUD
    status: completed
    dependencies:
      - content-project
      - content-article-site
      - content-rest
  - id: verify-build
    content: 执行 vue-tsc 类型检查与 vite build，修正类型与引用问题并做后台冒烟
    status: completed
    dependencies:
      - router-registry
      - system-pages
---

## 产品概述

将博客后台管理端当前「一套通用 CRUD 页 + schema 配置」驱动的所有管理界面，拆分为各自独立的页面文件，并把界面风格统一改造为若依（RuoYi-Vue3 / Element Plus）后台风格。

## 核心功能

- 独立页面拆分：19 个内容资源各自一个独立 .vue 页面（不再由 schema 动态生成列与表单）
- 站点/首页：site_text、nav、hero
- 作品：project、project_category、project_i18n、project_tag、project_award、project_gallery
- 文章：article、article_category、article_i18n
- 教育/经历：education_text、experience、experience_i18n
- 荣誉/竞赛：honor、honor_i18n、competition、competition_award
- 系统管理 3 个页面（user / menu / role）同步改造为同一套若依风格
- 若依风格交互（用户选定范围）：
- 搜索区：el-form inline 搜索项 + 搜索/重置按钮 + 展开/收起 + 隐藏搜索
- 工具栏按钮组：新增、修改、删除（批量）、刷新，按选中状态与权限禁用
- 表格：多选 selection 列 + 业务列 + 右侧操作列（编辑/删除）
- 弹窗：新增/编辑表单弹窗，底部「确定 / 取消」
- 不做分页：列表保留后端全量返回的全量表格（后端不在本工作区，不改造接口）
- 通用 CRUD 页保留为兜底：后端新增或未拆分的资源仍走原通用页

## 视觉要求

白色卡片容器、紧凑的表单与表格密度、清晰的按钮层级与状态禁用、状态用标签（正常/停用）、图片列缩略图可预览，整体观感贴近若依后台管理系统；沿用现有深色模式适配。

## 技术栈

沿用现有工程栈，不引入新依赖：

- Vue 3.4 + TypeScript + Vite 5 + Pinia + vue-router 4
- Element Plus 2.6 + @element-plus/icons-vue（已全局注册图标）
- md-editor-v3（仅 article 正文 Markdown 字段）
- Less（页面样式）+ Tailwind（现有全局工具类）
- 接口层复用：`src/api/admin.ts`（通用 CRUD）、`src/api/adminResource.ts`（6 个专用接口）、`src/api/adminTypes.ts`（VO 类型）、`src/api/system.ts`（系统管理）

## 实现方案（核心策略）

采用「**共享若依风格外壳 + 每资源一个薄页面**」的方案：

1. 抽出一层若依风格共享件（搜索栏、工具栏、弹窗壳、CRUD 逻辑 composable、图片上传、主题样式），22 个页面只写自己的列定义与表单字段。这样既满足「每个资源独立页面」，又避免 22 份重复样板代码（DRY）。
2. 页面与路由按 **resource 名**（由后端菜单 perms `blog:{resource}:edit` 推导）映射，不按路径映射：后端菜单路径不可控（如 `blog/project/list` → `/admin/project/list`），按 resource 映射最稳定，未命中的资源自动回退通用 CRUD 页（低风险、向后兼容）。
3. 列表保持全量渲染（用户选择不做分页）。性能上：19 张内容表数据量小（文案/字典/子表级），全量渲染可接受；为避免重复请求，`load()` 内聚在 composable，刷新/删除后统一调用一次。
4. 批量删除：后端无批量接口，用 `Promise.allSettled` 并发单条 DELETE，汇总「成功 N 条 / 失败 M 条」提示后刷新一次；不做串行 N 次提示（避免刷屏）。
5. 6 个专用资源（site_text、project、project_category、article、article_category、education_text）走 `adminResource*` 驼峰 VO 接口；其余 13 个走通用 `admin*` 下划线接口，页面字段严格对齐现有 schema 的 key。

### 页面解析流程

```mermaid
flowchart TD
  A[后端动态菜单 menus] --> B[buildDynamicRoutes 推导 resource]
  B --> C{CONTENT_PAGES[resource] 存在?}
  C -- 是 --> D[独立页面 views/admin/content/xxx/index.vue]
  C -- 否 --> E[兜底通用页 views/admin/crud/index.vue]
  B --> F{perms 前缀 system:?}
  F -- 是 --> G[SYSTEM_PAGES: user/menu/role]
  F -- 否 --> C
```

## 架构设计

- **共享层 `src/views/admin/shared/`**（新增）：只承载「外观 + 通用交互」，不含任何业务字段，供 22 个页面复用。
- **业务层 `src/views/admin/content/<resource>/index.vue`**（新增 19 个）：写死搜索项、表格列、表单项，调用共享 composable。
- **系统层 `src/views/admin/system/{user,menu,role}/index.vue`**（改造）：复用同一套共享件。
- **路由注册 `src/config/adminPages.ts`**（新增）+ `src/router/index.ts`（改造）：resource → 页面组件的异步导入表，未命中回退 `crud/index.vue`；`system` 分支继续用 `SYSTEM_PAGES`。
- **兜底层 `src/views/admin/crud/`**（保留）：不再新增功能，仅作为未拆分资源的兜底；`ImageUpload.vue` 上移到 shared 后由 crud 引用新位置。

## 实施要点（防回归）

- 字段大小写是本项目最大坑：专用资源驼峰（`coverImage`、`publishDate`）、通用资源下划线（`image_url`、`tag_name_zh`）。页面字段必须与 `schema.ts` / `AdminVoMap` 逐字一致，建议实现时逐资源对照。
- `editable` 仍用 `useUserStore().canEdit(resource)`；无编辑权限时新增/修改/删除按钮禁用，表格不渲染操作列（与现有一致）。
- 深色模式沿用现有约定：样式内用 `.dark & {}` 覆盖，`isDark` 来自 `useAppStore()`；Markdown 编辑器 theme 继续跟随 `isDark`。
- article 页含 Markdown 正文，弹窗保持现有「全屏 + 1080px 宽」的处理，避免编辑器被压扁。
- 图片字段继续用 `ImageUpload`（值统一为 `/uploads` 相对路径），不要另造上传组件。
- 删除前保留 `ElMessageBox.confirm` 二次确认；批量删除的确认文案显示条数。
- 冒烟范围：登录后台 → 逐个菜单进入 22 个页面，确认列表加载、搜索/重置、新增、编辑、单条删除、批量删除、深色模式均正常；确认未被拆分的新资源仍落到通用页。

## 目录结构

```
src/
├── config/
│   └── adminPages.ts                      # [NEW] resource -> 独立页面异步导入映射（CONTENT_PAGES），集中登记 19 个内容页面
├── router/
│   └── index.ts                           # [MODIFY] buildDynamicRoutes 内容资源分支改为 CONTENT_PAGES[resource] ?? 通用 CRUD 兜底
├── api/
│   └── adminResource.ts                   # [KEEP] 6 个专用资源接口，不改动；页面按 resource 选择调用
└── views/admin/
    ├── shared/                            # [NEW] 若依风格共享层
    │   ├── useResourceCrud.ts             # [NEW] CRUD composable：loading/list/filters/查询/重置/新增/编辑/保存/单删/批量删/权限，自动按 isDedicatedResource 选接口
    │   ├── RySearchBar.vue                # [NEW] 折叠搜索区：inline 表单插槽 + 搜索/重置 + 展开/收起 + 隐藏搜索
    │   ├── RyToolbar.vue                  # [NEW] 工具栏按钮组：新增/修改/删除/刷新，选中态与权限驱动的禁用逻辑
    │   ├── RyFormDialog.vue               # [NEW] 表单弹窗壳：标题 + 内容插槽 + 底部确定/取消，支持 600px 与全屏两档
    │   ├── RyStatusTag.vue                # [NEW] 状态标签：0 正常(success) / 1 停用(info)，供各页状态列复用
    │   ├── ImageUpload.vue                # [MOVE] 由 crud/ImageUpload.vue 上移，供独立页与通用页共用
    │   └── ry-theme.less                  # [NEW] 若依风格样式变量与卡片/工具栏/表格/弹窗基础样式（含 .dark 适配）
    ├── content/                           # [NEW] 19 个独立内容管理页（每页写死自己的搜索项/列/表单项）
    │   ├── siteText/index.vue             # [NEW] 站点文案：configKey/valueZh/valueEn/remark
    │   ├── nav/index.vue                  # [NEW] 导航菜单：nav_key/label_zh/label_en/sort
    │   ├── hero/index.vue                 # [NEW] 首页 Banner：text_zh/text_en/annotation_zh/annotation_en/category/sort
    │   ├── projectCategory/index.vue      # [NEW] 作品分类（专用接口）：categoryValue/labelZh/labelEn/sort/status
    │   ├── project/index.vue              # [NEW] 作品列表（专用接口）：id 必填 + category/cover(图)/icon/videoUrl/bilibiliId/figmaUrl/websiteUrl/githubUrl/sort/status/remark
    │   ├── projectI18n/index.vue          # [NEW] 作品多语：project_id/lang/title/subtitle/description/role/role_detail/concept
    │   ├── projectTag/index.vue           # [NEW] 作品标签：project_id/tag_name_zh/tag_name_en/sort
    │   ├── projectAward/index.vue         # [NEW] 作品获奖：project_id/award_name_zh/award_name_en/sort
    │   ├── projectGallery/index.vue       # [NEW] 作品图集：project_id/image_url(图)/sort
    │   ├── articleCategory/index.vue      # [NEW] 文章分类（专用接口）：categoryValue/labelZh/labelEn/shortLabelZh/shortLabelEn/sort/status
    │   ├── article/index.vue              # [NEW] 文章列表（专用接口）：id 必填 + category/link/coverImage(图)/publishDate(日期)/sort/status/remark + content(Markdown，全屏弹窗)
    │   ├── articleI18n/index.vue          # [NEW] 文章多语：article_id/lang/title
    │   ├── educationText/index.vue        # [NEW] 教育文案（专用接口）：configKey/valueZh/valueEn/remark
    │   ├── experience/index.vue           # [NEW] 教育/工作经历：id/year/exp_type/sort
    │   ├── experienceI18n/index.vue       # [NEW] 经历多语：exp_id/lang/title/institution/description
    │   ├── honor/index.vue                # [NEW] 荣誉管理：honor_type/sort
    │   ├── honorI18n/index.vue            # [NEW] 荣誉多语：honor_id/lang/content
    │   ├── competition/index.vue          # [NEW] 竞赛分组：level_zh/level_en/sort
    │   └── competitionAward/index.vue     # [NEW] 竞赛明细：comp_id/content_zh/content_en/sort
    ├── system/
    │   ├── user/index.vue                 # [MODIFY] 改用共享件重构成若依风格（搜索区+按钮组+多选+弹窗）
    │   ├── menu/index.vue                 # [MODIFY] 同上
    │   └── role/index.vue                 # [MODIFY] 同上
    └── crud/
        ├── index.vue                      # [KEEP] 通用 CRUD 兜底页，仅调整 ImageUpload 引用路径
        ├── schema.ts                      # [KEEP] 继续作为兜底与字段对照基准，不删除
        ├── types.ts                       # [KEEP]
        └── ImageUpload.vue                # [MOVE] 上移至 shared/ImageUpload.vue
```

## 关键接口约定

```ts
// src/views/admin/shared/useResourceCrud.ts
export interface UseResourceCrudOptions {
  resource: string            // 如 'project'、'project_i18n'
  idKey?: string              // 主键字段，默认 'id'
  defaultForm?: Record<string, any>  // 新增时表单默认值
}
export function useResourceCrud(options: UseResourceCrudOptions): {
  list: Ref<any[]>
  loading: Ref<boolean>
  filters: Record<string, any>
  editable: ComputedRef<boolean>
  selection: Ref<any[]>
  dialogVisible: Ref<boolean>
  isEdit: Ref<boolean>
  formData: Record<string, any>
  saving: Ref<boolean>
  query(): Promise<void>
  resetQuery(): Promise<void>
  openAdd(): void
  openEdit(row: any): void
  submit(): Promise<void>
  remove(row: any): Promise<void>
  batchRemove(): Promise<void>
}
```

## 设计风格

采用若依（RuoYi）后台管理系统的经典信息密集型风格：白底卡片 + 浅灰页面背景，内容区以「搜索区 / 工具栏 / 数据表 / 弹窗表单」四段式纵向排列，控件密度紧凑、层级清晰。整体气质偏企业后台：克制的配色、明确的按钮主次、稳定的信息层级，不使用大面积渐变或装饰性元素。

## 页面区块设计（每个管理页统一四段式）

1. 搜索区：白卡片内的 inline 表单，字段按资源关键字段排布；右侧「搜索 / 重置」，超过 3 个搜索项时折叠，提供「展开 / 收起」；卡片右上角提供「隐藏搜索」切换。
2. 工具栏：左侧按钮组「新增（主色）/ 修改 / 删除（危险色）/ 刷新（朴素）」，按选中条数与权限置灰；右侧显示总数统计文案。
3. 数据表格：首列为多选勾选框，随后为业务列，末列固定右侧「操作：编辑 / 删除」文字按钮；图片列显示缩略图（悬浮放大预览），状态列用标签（正常=绿、停用=灰），长文本溢出省略。
4. 表单弹窗：居中弹窗（默认 600px），标签右对齐、控件通栏；底部右侧「确定 / 取消」；含 Markdown 正文的文章页使用宽弹窗或全屏，编辑器与实时预览并排。

## 交互与状态

- 按钮禁用：未选中时「修改 / 删除」禁用；「修改」要求恰好选中 1 条；无编辑权限时三个写操作全部禁用且不渲染操作列。
- 反馈：删除走二次确认弹窗，批量删除汇总成功/失败条数提示；保存期间按钮 loading，成功后关闭弹窗并刷新列表。
- 表格 hover 高亮、斑马纹、加载态遮罩沿用 Element Plus 默认行为，保持与若依一致的手感。

## 响应式

桌面后台布局，表格横向滚动、操作列固定右侧；窄屏下搜索区自动换行堆叠，工具栏按钮保持一行并允许横向滚动。深色模式沿用现有 `.dark` 主题变量，卡片与表格背景反色、边框降饱和，保证对比度。

## Agent Extensions

### SubAgent

- **code-explorer**
- Purpose: 在实现共享层与批量页面前，核对 19 个资源的字段命名（驼峰/下划线）、接口选择（专用/通用）、现有通用页的校验与删除确认等共有逻辑，作为统一页面模板基线
- Expected outcome: 输出一份逐资源的「字段清单 + 接口选择 + 主键类型 + 是否含图片/Markdown 字段」对照表，确保 22 个页面字段零误差、不会因大小写或接口选错导致回归