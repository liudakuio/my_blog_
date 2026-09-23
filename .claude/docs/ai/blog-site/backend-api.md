# 后端接口文档（my_blog_ 个人作品集站点）

> 面向后端开发的实现规格。路径前缀 `/api`（来自前端 `src/utils/request.ts` 的 `baseURL = import.meta.env.VITE_BASE_API || '/api'`）。
> 字段名与前端现有 `src/types/index.ts`、`src/data/*.ts` 保持一致，减少联调改动。

## 1. 概述

| 项 | 说明 |
|----|------|
| 服务前缀 | `/api` |
| 请求方式 | 全部 `GET`（站点纯只读，无登录鉴权） |
| 数据格式 | `application/json` |
| 超时 | 前端 10s |
| 调用方 | 访客端（Vue 3 SPA），匿名调用 |
| 后台管理 | 独立系统，不在本文档范围；本站接口只读 |

## 2. 通用约定

### 2.1 响应封装

所有接口统一返回 `{ "code": 200, "msg": "success", "data": {} }`。

前端拦截器（`src/utils/request.ts`）：`code` 存在且 `!== 200` 时弹 `msg` 并 reject。**成功必须 `code === 200`**，请勿用 `0` 表示成功。HTTP 状态码请与 `code` 保持一致。

### 2.2 错误码

| code | 含义 | 前端处理 |
|------|------|----------|
| 200 | 成功 | 正常渲染 |
| 400 | 参数错误（lang / category / 分页非法） | 弹 `msg` |
| 404 | 资源不存在（如作品 id 不存在） | 弹 `msg`，详情弹窗不打开 |
| 500 | 服务端错误 | 弹 `msg` |

前端只做通用"弹 msg"处理，暂无按码分支。

### 2.3 双语策略（`lang` 参数）

| 取值 | 行为 |
|------|------|
| `zh` | 单语：多语字段直接返回中文字符串 / 字符串数组 |
| `en` | 单语：返回英文 |
| `all`（默认） | 双语：多语字段收进 `zh`、`en` 两个子对象 |

```json
// lang=zh
{ "id": "dev1", "title": "微信聊天记录数据分析", "tags": ["Python"] }
// lang=all
{ "id": "dev1", "zh": { "title": "微信聊天记录数据分析", "tags": ["Python"] }, "en": { "title": "WeChat Msg Analysis", "tags": ["Python"] } }
```

**前端默认用 `lang=all`**：内容量小（作品几十条、文章数十条），一次取双语后切换中/英文不再发请求、页面不闪。若后端认为体积不可接受，需前端增加"切语言重新拉取"逻辑，请联调前确认。

### 2.4 其他约定

- **时间格式**：文章日期 `YYYY-MM-DD`（前端 `new Date(date)` 解析后做升降序排序）。
- **URL 字段**：图片、音频返回**可直接访问的绝对地址**。
- **图片**：摄影图集单项目可达 50 张，请提供 CDN 尺寸参数（如 `?w=400`）或缩略图 / 原图两档地址（网格用缩略图、灯箱用原图）。
- **防盗链**：前端图片统一带 `referrerpolicy="no-referrer"`（现网图片来自微信 CDN）。若后端转存到自有对象存储则无此问题；若沿用外链，请确保允许无 referer 访问。
- **音频**：必须支持 HTTP Range（返回 `Accept-Ranges: bytes`、`206 Partial Content`），否则播放器进度拖动失效。
- **分页**：统一 `page`（从 1 开始）+ `pageSize`，响应带 `total`。
- **缓存**：内容更新低频，建议 CDN + `ETag` / `Cache-Control`。

## 3. 数据字典（枚举值，前端已写死，请勿随意变更）

### 3.1 作品分类 `project_category`

| value | 中文 | 英文 | 前端顺序 |
|-------|------|------|----------|
| `Photography` | 静态摄影 | Photography | 1 |
| `Videography` | 动态影像 | Videography | 2 |
| `Graphics & UI` | 平面交互 | Graphics & UI | 3 |
| `Development` | 应用开发 | Development | 4 |

