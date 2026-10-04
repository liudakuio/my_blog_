// 双语字段取值工具：兼容 lang=all（{ zh, en }）与单语（string）两种返回形态
// 被谁引用：PortfolioGrid（分类标签）、store/site（导航文案）、views/articles 等需要解析多语字段处。
// 设计原因：后端 lang=all 与 lang=zh/en 两种模式下同一字段形态不同，
// 业务层统一走 pickText 可避免到处写 `typeof x === 'string' ? x : x.zh`。
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

