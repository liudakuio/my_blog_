// 21 个后台资源的字段配置：驱动通用 CRUD 的表格列与表单控件。
// 字段类型：text / textarea / number / select / image / link / datetime
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
const YESNO = [
  { label: '是', value: '1' },
  { label: '否', value: '0' }
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
  // 4 社交平台
  {
    resource: 'social',
    title: '社交平台',
    fields: [
      autoId(),
      f('social_key', '平台键', 'text', { required: true }),
      f('name_zh', '中文名', 'text'),
      f('name_en', '英文名', 'text'),
      f('account', '账号', 'text'),
      f('url', '链接', 'link', { table: false }),
      f('icon', '图标', 'text', { width: 110 }),
      f('clickable', '可点击', 'select', { options: YESNO, width: 100 }),
      f('tooltip_text', '提示文案', 'text', { table: false }),
      f('tooltip_domain', '提示域名', 'text', { table: false }),
      f('sort', '排序', 'number', { width: 90 })
    ]
  },
  // 5 作品分类
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
  // 6 作品
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
  // 7 作品多语
  {
    resource: 'project_i18n',
    title: '作品多语',
    fields: [
      autoId(),
      f('project_id', '作品ID', 'text', { required: true, width: 110 }),
      f('lang', '语言', 'select', { options: LANG, width: 90 }),
      f('title', '标题', 'text'),
      f('subtitle', '副标题', 'text', { table: false }),
      f('description', '描述', 'textarea'),
      f('role', '角色', 'text', { table: false }),
      f('role_detail', '角色详情', 'textarea', { table: false }),
      f('concept', '理念', 'textarea', { table: false })
    ]
  },
  // 8 作品标签
  {
    resource: 'project_tag',
    title: '作品标签',
    fields: [
      autoId(),
      f('project_id', '作品ID', 'text', { required: true, width: 110 }),
      f('tag_name_zh', '中文标签', 'text'),
      f('tag_name_en', '英文标签', 'text'),
      f('sort', '排序', 'number', { width: 90 })
    ]
  },
  // 9 作品获奖
  {
    resource: 'project_award',
    title: '作品获奖',
    fields: [
      autoId(),
      f('project_id', '作品ID', 'text', { required: true, width: 110 }),
      f('award_name_zh', '中文奖项', 'text'),
      f('award_name_en', '英文奖项', 'text'),
      f('sort', '排序', 'number', { width: 90 })
    ]
  },
  // 10 作品图集
  {
    resource: 'project_gallery',
    title: '作品图集',
    fields: [
      autoId(),
      f('project_id', '作品ID', 'text', { required: true, width: 110 }),
      f('image_url', '图片', 'image', { width: 90 }),
      f('sort', '排序', 'number', { width: 90 })
    ]
  },
  // 11 文章分类
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
  // 12 文章
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
  // 13 文章多语
  {
    resource: 'article_i18n',
    title: '文章多语',
    fields: [
      autoId(),
      f('article_id', '文章ID', 'text', { required: true, width: 110 }),
      f('lang', '语言', 'select', { options: LANG, width: 90 }),
      f('title', '标题', 'text')
    ]
  },
  // 14 音乐
  {
    resource: 'music',
    title: '音乐列表',
    fields: [
      strId(),
      f('title', '曲名', 'text'),
      f('artist', '艺术家', 'text'),
      f('cover', '封面', 'image', { width: 90 }),
      f('audio', '音频', 'link', { table: false }),
      f('sort', '排序', 'number', { width: 90 }),
      f('status', '状态', 'select', { options: STATUS, width: 90 })
    ]
  },
  // 15 教育文案
  {
    resource: 'education_text',
    title: '教育文案',
    fields: [
      autoId(),
      f('configKey', '配置键', 'text', { required: true }),
      f('valueZh', '中文值', 'textarea'),
      f('valueEn', '英文值', 'textarea'),
      f('remark', '备注', 'text', { table: false })
    ]
  },
  // 16 教育/工作经历
  {
    resource: 'experience',
    title: '教育/工作经历',
    fields: [
      strId(),
      f('year', '年份', 'text', { width: 110 }),
      f('exp_type', '类型', 'text', { width: 110 }),
      f('sort', '排序', 'number', { width: 90 })
    ]
  },
  // 17 经历多语
  {
    resource: 'experience_i18n',
    title: '经历多语',
    fields: [
      autoId(),
      f('exp_id', '经历ID', 'text', { required: true, width: 110 }),
      f('lang', '语言', 'select', { options: LANG, width: 90 }),
      f('title', '标题', 'text'),
      f('institution', '机构', 'text'),
      f('description', '描述', 'textarea')
    ]
  },
  // 18 荣誉条目
  {
    resource: 'honor',
    title: '荣誉管理',
    fields: [
      autoId(),
      f('honor_type', '类型', 'text', { width: 130 }),
      f('sort', '排序', 'number', { width: 90 })
    ]
  },
  // 19 荣誉多语
  {
    resource: 'honor_i18n',
    title: '荣誉多语',
    fields: [
      autoId(),
      f('honor_id', '荣誉ID', 'text', { required: true, width: 110 }),
      f('lang', '语言', 'select', { options: LANG, width: 90 }),
      f('content', '内容', 'textarea')
    ]
  },
  // 20 竞赛分组
  {
    resource: 'competition',
    title: '竞赛分组',
    fields: [
      autoId(),
      f('level_zh', '中文级别', 'text'),
      f('level_en', '英文级别', 'text'),
      f('sort', '排序', 'number', { width: 90 })
    ]
  },
  // 21 竞赛明细
  {
    resource: 'competition_award',
    title: '竞赛明细',
    fields: [
      autoId(),
      f('comp_id', '竞赛ID', 'text', { required: true, width: 110 }),
      f('content_zh', '中文内容', 'text'),
      f('content_en', '英文内容', 'text'),
      f('sort', '排序', 'number', { width: 90 })
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