`All`（全部）由前端自行拼在筛选栏首位，不是后端分类。

### 3.2 文章分类 `article_category`

| value | 中文 | 英文 |
|-------|------|------|
| `DiT` | DiT \| 数媒与课程 | DiT \| DMT & Courses |
| `LUNA` | LUNA \| 影像相关 | LUNA \| Visual Arts |
| `瞎叨be叨` | 瞎叨be叨 \| 杂记 | Random Thoughts |
| `After8` | After8 \| 聊艺术 | After8 \| Art Talk |
| `山海疗养院` | 山海疗养院 \| 游记 | Serenity Vista \| Travel |

⚠️ 前端当前把标签按 `|` 截断取前半段做封面角标。**建议直接返回 `label`（按钮文案）与 `shortLabel`（角标文案）两个字段**，废弃 `|` 截断约定。

### 3.3 开发类项目图标 `icon`

| value | 前端组件 |
|-------|----------|
| `message-circle` | ChatLineSquare |
| `id-card` | CreditCard |
| `file-text` | Document |
| `film` | VideoCamera |
| 缺省 | Monitor（回退） |

### 3.4 社交平台 `social.key`

`email` · `wechat` · `xiaohongshu` · `bilibili` · `px500` · `github`

### 3.5 教育经历类型 `experience.type`

`education`（教育） · `work`（工作）

## 4. 接口总览

| # | 接口 | 方法 | 说明 | 调用方 |
|---|------|------|------|--------|
| 1 | `/api/site/config` | GET | 站点全局配置（导航、页脚、首页、页面文案、联系信息） | 全站，首屏一次 |
| 2 | `/api/projects` | GET | 作品列表 | 主页 / 作品页 |
| 3 | `/api/projects/:id` | GET | 作品详情（含完整图集） | 详情弹窗（可选） |
| 4 | `/api/project-categories` | GET | 作品分类字典 | 作品网格筛选栏 |
| 5 | `/api/articles` | GET | 文章列表（分页） | 文章页 |
| 6 | `/api/article-categories` | GET | 文章分类字典 | 文章页侧栏 |
| 7 | `/api/music/playlist` | GET | 音乐播放列表 | 全站播放器 |
| 8 | `/api/education` | GET | 教育经历与荣誉（**待确认是否纳入**） | 暂无页面接入 |

---

## 5. 接口详情

### 5.1 `GET /api/site/config` — 站点全局配置

**用途**：首屏一次性取回全站文案。被 `SidebarNav.vue`、`layout/index.vue`、`views/dashboard`、`views/portfolio`、`views/contact` 消费。

**Query**：`lang`（`zh` / `en` / `all`，默认 `all`）

**data 字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| `nav` | NavItem[] | 导航菜单，按 `sort` 升序 |
| `footer.copyright` | 多语 | 页脚版权，如 `© 2026 刘中魁` |
| `footer.designStatement` | 多语 | 页脚设计声明 |
| `home.heroItems` | HeroItem[] | 首页大标题项 |
| `home.intro` | 多语 | 首页简介，多行用 `\|` 分隔（前端按 `\|` 换行） |
| `home.selectedWorks` | 多语 | "精选作品"标题 |
| `home.years` | string | 年份范围，如 `[ 2024 — 2026 ]`（非翻译字段，单值） |
| `home.contactCard` | object | `baseLabel`、`locationValue`(多语)、`contactLabel`(多语)、`tooltip`(多语) |
| `pages.portfolio` | `{title, description}` | 作品页标题描述（多语） |
| `pages.articles` | `{title, description}` | 文章页标题描述（多语） |
| `contact` | ContactInfo | 联系页内容（见下） |
| `musicPlaylistLink` | `{title, subtitle, url}` | 播放器底部"我的歌单"外链卡片（多语） |

