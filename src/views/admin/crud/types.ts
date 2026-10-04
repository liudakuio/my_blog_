// 通用 CRUD 字段 / 资源配置类型
// 被谁引用：同目录 schema.ts（21 个资源的字段配置）与 crud/index.vue（按类型渲染表格列与表单控件）。
// 扩展新控件类型时：先在 FieldType 增加字面量，再到 crud/index.vue 的表单/表格渲染分支加对应处理。
export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'image'
  | 'link'
  | 'date'
  | 'datetime'
  | 'markdown'

export interface FieldOption {
  label: string
  value: string
}

export interface FieldSchema {
  key: string
  label: string
  type: FieldType
  /** 是否在列表展示 */
  table?: boolean
  /** 是否出现在表单 */
  form?: boolean
  /** 列宽 */
  width?: number
  /** 表单必填 */
  required?: boolean
  /** 下拉选项（select 类型） */
  options?: FieldOption[]
  /** 编辑弹窗字段分区（用于分组展示，如「基础信息」「正文内容」） */
  section?: string
}

export interface ResourceSchema {
  resource: string
  title: string
  fields: FieldSchema[]
}
