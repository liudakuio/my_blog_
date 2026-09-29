// 后台共享类型与选项常量（若依风格页面复用；与 crud/schema.ts 保持一致）

/** 搜索区字段描述 */
export interface RySearchField {
  key: string
  label: string
  /** text 文本 / select 下拉 / date 日期 */
  type?: 'text' | 'select' | 'date'
  options?: RyOption[]
  width?: number
}

export interface RyOption {
  label: string
  value: string
}

/** 状态：0 正常 1 停用 */
export const STATUS_OPTIONS: RyOption[] = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' }
]

/** 语言：zh 中文 en 英文 */
export const LANG_OPTIONS: RyOption[] = [
  { label: '中文', value: 'zh' },
  { label: '英文', value: 'en' }
]

/** 是否：1 是 0 否 */
export const YESNO_OPTIONS: RyOption[] = [
  { label: '是', value: '1' },
  { label: '否', value: '0' }
]
