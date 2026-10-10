// 每日一句：调用第三方公益 API（https://api.qqsuu.cn/api/dm-everyday）。
// 固定返回 { code, msg, data: { id, content, note, source, date } }。
// 注意：不挂 token 拦截器、不弹错误——这只是装饰性模块，失败就回退本地池。
import axios from 'axios'
import type { DailySentence } from '@/data/dailyEnglish'
import { SENTENCES } from '@/data/dailyEnglish'
import { el } from 'element-plus/es/locales.mjs'

// 独立实例：直接打第三方完整 URL，不受 VITE_BASE_API / 401 拦截影响
const client = axios.create({ timeout: 8000 })

/** 拉取今日一句；成功返回归一化句子，失败返回 null（由调用方兜底） */
export async function fetchDailySentence(): Promise<DailySentence | null> {
  try {
    const { data } = await client.get('https://api.qqsuu.cn/api/dm-everyday')
    if (data?.code === 200 && data?.data?.content) {
      return {
        en: data.data.content.trim(),
        zh: (data.data.note ?? '').trim(),
        from: data.data.source?.trim() || undefined
      }
    }else{
      return randomLocalSentence()
    } 
  } catch {
    return randomLocalSentence()
  }
}

/** 本地随机一句：用于「换一句」按钮 与 加载失败兜底 */
function randomLocalSentence(): DailySentence {
  return SENTENCES[Math.floor(Math.random() * SENTENCES.length)]
}
