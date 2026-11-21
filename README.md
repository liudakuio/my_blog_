# my_blog
我的个人博客

## 技术栈

Vue 3.4（`<script setup>` + Composition API）、TypeScript 5.4、Vite 5、Pinia 2、vue-router 4、axios、Element Plus、Tailwind 3、dayjs、md-editor-v3。

## 分层架构

依赖方向自上而下单向流动，不允许反向依赖：

```
views（模板 + 页面特有逻辑）
  ├─ composables（useAdminCrud / useImageUpload / useMarkdownUpload：跨页面复用的编排逻辑）
  ├─ utils（clipboard / date / image / list / i18n / request：纯函数与基础设施）
  ├─ config（permissions / routes / adminPages / menu：常量与映射表）
  └─ api（唯一的后端出入口：types / admin / adminResource / system / auth ...）
        └─ utils/request（axios 实例 + 拦截器）
```

| 目录 | 职责 | 约定 |
| --- | --- | --- |
| `src/api` | 后端接口封装与 VO 类型 | 页面不直接拼 URL；后台资源路径统一由 `api/paths.ts` 的 `adminPath()` 拼接 |
| `src/store` | 全局状态 | 不写死请求 URL，只做「接口数据 → 前端结构」的归一化；store 之间零交叉依赖 |
| `src/composables` | 可复用的编排逻辑 | 只做逻辑编排，不直接拼 URL、不引入 watch 副作用 |
| `src/utils` | 纯函数与基础设施 | 无业务语义，可被任意层引用 |
| `src/config` | 常量与映射表 | 权限串、后台路由等「一次性定义」集中在此 |
| `src/data` | 静态数据与文案类型 | 只放不依赖接口的内容 |
| `src/components` | 无业务或弱业务的通用组件 | 跨页面复用的组件放这里 |

## 二次开发约定

### 新增一个后台 CRUD 页面

1. 在 `src/api/admin.ts`（通用 CRUD，字段下划线）或 `src/api/adminResource.ts`（专用接口，字段驼峰）确认接口可用；
2. 新建 `src/views/admin/xxx/index.vue`，用 `useAdminCrud` 声明差异点：

```ts
const {
  list, loading, total, selection, showSearch, queryParams,
  dialogVisible, dialogTitle, saving, formRef, form,
  getList, handleQuery, resetQuery, handleSelectionChange,
  handleAdd, handleUpdate, cancel, submitForm, handleDelete
} = useAdminCrud<XxxVo, XxxForm, XxxQuery>({
  idField: 'id',                       // 主键字段名
  fetchList: (params) => adminList('xxx', params),
  fetchDetail: (id) => adminGet('xxx', id),
  createFn: (payload) => adminCreate('xxx', payload),
  updateFn: (id, payload) => adminUpdate('xxx', id, payload),
  deleteFn: (id) => adminDelete('xxx', id),
  defaultQuery: { name: '' },
  createForm: () => ({ name: '' }),
  titles: { add: '添加', edit: '修改' },
  logLabel: 'XXX'                      // 决定默认日志文案，如「[admin] XXX列表加载失败」
})
```

3. 表格列、搜索项、校验规则（`rules`）留在页面内；
4. 在 `src/config/adminPages.ts` 登记 resource 名，并在后端菜单下发该资源。

> `src/views/admin/crud/index.vue` 是 schema 驱动的通用兜底页，字段随资源动态变化，
> 不适用上面的固定字段模式，两者互不替代。

### 修改后台资源路径

后台资源路径只允许在 `src/api/paths.ts` 中改动，不要在业务文件里写 `/api/admin/` 字面量。

### 修改权限串

权限串集中在 `src/config/permissions.ts`；注意 `blog:upload:edit` 不在后端种子数据内，
需在 `sys_permission` 表手工插入，否则图片上传必然 403。

### 注释规范

采用三级中文注释：①文件头写职责、被谁引用、路径 / 命名约定、维护注意；②导出项写 JSDoc；③复杂逻辑处写行内注释（解释「为什么」而非「做了什么」）。注释不得与实现脱节，行为调整时须同步更新。

## 常用命令

```bash
npm run dev      # 本地开发（默认 9996 端口，/api 与 /uploads 代理到 9997）
npm run build    # 类型检查（vue-tsc）+ 生产构建，提交前必须零错误通过
npm run preview  # 预览构建产物
```

后端服务需在 `http://localhost:9997` 运行；生产环境由 Nginx 反代 `/api` 到后端。
