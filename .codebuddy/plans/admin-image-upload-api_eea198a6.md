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

后台管理端新增「系统管理」模块，用于维护平台的用户、菜单与角色三类系统数据；部门、岗位、日志三个入口保留在侧边栏，但点击后进入统一的「开发中」提示页。

## 核心功能

- **系统管理菜单**：侧边栏出现「系统管理」目录及用户管理、菜单管理、角色管理、部门管理、岗位管理、日志管理六个子菜单，点击后进入各自页面（不再落到通用内容管理页）。
- **用户管理**：按用户名、状态筛选查询；新增用户（用户名与密码必填）；编辑用户信息（密码留空表示不修改）；删除用户（内置管理员不可删，给出明确提示）。列表中不展示密码。
- **菜单管理**：平铺列表与树形结构切换查看；新增菜单（名称必填，可指定上级菜单、类型、路径、组件、图标、权限标识、排序）；编辑；删除（存在子菜单时提示需先删除子菜单）。
- **角色管理**：列表查询；新增与编辑时可勾选该角色可访问的菜单；删除角色（内置管理员角色不可删）。
- **开发中占位**：部门、岗位、日志三个入口可见可点，进入后展示统一的功能开发中提示。
- **权限控制**：新增、编辑、删除等写操作按 `system:{资源}:edit` 权限显示或禁用。

## 视觉效果

沿用后台现有卡片化风格与深浅色双主题：白色/深色卡片容器、圆角工具栏、表格斑马纹、按钮与表单沿用后台既有控件观感，保证与内容管理各页视觉一致。


## 技术栈

沿用现有项目栈，不引入新框架：

- Vue 3 + TypeScript + `<script setup>`
- Element Plus（表格、表单、弹窗、树形控件、消息提示）
- Pinia（用户态与权限）+ Vue Router 4（动态路由）
- Vite；请求复用 `src/utils/request.ts` 的 axios 实例

## 实现思路

核心是「按权限前缀分流路由 + 新增三个专用页面 + 新增系统接口层」。

当前 `buildDynamicRoutes` 把所有叶子菜单都指向通用 CRUD 页，并用 `perms.split(':')[1]` 取资源名，`system:user:edit` 会被解析成资源 `user`，从而请求 `/api/admin/user` 触发后端 `400 未知资源`。因此在路由构建处增加 `system:` 前缀判断：命中则渲染 `views/admin/system/{资源}/index.vue`，否则完整保留原有 `blog:` 分支逻辑，确保内容管理功能零影响。

三个页面不复用通用 CRUD，因为它们的主键名、字段语义与交互（角色需勾选菜单树、菜单需树形切换、用户密码为只写字段）都与通用 CRUD 不同，独立实现更清晰。

**关键技术决策**：

1. **仅改造 `buildDynamicRoutes` 一处，不动侧边栏与菜单配置**：`config/menu.ts` 的 `menuRoutePath` 对 `blog/system/user` 已产出 `/admin/system/user`，与文档建议的路由路径完全一致，侧边栏会自动渲染出「系统管理」及子菜单，无需改动。
2. **部门/岗位/日志路由到共享占位页**：三者无后端接口也无页面文件，若不特殊处理，动态 `import()` 会因文件不存在而解析失败，因此统一指向 `Placeholder.vue`。
3. **密码只写不读**：新增必填；编辑时留空即不提交改密码；列表与详情不回显（后端本身也不返回）。
4. **业务校验交给后端**：用户名重复、roleKey 唯一、内置对象不可删、有子菜单不可删均由后端返回 400 与中文提示，前端依赖响应拦截器统一弹提示，不重复实现校验。
5. **权限复用 `hasPerm`**：与通用 CRUD 页的 `editable` 一致，改用 `hasPerm('system:' + resource + ':edit')` 控制写操作按钮。

## 实现要点（防回归）

- **原 `blog:` 分支必须原样保留**，这是回归清单中「内容管理不受影响」的硬性要求。
- 动态路由仍通过 `router.addRoute('admin', r)` 挂到 `admin` 父路由下，新增路由的 `path` 用相对路径 `system/user`，拼接后为 `/admin/system/user`，与侧边栏链接一致。
- 角色编辑提交 `menuIds` 时，空数组表示「不调整菜单绑定」（后端语义），不要用空数组去清空；需要清空时明确按后端约定处理。
- 菜单管理树形数据用 `tree=true` 查询参数，平铺为默认；树形表格需设置 `row-key="menuId"`。
- 接口函数沿用项目约定书写全路径 `/api/...`（与 `src/api/auth.ts`、`src/api/admin.ts` 一致）。

## 架构设计

数据流向：菜单接口返回菜单树 → 路由构建按权限前缀分流 → 系统页面调用 `src/api/system.ts` → axios 自动携带令牌与统一错误处理 → 页面渲染表格与弹窗表单。

```mermaid
flowchart TD
    A[GET /api/auth/menus 返回菜单树] --> B[buildDynamicRoutes 遍历叶子]
    B --> C{perms 以 system: 开头?}
    C -->|是| D{资源为 user/menu/role?}
    D -->|是| E[views/admin/system/资源/index.vue]
    D -->|否 dept/post/log| F[views/admin/system/Placeholder.vue]
    C -->|否 blog:| G[views/admin/crud/index.vue 保持原逻辑]
    E --> H[src/api/system.ts]
    H --> I[/api/system/user|role|menu]
```