- **NavItem**：`{ id, label, sort }`。`id` 固定为 `dashboard` / `portfolio` / `articles` / `contact`，与前端路由名一一对应（首字母大写匹配），请勿变更。
- **HeroItem**：`{ text, annotation, category, sort }`，`text` / `annotation` 为多语，`category` 取作品分类枚举值或 `null`。
  - `category` 为 `null` 时前端点击只弹 toast（"还在学… 🍳"），不做筛选。
  - `text` 请勿返回"摄影摄像 / Photography & Videography"这类合并词：前端会硬拆成"摄影""摄像"两个可点区域，属于兼容 hack，新数据应避免。
- **ContactInfo**：`{ hello, intro, email, emailLabel, socials: SocialItem[] }`（`hello` / `intro` / `emailLabel` 多语，`email` 单值）
- **SocialItem**：`{ key, name, account, url, icon, clickable, tooltip }`
  - `clickable`：是否可点跳转（邮箱卡片 `false`，其余 `true`）
  - `tooltip`：`{ text, domain }` 或 `null`；非空时前端 hover 显示浮层（文案 + 域名副标题）
  - `url`：`clickable=false` 时可为空字符串

**响应示例（lang=all）**

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "nav": [
      { "id": "dashboard", "label": { "zh": "主页", "en": "Home" }, "sort": 1 },
      { "id": "portfolio", "label": { "zh": "作品", "en": "Portfolio" }, "sort": 2 },
      { "id": "articles", "label": { "zh": "文章", "en": "Articles" }, "sort": 3 },
      { "id": "contact", "label": { "zh": "联系", "en": "Contact" }, "sort": 4 }
    ],
    "footer": {
      "copyright": "© 2026 刘中魁",
      "designStatement": { "zh": "Powered by …", "en": "Powered by …" }
    },
    "home": {
      "heroItems": [
        { "text": { "zh": "软件开发", "en": "Software Development" }, "annotation": { "zh": "（目前主业）", "en": "(Current main work)" }, "category": "Development", "sort": 1 },
        { "text": { "zh": "做饭", "en": "Cooking" }, "annotation": { "zh": "（还在学）", "en": "(Still Learning)" }, "category": null, "sort": 2 }
      ],
      "intro": { "zh": "多行用 | 分隔", "en": "Multiline split by |" },
      "selectedWorks": { "zh": "精选作品", "en": "Selected Works" },
      "years": "[ 2024 — 2026 ]",
      "contactCard": {
        "baseLabel": "BASE",
        "locationValue": { "zh": "河南 郑州", "en": "HENAN ZHENGZHOU" },
        "contactLabel": { "zh": "取得联系", "en": "Get in touch" },
        "tooltip": { "zh": "我在郑州，可以交个朋友哦！", "en": "I'm in Zhengzhou. Would you like to make friends with me?" }
      }
    },
    "pages": {
      "portfolio": { "title": { "zh": "作品", "en": "Portfolio" }, "description": { "zh": "…", "en": "…" } },
      "articles": { "title": { "zh": "文章", "en": "Articles" }, "description": { "zh": "…", "en": "…" } }
    },
    "contact": {
      "hello": { "zh": "你好 :-)", "en": "Hello :-)" },
      "intro": { "zh": "欢迎探讨与合作。", "en": "Welcome to discuss & cooperate." },
      "email": "1365693530@qq.com",
      "emailLabel": { "zh": "邮箱", "en": "Email Me" },
      "socials": [
        { "key": "email", "name": { "zh": "邮箱", "en": "Email Me" }, "account": "1365693530@qq.com", "url": "", "icon": "message", "clickable": false, "tooltip": null },
        { "key": "wechat", "name": { "zh": "公众号", "en": "WeChat" }, "account": "YourWeChatID", "url": "https://mp.weixin.qq.com/s/xxx", "icon": "chat", "clickable": true, "tooltip": { "text": "Click to view profile", "domain": "mp.weixin.qq.com" } },
        { "key": "xiaohongshu", "name": { "zh": "小红书", "en": "RED" }, "account": "YourID", "url": "https://www.xiaohongshu.com/user/profile/xxx", "icon": "camera", "clickable": true, "tooltip": { "text": "Click to view profile", "domain": "xiaohongshu.com" } },
        { "key": "bilibili", "name": { "zh": "Bilibili", "en": "Bilibili" }, "account": "YourID", "url": "https://b23.tv/XNNX02Q", "icon": "video-camera", "clickable": true, "tooltip": { "text": "Click to view profile", "domain": "b23.tv/XNNX02Q" } },
        { "key": "px500", "name": { "zh": "500px", "en": "500px" }, "account": "YourID", "url": "https://500px.com.cn/LuN3cy", "icon": "camera", "clickable": true, "tooltip": null },
        { "key": "github", "name": { "zh": "GitHub", "en": "GitHub" }, "account": "@LuN3cy", "url": "https://github.com/LuN3cy", "icon": "monitor", "clickable": true, "tooltip": null }
      ]
    },
    "musicPlaylistLink": {
      "title": { "zh": "品味不错？", "en": "Nice taste?" },
      "subtitle": { "zh": "我的歌单有更多好听的哦", "en": "Check out my full playlist for more" },
      "url": "https://music.163.com/playlist?id=74188173"
    }
  }
}
```

---

### 5.2 `GET /api/projects` — 作品列表

**用途**：主页"精选作品"网格 + 作品页网格共用同一份数据（前端本地按分类筛选，不重复请求）。

**Query**

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| `category` | string | 否 | 空（全部） | 作品分类枚举值 |
| `lang` | string | 否 | `all` | `zh` / `en` / `all` |
| `withGallery` | boolean | 否 | `false` | 是否随列表返回完整图集；默认只返回 `galleryCount` |

**data**：`Project[]`，按 `sort` 升序。

非语言相关字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 稳定唯一，前端用作 `v-for` key |
| `category` | string | 是 | 见 3.1 |
| `cover` | string | 否 | 封面图 URL，可为空（前端有三态渲染） |
| `icon` | string | 否 | 仅 Development 使用，见 3.3 |
| `videoUrl` | string | 否 | 直链视频地址 |
| `bilibiliId` | string | 否 | B 站 BV 号，前端拼 `player.bilibili.com` iframe |
| `figmaUrl` | string | 否 | Figma 嵌入链接 |
| `websiteUrl` | string | 否 | 线上 Demo 地址 |
| `githubUrl` | string | 否 | 仓库地址 |
| `gallery` | string[] | 否 | 图集，仅 `withGallery=true` 时返回 |
| `galleryCount` | number | 是 | 图集张数 |
| `sort` | number | 是 | 排序权重 |

多语字段（`lang=all` 时收进 `zh` / `en` 对象，单语时平铺）：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 标题 |
| `subtitle` | string | 是 | 副标题（Development 显示为技术栈） |
| `description` | string | 是 | 描述 |
| `role` | string | 是 | 角色 |
| `roleDetail` | string | 否 | 职责详情 |
| `concept` | string | 否 | 设计意图 / 创意陈述，空则不渲染该块 |
| `tags` | string[] | 是 | 标签，Photography 分类前端不展示 |
| `awards` | string[] | 否 | 获奖列表。**空数组或 `null` 即表示无获奖**，请勿返回"无 / None / 暂无获奖"字符串 |

**业务规则（前端渲染依赖）**

1. 封面三态：有 `cover` → 显示图片；无 `cover` 但有 `bilibiliId` → 显示播放按钮 + "Video Preview"；都没有 → 显示标题占位 + "预览部署中… / Preview Deploying…"。
2. 详情弹窗媒体优先级：`videoUrl` > `bilibiliId` > `figmaUrl` > `websiteUrl` > 占位。
3. `category === "Development"` 时前端走图标卡片样式（用 `icon` + `subtitle`），不使用封面图、不显示图集。
4. `awards` 为空数组 / `null` / `undefined` 时不渲染获奖块。

**响应示例（lang=all，withGallery=false）**

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": "dev1",
      "category": "Development",
      "cover": "",
      "icon": "message-circle",
      "websiteUrl": "https://wechat-msganalysis-xxx.streamlit.app/",
      "githubUrl": "https://github.com/LuN3cy/WeChat-MsgAnalysis",
      "galleryCount": 0,
      "sort": 10,
      "zh": {
        "title": "微信聊天记录数据分析", "subtitle": "Python / Streamlit",
        "description": "对json格式的聊天记录进行完整的分析…", "role": "全栈开发",
        "roleDetail": "独立完成后端数据处理逻辑与前端可视化界面开发。", "concept": "",
        "tags": ["Python", "Streamlit", "数据分析"], "awards": []
      },
      "en": {
        "title": "WeChat Msg Analysis", "subtitle": "Python / Streamlit",
        "description": "Comprehensive analysis of JSON chat records…", "role": "Full Stack Developer",
        "roleDetail": "Independently completed backend and frontend development.", "concept": "",
        "tags": ["Python", "Streamlit", "Data Analysis"], "awards": []
      }
    },
    {
      "id": "p1",
      "category": "Photography",
      "cover": "https://cdn.example.com/p1/cover.jpg",
      "galleryCount": 18,
      "sort": 1,
      "zh": { "title": "示例项目标题", "subtitle": "示例副标题", "description": "…", "role": "摄影师", "tags": [], "awards": [] },
      "en": { "title": "Example Project Title", "subtitle": "Example Subtitle", "description": "…", "role": "Photographer", "tags": [], "awards": [] }
    }
  ]
}
```

