// 通用 CRUD 字段 / 资源配置类型
export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'image' | 'link' | 'datetime'

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
}

export interface ResourceSchema {
  resource: string
  title: string
  fields: FieldSchema[]
}
