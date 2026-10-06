// 8 个后台资源的字段配置：驱动通用 CRUD 的表格列与表单控件。
// 字段类型：text / textarea / number / select / image / link / markdown / datetime
// 变更记录：project_i18n / project_tag / project_award / project_gallery 以及
// 教育、竞赛相关资源已随后端下线移除。
// 被谁引用：crud/index.vue 通过下面的 SCHEMA_MAP[route.meta.resource] 取配置渲染页面。
// 注意：只有未登记进 config/adminPages.ts 的 CONTENT_PAGES 的资源才会走通用 CRUD 页，
// 已拆分独立页面的资源（如 project / article）不读这里的配置，改字段要改对应页面。
// 字段的 key 必须与后端列名一致（通用接口用下划线，专用接口用驼峰）。
import type { FieldSchema, ResourceSchema } from './types'

// 字段构造器（默认表格与表单均展示）
const f = (
  key: string,
  label: string,
  type: FieldSchema['type'] = 'text',
  extra: Partial<FieldSchema> = {}
): FieldSchema => ({ key, label, type, table: true, form: true, ...extra })

// 通用选项
const STATUS = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' }
]
const LANG = [
  { label: '中文', value: 'zh' },
  { label: '英文', value: 'en' }
]
// 自动主键（自增）资源：id 不在表单
const autoId = () => f('id', 'ID', 'text', { form: false, width: 70 })

// 字符串主键资源：id 需在表单填写
const strId = () => f('id', 'ID', 'text', { required: true, width: 140 })

export const RESOURCE_SCHEMAS: ResourceSchema[] = [
  // 1 站点文案
  {
    resource: 'site_text',
    title: '站点文案',
    fields: [
      autoId(),
      f('configKey', '配置键', 'text', { required: true }),
      f('valueZh', '中文值', 'textarea'),
      f('valueEn', '英文值', 'textarea'),
      f('remark', '备注', 'text', { table: false })
    ]
  },
  // 2 导航菜单
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
  // 3 Hero 大标题
  {
    resource: 'hero',
    title: '首页 Banner',
    fields: [
      autoId(),
      f('text_zh', '中文标题', 'text'),
      f('text_en', '英文标题', 'text'),
      f('annotation_zh', '中文注解', 'textarea'),
      f('annotation_en', '英文注解', 'textarea'),
      f('category', '分类', 'text', { width: 120 }),
      f('sort', '排序', 'number', { width: 90 })
    ]
  },
  // 4 作品分类
  {
    resource: 'project_category',
    title: '作品分类',
    fields: [
      autoId(),
      f('categoryValue', '分类值', 'text', { required: true }),
      f('labelZh', '中文名', 'text'),
      f('labelEn', '英文名', 'text'),
      f('sort', '排序', 'number', { width: 90 }),
      f('status', '状态', 'select', { options: STATUS, width: 90 })
    ]
  },
  // 5 作品
  {
    resource: 'project',
    title: '作品列表',
    fields: [
      strId(),
      f('category', '分类', 'text', { width: 120 }),
      f('cover', '封面', 'image', { table: true, form: true, width: 90 }),
      f('icon', '图标', 'text', { table: false }),
      f('videoUrl', '视频', 'link', { table: false }),
      f('bilibiliId', 'B站ID', 'text', { table: false }),
      f('figmaUrl', 'Figma', 'link', { table: false }),
      f('websiteUrl', '官网', 'link', { table: false }),
      f('githubUrl', 'GitHub', 'link', { table: false }),
      f('sort', '排序', 'number', { width: 90 }),
      f('status', '状态', 'select', { options: STATUS, width: 90 }),
      f('remark', '备注', 'textarea', { table: false })
    ]
  },
  // 6 文章分类
  {
    resource: 'article_category',
    title: '文章分类',
    fields: [
      autoId(),
      f('categoryValue', '分类值', 'text', { required: true }),
      f('labelZh', '中文名', 'text'),
      f('labelEn', '英文名', 'text'),
      f('shortLabelZh', '短标签(中)', 'text', { table: false }),
      f('shortLabelEn', '短标签(英)', 'text', { table: false }),
      f('sort', '排序', 'number', { width: 90 }),
      f('status', '状态', 'select', { options: STATUS, width: 90 })
    ]
  },
  // 7 文章
  {
    resource: 'article',
    title: '文章列表',
    fields: [
      { ...strId(), section: '基础信息' },
      f('category', '分类', 'text', { width: 120, section: '基础信息' }),
      f('link', '链接', 'link', { table: false, section: '基础信息' }),
      f('coverImage', '封面', 'image', { width: 90, section: '基础信息' }),
      f('publishDate', '发布日期', 'date', { width: 170, section: '基础信息' }),
      f('sort', '排序', 'number', { width: 90, section: '基础信息' }),
      f('status', '状态', 'select', { options: STATUS, width: 90, section: '基础信息' }),
      f('remark', '备注', 'textarea', { table: false, section: '基础信息' }),
      f('content', '正文', 'markdown', { table: false, form: true, section: '正文内容' })
    ]
  },
  // 8 文章多语
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
