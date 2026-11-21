// 每日一句：调用第三方公益 API（https://api.qqsuu.cn/api/dm-everyday）。
// 固定返回 { code, msg, data: { id, content, note, source, date } }。
// 独立 axios 实例：直接打第三方完整 URL，不受 VITE_BASE_API 与本项目 401 拦截影响。
// 注意：不挂 token 拦截器、不弹错误——这只是装饰性模块，失败即回退本地句池。
// 被谁引用：src/components/DailyEnglish.vue（前台每日一句卡片）。
// 变更记录：由 src/api/DailyEnglish.ts 重命名为本文件，与其余接口文件的 camelCase 命名统一；
//   同时移除了未使用的 element-plus locales 死导入。
import axios from 'axios'
import type { DailySentence } from '@/data/dailyEnglish'
import { SENTENCES } from '@/data/dailyEnglish'

// 独立实例：超时 8s，避免第三方接口卡住页面渲染
const client = axios.create({ timeout: 8000 })

/**
 * 拉取今日一句。
 * @returns 成功返回归一化后的句子；第三方返回异常或请求失败时返回本地随机句（由调用方直接渲染）
 */
export async function fetchDailySentence(): Promise<DailySentence | null> {
  try {
    const { data } = await client.get('https://api.qqsuu.cn/api/dm-everyday')
    if (data?.code === 200 && data?.data?.content) {
      return {
        en: data.data.content.trim(),
        zh: (data.data.note ?? '').trim(),
        from: data.data.source?.trim() || undefined
      }
    }
    return randomLocalSentence()
  } catch {
    return randomLocalSentence()
  }
}

/** 本地随机一句：仅在第三方接口返回异常或请求失败时兜底 */
function randomLocalSentence(): DailySentence {
  return SENTENCES[Math.floor(Math.random() * SENTENCES.length)]
}