## 目录结构

```
d:/lzkgit/my_blog_/
├── src/
│   ├── api/
│   │   ├── system.ts                  # [NEW] 系统管理接口层：用户 / 角色 / 菜单 的标准增删改查，
│   │   │                              #       并定义 SysUser / SysRole / SysMenu 三个驼峰类型；
│   │   │                              #       用户用 userId、角色用 roleId、菜单用 menuId 作主键
│   │   └── index.ts                   # [MODIFY] 追加 export * from './system'
│   ├── router/
│   │   └── index.ts                   # [MODIFY] 新增 isSystemMenu 判定；buildDynamicRoutes 内
│   │                                  #         分流 system 资源到专用页、dept/post/log 到占位页，
│   │                                  #         原 blog: 分支保持不变
│   └── views/admin/system/
│       ├── Placeholder.vue            # [NEW] 「开发中」占位页，部门 / 岗位 / 日志共用
│       ├── user/index.vue             # [NEW] 用户管理：筛选、列表、新增 / 编辑弹窗、删除
│       ├── menu/index.vue             # [NEW] 菜单管理：平铺 / 树形切换、上级选择、增删改
│       └── role/index.vue             # [NEW] 角色管理：列表、菜单树勾选、增删改
```

## 关键代码结构

```ts
// src/api/system.ts —— 接口与类型（均为驼峰，密码不在返回体中）
export interface SysUser {
  userId: number
  username: string
  nickName?: string
  status?: string
  createTime?: string
}
export interface SysRole {
  roleId: number
  roleKey: string
  roleName?: string
  status?: string
  createTime?: string
  menuIds?: number[]
}
export interface SysMenu {
  menuId: number
  parentId: number
  menuName: string
  menuType?: 'M' | 'C' | 'F'
  orderNum?: number
  path?: string
  component?: string
  icon?: string
  perms?: string
  status?: string
  createTime?: string
  children?: SysMenu[]
}

export function listUsers(params?: { username?: string; status?: string }): Promise<SysUser[]>
export function getUser(userId: number): Promise<SysUser>
export function createUser(body: Partial<SysUser> & { password?: string }): Promise<SysUser>
export function updateUser(userId: number, body: Partial<SysUser> & { password?: string }): Promise<SysUser>
export function deleteUser(userId: number): Promise<void>

// 角色、菜单同构；菜单列表额外支持 tree 参数
export function listMenus(params?: { menuName?: string; menuType?: string; status?: string; tree?: boolean }): Promise<SysMenu[]>
```

```ts
// src/router/index.ts —— 路由分流判定
function isSystemMenu(m: MenuItem): boolean {
  return !!m.perms && m.perms.startsWith('system:')
}
// 命中 system: 时：seg = component 去掉 'blog/' 前缀（如 system/user）
// 组件：() => import('@/views/admin/system/' + 末段 + '/index.vue')
// dept / post / log 三个资源改为指向 '@/views/admin/system/Placeholder.vue'
```


## 设计风格

沿用后台现有管理端风格：卡片化容器、轻量留白、浅色/深色双主题，圆角 14px 卡片与 8px 控件圆角，悬停有轻微反馈，表单弹窗居中。整体简洁实用，与内容管理各页保持同一观感。

## 页面规划

### 1. 用户管理

- **页头**：左侧标题「用户管理」与资源说明文字，标明当前记录条数。
- **筛选工具条**：用户名模糊输入框与状态下拉，右侧「查询」「重置」「新增」按钮。
- **数据表格**：序号、用户名、昵称、状态标签、创建时间列，右侧固定操作列含「编辑」「删除」；状态用成功/危险色标签区分。
- **新增/编辑弹窗**：用户名、昵称、状态、密码四项；编辑时密码留空并提示「留空则不修改密码」。

### 2. 菜单管理

- **页头**：标题与记录条数说明。
- **工具条**：菜单名称输入、类型下拉、状态下拉，以及「平铺/树形」切换开关与「新增」按钮。
- **菜单表格**：树形模式用树形表格展示层级（菜单名、类型、路径、组件、权限标识、排序、状态），平铺模式为普通表格；操作列含「编辑」「删除」。
- **表单弹窗**：上级菜单选择、菜单名称、类型、路径、组件、图标、权限标识、排序、状态。

### 3. 角色管理

- **页头**：标题与记录条数说明。
- **工具条**：角色标识、状态筛选与「新增」按钮。
- **角色表格**：角色标识、角色名称、状态、创建时间与操作列。
- **表单弹窗**：角色标识、角色名称、状态，下方为可折叠的菜单权限树，树节点可勾选，保存时提交所选菜单编号集合。

### 4. 开发中占位页

- **占位卡片**：居中虚线卡片，内含图标与「功能开发中」标题。
- **说明文案**：说明该模块后端接口与数据表尚未提供，后续版本开放。
- **返回按钮**：朴素按钮返回后台首页。

## Agent Extensions

### SubAgent

- **code-explorer**
  - Purpose: 在编写三个新页面前，确认 `el-tree` / `el-table` 树形用法 / `el-dialog` 等组件在项目中的注册方式，并提取 `views/admin/crud/index.vue` 中表格、工具条、弹窗表单的既有写法与样式约定。
  - Expected outcome: 输出组件是否全局注册的结论与可复用的页面骨架清单，确保新页面写法与现有后台一致，避免组件未注册或样式风格漂移。
