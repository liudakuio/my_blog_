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

后台管理端目前所有图片字段（作品封面 `cover`、文章封面 `coverImage`、图集 `image_url`）都是**手填 URL 的输入框**，没有任何上传代码（全站搜索 `upload` 结果为 0）。后端已提供上传接口但前端从未调用。本次将图片字段改为「上传控件」，真正调用后端接口，并移除手填入口。

## 核心功能

1. **图片上传**：表单中 `image` 类型字段提供上传按钮，选择本地图片后调用后端 `POST /api/admin/upload/image` 上传。
2. **回填与预览**：上传成功后把后端返回的相对 URL（如 `/uploads/2026/09/26/uuid.jpg`）写回该字段，并在表单内显示缩略图预览，支持点击放大。
3. **只允许上传**：移除 URL 输入框，图片值统一为 `/uploads` 相对路径；支持「重新上传」覆盖与「移除」清空。
4. **前端校验**：与后端一致的白名单（jpg/jpeg/png/gif/webp）与大小上限（5MB），不合规直接提示且不发请求。
5. **权限控制**：按钮受 `blog:upload:edit` 权限约束，无权限时禁用。
6. **开发态可见**：补齐 `/uploads` 的 dev 代理，否则预览与列表缩略图在开发环境 404。

## 边界

- 只改表单图片字段；**链接字段**（videoUrl / figmaUrl / websiteUrl / githubUrl / audio / link）继续保留 URL 输入框。
- 不做 Markdown 编辑器内上传，不做多图批量上传。

## 技术栈

沿用现有项目栈：Vue 3 + TypeScript + Element Plus（`el-upload` / `el-image`）+ Pinia + Vite；请求复用 `src/utils/request.ts` 的 axios 实例。

## 实现思路

新增一个受控的图片上传组件，在通用 CRUD 表单里为 `image` 类型字段单独增加一个渲染分支，把该字段从「文本输入」切换为「上传控件」。上传走已有的 axios 实例，因此自动带上 JWT、自动享受统一的错误提示与 401 处理，无需重复实现鉴权与报错。

**关键技术决策**：

1. **用 `:http-request` 自定义上传，而不是 `el-upload` 的 `action`**：`action` 不会携带项目统一注入的 `Authorization` 头；自定义 `http-request` 直接复用 `service`，token、错误提示、401 跳转全部自动生效。
2. **抽成独立组件 `ImageUpload.vue` 而非内联进 `index.vue`**：`index.vue` 已近 500 行且是通用视图，上传逻辑（校验、请求、上传态、预览、权限）内聚性高，抽组件可保持主视图可读，且便于复用。
3. **校验前置 + 后端二次校验**：前端按后端 `application.yml` 的白名单与 5MB 上限拦截，减少无效请求；后端仍有扩展名、`contentType`、`size` 三重校验，双保险。
4. **`FormData` 不手动设置 `Content-Type`**：由 axios 自动带 boundary，手动设置会导致后端解析 multipart 失败。
5. **不硬编码后端地址**：组件只接收/回传 URL 字符串，后端前缀变化（如改 CDN）前端无需改动。

## 实现要点（防回归）

- **必须区分 `image` 与 `link` 分支**：当前二者共用兜底 `v-else`。新增 `image` 分支后，需把兜底分支里 `v-if="field.type === 'image'"` 的 `#append` 预览删掉（否则成死代码），兜底只服务 `link` 与文本。
- **`el-upload` 的 `http-request` 必须回调 `options.onSuccess` / `onError`**，否则组件内部上传态不会复位、loading 会卡住。
- **`/uploads` 代理是必须的**：`vite.config.ts` 当前只代理 `/api`。后端返回的 URL 是 `/uploads/...`，不代理会在 dev 下打到 Vite dev server 导致图片 404；生产需同源或由 nginx 转发。
- **权限前置提示**：`blog:upload:edit` 由后端 JwtInterceptor 校验，若当前管理员角色无此权限会 403。前端按 `userStore.hasPerm` 禁用按钮，需同步确认后端角色权限已配置。
- **历史外链数据**：库里已有图片是 unsplash 等绝对地址，改为「只允许上传」后预览仍正常，但编辑时只能重新上传覆盖。

## 架构设计

数据流向：`ImageUpload` 选择文件 → 前置校验 → `adminUploadImage()`（axios，带 token）→ 后端落盘并返回 `{url}` → 响应拦截器剥出 `data` → `emit('update:modelValue', url)` → 写入 `formData[field.key]` → 保存时随表单提交。

组件关系：`crud/index.vue` 在 `image` 分支渲染 `ImageUpload`，以 `v-model` 绑定当前字段；`ImageUpload` 内部依赖 `adminUploadImage`（`src/api/admin.ts`）与 `useUserStore` 的权限判断。

## 目录结构

```
d:/lzkgit/my_blog_/
├── src/
│   ├── api/
│   │   └── admin.ts                  # [MODIFY] 新增 adminUploadImage(file) 与 AdminUploadResult 类型；
│   │                                 #         用 FormData 提交 file 字段，复用 service 自动带 token
│   ├── views/admin/crud/
│   │   ├── ImageUpload.vue           # [NEW] 受控图片上传控件：预览/上传/重新上传/移除、
│   │                                 #       类型与大小前置校验、上传中 loading、权限禁用
│   │   └── index.vue                 # [MODIFY] 新增 image 类型渲染分支接入 ImageUpload；
│   │                                 #         清理兜底分支中已失效的 image 预览逻辑；
│   │                                 #         补充控件样式
│   └── vite.config.ts                # [MODIFY] proxy 增加 /uploads -> http://localhost:8080
```

## 关键代码结构

```ts
// src/api/admin.ts —— 上传结果（后端 UploadResult 的 TS 映射）
export interface AdminUploadResult {
  url: string           // 可直接访问的相对路径，如 /uploads/2026/09/26/uuid.jpg
  originalName: string
  size: number
  ext: string
}

// 单图上传；响应拦截器已剥掉 {code,msg,data}，此处直接拿到 AdminUploadResult
export function adminUploadImage(file: File): Promise<AdminUploadResult>
```

```ts
// src/views/admin/crud/ImageUpload.vue —— 受控组件契约
defineProps<{ modelValue: string }>()        // 当前图片 URL，空串表示未上传
defineEmits<{ 'update:modelValue': [url: string] }>()
```

## 设计风格

沿用后台现有管理端风格：卡片化、轻量留白、与 `crud/index.vue` 一致的浅色/深色双主题（`#fff` / `#141414`，圆角 8-14px）。

## 控件结构（自上而下）

1. **预览区**：已上传显示 120x90 圆角缩略图（`fit="cover"`），点击可放大查看原图；未上传显示虚线占位框（深色下边框 `#2a2a2a`），内含上传图标与「未上传」灰字提示。
2. **操作区**：缩略图下方一行按钮——主按钮「上传图片 / 重新上传」（上传中显示 loading 并禁用），已有图片时追加一个朴素危险按钮「移除」。

## 交互

- 点击主按钮唤起文件选择；选中即上传，成功后缩略图淡入替换并轻提示「上传成功」。
- 文件类型或大小不合规：按钮上方即时红色文字提示，不发请求。
- 无 `blog:upload:edit` 权限时主按钮置灰，鼠标悬停提示「无上传权限」。
- 悬停缩略图轻微放大，与列表页图片列观感一致。