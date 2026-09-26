// 双语字段取值工具：兼容 lang=all（{ zh, en }）与单语（string）两种返回形态
import type { Language } from '@/types'

type I18nValue = unknown

function readLang(value: Record<string, unknown>, lang: Language): string | undefined {
  const hit = value[lang]
  if (typeof hit === 'string') return hit
  const zh = value.zh
  if (typeof zh === 'string') return zh
  const en = value.en
  if (typeof en === 'string') return en
  return undefined
}

/** 取多语文本：双语模式取当前语言，缺省回退中文 */
export function pickText(value: I18nValue, lang: Language, fallback = ''): string {
  if (value == null) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    const text = readLang(value as Record<string, unknown>, lang)
    if (text !== undefined) return text
  }
  return fallback
}

/** 取多语字符串数组（tags / awards 等） */
export function pickList(value: I18nValue, lang: Language): string[] {
  if (Array.isArray(value)) return value as string[]
  if (value && typeof value === 'object') {
    const hit = (value as Record<string, unknown>)[lang]
    if (Array.isArray(hit)) return hit as string[]
    const zh = (value as Record<string, unknown>).zh
    if (Array.isArray(zh)) return zh as string[]
  }
  return []
}
