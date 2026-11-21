// 剪贴板写入工具：统一「Clipboard API 优先、失败回退 textarea + execCommand」的复制逻辑。
// 背景：此前 src/views/contact/index.vue 与 src/components/DailyEnglish.vue 各写了一份回退实现，
//   两份代码几乎相同却略有差异，改动时容易漏改；现收敛到本文件。
// 行为基准：以联系页的版本为准（额外检查 window.isSecureContext，并返回复制是否成功）。
// 被谁引用：src/views/contact/index.vue（微信号 / 邮箱复制）、
//   src/components/DailyEnglish.vue（复制每日一句）。

/**
 * 将文本写入剪贴板。
 * @param text 待复制的文本
 * @returns 是否复制成功；回退方案依赖 execCommand 的返回值，可能返回 false
 */
export async function writeClipboard(text: string): Promise<boolean> {
  try {
    // Clipboard API 仅在安全上下文（HTTPS / localhost）可用
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* 继续走回落方案 */
  }
  try {
    // 回落：借助隐藏 textarea 选中内容，再调用已废弃但兼容性最好的 execCommand
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