---

### 5.3 `GET /api/projects/:id` — 作品详情

**用途**：详情弹窗打开时取完整图集（灯箱用）。若列表接口已用 `withGallery=true` 返回全部字段，本接口可省。

**Path**：`id`（作品 id）
**Query**：`lang`（默认 `all`）
**data**：单个 `Project`，结构同 5.2，且 `gallery` 必返回完整数组。
**错误**：id 不存在返回 `code=404` + 可读 `msg`。

---

### 5.4 `GET /api/project-categories` — 作品分类字典

**用途**：作品网格顶部筛选栏。前端按返回顺序渲染，首位"全部 / All"由前端自行插入。
**Query**：`lang`（默认 `all`）

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    { "value": "Photography",   "label": { "zh": "静态摄影", "en": "Photography" },   "sort": 1 },
    { "value": "Videography",   "label": { "zh": "动态影像", "en": "Videography" },   "sort": 2 },
    { "value": "Graphics & UI", "label": { "zh": "平面交互", "en": "Graphics & UI" }, "sort": 3 },
    { "value": "Development",   "label": { "zh": "应用开发", "en": "Development" },   "sort": 4 }
  ]
}
```

**业务规则**：请只返回**实际有作品的分类**（无作品的分类不要返回，否则前端筛选后是空列表；前端原逻辑对 Development 强制显示，但 Development 恒有数据）。

---

### 5.5 `GET /api/articles` — 文章列表

**用途**：文章页列表 + 分类侧栏筛选 + 日期排序。前端点击卡片是**打开外链**（当前全部指向微信公众号），站内无正文页。

**Query**

| 参数 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| `category` | string | 否 | 空（全部） | 见 3.2 |
| `sort` | string | 否 | `date_desc` | `date_desc` 最新优先 / `date_asc` 最早优先 |
| `page` | number | 否 | 1 | 从 1 开始 |
| `pageSize` | number | 否 | 20 | |
| `lang` | string | 否 | `all` | |

**data**

| 字段 | 类型 | 说明 |
|------|------|------|
| `list` | Article[] | 当前页数据 |
| `total` | number | 筛选后总条数（前端显示"N 篇文章"） |

`Article`：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | |
| `category` | string | 是 | 见 3.2 |
| `link` | string | 是 | 外链，前端 `window.open(link, "_blank")` |
| `coverImage` | string | 否 | 封面图，空时前端显示占位图标 |
| `date` | string | 是 | `YYYY-MM-DD`；建议必填，缺失时前端显示 `No Date` |
| `title` | 多语 | 是 | 标题 |

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "total": 12,
    "list": [
      {
        "id": "t1",
        "category": "瞎叨be叨",
        "link": "https://mp.weixin.qq.com/s/xxx",
        "coverImage": "https://cdn.example.com/a1.jpg",
        "date": "2024-01-01",
        "title": { "zh": "示例文章标题", "en": "Example Article Title" }
      }
    ]
  }
}
```

