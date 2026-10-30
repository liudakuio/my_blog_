// 通用 CRUD 兜底页的字段配置：**只登记走通用接口的资源**（出入参字段为下划线列名）。
// 走专用接口的资源（project / project_category / article / article_category）
//   字段为驼峰 VO，由各自独立页面自持表单与表格，不在此配置。
// 字段类型：text / textarea / number / select / image / link / markdown / datetime
// 被谁引用：crud/index.vue 通过下面的 SCHEMA_MAP[route.meta.resource] 取配置渲染页面。
// 注意：已登记进 config/adminPages.ts 的 CONTENT_PAGES 的资源会走独立页面，不读这里的配置；
//   这里只服务于「后端新下发、前端尚未做独立页面」的资源兜底。
// 变更记录：site_text、hero 已随前端页面一同移除（后端无对应资源，调用只会得到 400「未知资源」）；
//   4 个走专用接口的资源的字段块也已移除，避免与各自独立页面重复维护。
import type { FieldSchema, ResourceSchema } from './types'

// 字段构造器（默认表格与表单均展示）
const f = (
  key: string,
  label: string,
  type: FieldSchema['type'] = 'text',
  extra: Partial<FieldSchema> = {}
): FieldSchema => ({ key, label, type, table: true, form: true, ...extra })

// 通用选项
const LANG = [
  { label: '中文', value: 'zh' },
  { label: '英文', value: 'en' }
]
// 自动主键（自增）资源：id 不在表单
const autoId = () => f('id', 'ID', 'text', { form: false, width: 70 })

export const RESOURCE_SCHEMAS: ResourceSchema[] = [
  // 1 导航菜单（走通用接口，字段为下划线列名）
  {
    resource: 'nav',
    title: '导航菜单',
    fields: [
      autoId(),
      f('nav_key', '导航键', 'text', { required: true }),
      f('label_zh', '中文名', 'text'),
      f('label_en', '英文名', 'text'),
      f('sort', '排序', 'number', { width: 90 })
    ]
  },
  // 2 文章多语（走通用接口，字段为下划线列名）
  {
    resource: 'article_i18n',
    title: '文章多语',
    fields: [
      autoId(),
      f('article_id', '文章ID', 'text', { required: true, width: 110 }),
      f('lang', '语言', 'select', { options: LANG, width: 90 }),
      f('title', '标题', 'text')
    ]
  }
]

// 资源名 -> 配置
export const SCHEMA_MAP: Record<string, ResourceSchema> = RESOURCE_SCHEMAS.reduce(
  (acc, s) => {
    acc[s.resource] = s
    return acc
  },
  {} as Record<string, ResourceSchema>
)
