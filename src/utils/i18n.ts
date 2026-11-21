// 多语字段取值工具：兼容 lang=all（{ zh, en }）与单语（平铺字段）两种后端返回形态。
// 被谁引用：PortfolioGrid（分类标签）、store/site（导航文案）、store/portfolio 与 store/articles
//   （后端 VO 归一化）等需要解析多语字段处。
// 设计原因：后端 lang=all 与 lang=zh/en 两种模式下同一字段形态不同，业务层直接写
//   `typeof x === 'string' ? x : x.zh` 会散落各处；统一走本文件的取值函数可消除这类重复与空值风险。
// 两类取值的区别（务必分清）：
//   pickText —— 取「单个多语值」（如导航 label、分类 label），值形态为 string 或 { zh, en }；
//   pickField / pickFieldList —— 取「多语字段集合」中的某个字段（如 ProjectVo.zh.title），
//     集合形态为 { title: '...', tags: [...] }（lang=all），或直接平铺在对象上（lang=zh/en）。
import type { Language } from '@/types'
import type { I18nMap } from '@/api/types'

type I18nValue = unknown

/** 从双语对象中读取指定语言的文本，缺省回退 zh、再回退 en */
function readLang(value: Record<string, unknown>, lang: Language): string | undefined {
  const hit = value[lang]
  if (typeof hit === 'string') return hit
  const zh = value.zh
  if (typeof zh === 'string') return zh
  const en = value.en
  if (typeof en === 'string') return en
  return undefined
}

/**
 * 取多语文本：双语模式取当前语言，缺省回退中文。
 * @param value 单个多语值（string 或 { zh, en }）
 * @param lang 目标语言
 * @param fallback 取不到值时的兜底文案，默认空串
 */
export function pickText(value: I18nValue, lang: Language, fallback = ''): string {
  if (value == null) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    const text = readLang(value as Record<string, unknown>, lang)
    if (text !== undefined) return text
  }
  return fallback
}

/**
 * 从多语字段集合中取字符串字段（如 title / subtitle / description）。
 * 集合缺失或字段不存在时返回空串；字段为非字符串类型（后端保证不会发生）也按空串处理。
 * @param map 多语字段集合
 * @param key 字段名
 */
export function pickField(map: I18nMap, key: string): string {
  const value = map?.[key]
  return typeof value === 'string' ? value : ''
}

/**
 * 从多语字段集合中取字符串数组字段（如 tags / awards）。
 * 集合缺失、字段不存在或字段不是数组时返回空数组。
 * @param map 多语字段集合
 * @param key 字段名
 */
export function pickFieldList(map: I18nMap, key: string): string[] {
  const value = map?.[key]
  return Array.isArray(value) ? value : []
}