---

### 5.6 `GET /api/article-categories` — 文章分类字典

**Query**：`lang`（默认 `all`）
- `label`：筛选按钮 / 侧栏文案
- `shortLabel`：封面图左上角角标文案。**请返回独立字段**，不要依赖前端按 `|` 截断

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    { "value": "DiT",       "label": { "zh": "DiT | 数媒与课程",   "en": "DiT | DMT & Courses" },    "shortLabel": { "zh": "DiT",       "en": "DiT" },            "sort": 1 },
    { "value": "LUNA",      "label": { "zh": "LUNA | 影像相关",    "en": "LUNA | Visual Arts" },      "shortLabel": { "zh": "LUNA",      "en": "LUNA" },           "sort": 2 },
    { "value": "瞎叨be叨",   "label": { "zh": "瞎叨be叨 | 杂记",    "en": "Random Thoughts" },         "shortLabel": { "zh": "瞎叨be叨",   "en": "Random Thoughts" }, "sort": 3 },
    { "value": "After8",    "label": { "zh": "After8 | 聊艺术",    "en": "After8 | Art Talk" },       "shortLabel": { "zh": "After8",    "en": "After8" },         "sort": 4 },
    { "value": "山海疗养院", "label": { "zh": "山海疗养院 | 游记",  "en": "Serenity Vista | Travel" }, "shortLabel": { "zh": "山海疗养院", "en": "Serenity Vista" }, "sort": 5 }
  ]
}
```

---

### 5.7 `GET /api/music/playlist` — 音乐播放列表

**用途**：右下角全站播放器。`Song` 无多语字段，不接受 `lang`。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | |
| `title` | string | 是 | 曲名 |
| `artist` | string | 是 | 艺术家 |
| `cover` | string | 是 | 封面图 URL |
| `audio` | string | 是 | 音频 URL，**必须支持 Range** |

```json
{
  "code": 200,
  "msg": "success",
  "data": [
    {
      "id": "local-01",
      "title": "Pirene's Fountain",
      "artist": "Vallès",
      "cover": "https://cdn.example.com/music/covers/1.jpg",
      "audio": "https://cdn.example.com/music/audio/1.mp3"
    }
  ]
}
```

⚠️ 音频若走应用接口而非静态文件，必须正确响应 `Range` 请求头并返回 `206`，否则进度条拖动失效。

---

### 5.8 `GET /api/education` — 教育经历与荣誉（待确认）

> ⚠️ 前端 `src/data/education.ts` 已定义该数据，但**目前没有任何页面引用，路由中也没有 `/education`**。请先与前端确认本页是否纳入本期范围；若不纳入可不实现，前端会删除死数据。

**Query**：`lang`（默认 `all`）

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | 多语 | 页面标题 |
| `about` | 多语 | 简介 |
| `openToWork` | 多语 | 求职状态 |
| `viewHonorsLabel` | 多语 | "查看在校荣誉"按钮文案 |
| `honorsTitle` | 多语 | 荣誉区块标题 |
| `competitionsTitle` | 多语 | 竞赛奖项标题 |
| `scholarshipsLabel` | 多语 | 奖学金标签 |
| `titlesLabel` | 多语 | 荣誉称号标签 |
| `experiences` | Experience[] | 经历列表 |
| `honors` | HonorsData | 荣誉数据 |

- `Experience`：`{ id, year, title, institution, description, type }`，`title` / `institution` / `description` 为多语，`type` 取 `education` / `work`，`year` 为字符串（如 `20XX - Present`）。
- `HonorsData`：`{ scholarships: string[], titles: string[], competitions: CompetitionGroup[] }`
- `CompetitionGroup`：`{ level, awards }`，`level` 与 `awards` 元素均为多语

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "title": { "zh": "教育经历", "en": "Education" },
    "about": { "zh": "…", "en": "…" },
    "openToWork": { "zh": "边学边做+等待实习", "en": "Learning by Doing + Seeking Internship" },
    "viewHonorsLabel": { "zh": "查看在校荣誉", "en": "View Honors & Awards" },
    "honorsTitle": { "zh": "在校荣誉", "en": "Honors & Awards" },
    "competitionsTitle": { "zh": "竞赛奖项", "en": "Competition Awards" },
    "scholarshipsLabel": { "zh": "奖学金", "en": "Scholarships" },
    "titlesLabel": { "zh": "荣誉称号", "en": "Honorary Titles" },
    "experiences": [
      {
        "id": "1",
        "year": "20XX - Present",
        "title": { "zh": "学位 / 专业", "en": "Degree / Major" },
        "institution": { "zh": "你的大学名称", "en": "Your University" },
        "description": { "zh": "…", "en": "…" },
        "type": "education"
      }
    ],
    "honors": {
      "scholarships": [{ "zh": "示例奖学金", "en": "Example Scholarship" }],
      "titles": [{ "zh": "示例荣誉称号", "en": "Example Title" }],
      "competitions": [
        { "level": { "zh": "国家级", "en": "National" }, "awards": [{ "zh": "一等奖 | 示例竞赛名称", "en": "1st Prize | Example Competition" }] }
      ]
    }
  }
}
```

