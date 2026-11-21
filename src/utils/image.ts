// 图片上传相关的常量与纯函数：扩展名白名单、大小上限、上传前校验、地址换算。
// 背景：上传逻辑此前散落在 components/ImageUpload.vue、views/admin/content/project、
//   views/admin/content/article 三处，扩展名白名单与大小上限各写一份，改动容易漏改；
//   现统一到本文件，由 composables/useImageUpload.ts 统一调用。
// 被谁引用：src/composables/useImageUpload.ts（上传校验与请求）、
//   src/composables/useMarkdownUpload.ts（Markdown 正文图片转绝对地址）。
// 后端约定：上传限制需与后端 application.yml 的 file.upload 保持一致。

/** 允许上传的图片扩展名（与后端 file.upload 限制一致） */
export const ALLOWED_IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp']

/** 单张图片大小上限：5MB */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

/** el-upload 的 accept 属性值（由扩展名白名单派生） */
export const IMAGE_UPLOAD_ACCEPT = ALLOWED_IMAGE_EXT.map((e) => '.' + e).join(',')

/**
 * 上传前置校验：扩展名白名单 + 大小上限。
 * 不合规时直接拦截，不发起请求。
 * @param file 待校验的文件
 * @returns 校验通过返回 null；不通过返回错误文案
 */
export function validateImageFile(file: File): string | null {
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (!ALLOWED_IMAGE_EXT.includes(ext)) {
    return `不支持的图片类型：${ext || '未知'}（仅支持 ${ALLOWED_IMAGE_EXT.join('/')}）`
  }
  if (file.size > MAX_IMAGE_SIZE) {
    // 提示文案里的上限由常量派生，改常量时文案自动同步
    const limitMb = MAX_IMAGE_SIZE / 1024 / 1024
    return `图片超过 ${limitMb}MB（当前 ${(file.size / 1024 / 1024).toFixed(2)}MB）`
  }
  return null
}

/**
 * 相对地址 -> 绝对地址；已是绝对地址或格式异常时原样返回。
 * 使用场景：Markdown 正文里写入的图片地址需为绝对地址，避免换域名 / 子路径后丢图。
 */
export function toAbsoluteUrl(url: string): string {
  if (!url) return ''
  try {
    return new URL(url, window.location.origin).href
  } catch {
    return url
  }
}