---

## 6. 前端调用映射（便于核对）

| 前端位置 | 调用接口 | 时机 |
|----------|----------|------|
| `src/layout/components/SidebarNav.vue` | `/api/site/config` → `nav` | 应用初始化 |
| `src/layout/index.vue`（页脚） | `/api/site/config` → `footer` | 应用初始化 |
| `src/views/dashboard/index.vue` | `/api/site/config` → `home`、`contact` | 进入主页 |
| `src/views/portfolio/index.vue` | `/api/site/config` → `pages.portfolio` | 进入作品页 |
| `src/views/contact/index.vue` | `/api/site/config` → `contact` | 进入联系页 |
| `src/components/PortfolioGrid.vue` | `/api/projects`、`/api/project-categories` | 主页 / 作品页挂载 |
| `src/views/portfolio/components/ProjectDetailModal.vue` | `/api/projects/:id`（可选，取图集） | 打开详情弹窗 |
| `src/views/articles/index.vue` | `/api/articles`、`/api/article-categories` | 进入文章页 |
| `src/components/MusicPlayer.vue` | `/api/music/playlist`、`/api/site/config` → `musicPlaylistLink` | 应用初始化 |

**注意**：分类切换、日期排序、Hero 标题筛选目前都是**前端本地行为**，不会重复请求。如果后端希望这些筛选走服务端，需要前端配合改造，请提前说明。

---

## 7. 联调前需确认清单

| # | 事项 | 影响 |
|---|------|------|
| 1 | `lang=all` 一次返回双语是否被接受 | 不接受则需前端增加"切语言重新拉取"逻辑 |
| 2 | 作品图集是否随列表返回（摄影单项目最多 50+ 张） | 决定 `/api/projects/:id` 是否需要实现 |
| 3 | 文章是否需要分页（当前前端一次性全量本地排序） | 决定是否启用 `page` / `pageSize` |
| 4 | `/api/education` 是否纳入本期 | 前端 `education.ts` 目前是无人引用的死数据 |
| 5 | 图片是否后端转存到自有对象存储 | 决定是否仍受微信 CDN 防盗链限制 |
| 6 | 音频是否走接口（需 Range）还是静态文件直链 | 影响播放器拖动进度 |
| 7 | 内容是否需要草稿 / 下架状态字段 | 前端是否需要过滤 |
| 8 | 作品 / 文章 id 类型（自增 / UUID / slug） | 前端用作 `v-for` key，需稳定唯一 |
| 9 | 分类枚举由后端下发还是前端写死 | 涉及新增分类时谁改代码 |
| 10 | 是否需要浏览量 / 点赞字段 | 前端暂无对应 UI，如需要需同步设计 |