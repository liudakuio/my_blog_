// Markdown 编辑器图片上传：供 MdEditor 的 onUploadImg 回调使用。
// 被谁引用：views/admin/content/article（文章正文）、views/admin/crud（通用 CRUD 的 markdown 字段）。
// 原理：md-editor-v3 选中本地图片后会回调 (files, callBack)，
//      必须先把文件传到后端拿到 URL，再调用 callBack(urls)，编辑器才会插入 ![](url)；
//      不绑定该回调时编辑器只会 emit 事件、无人处理，选图后不会有任何反应。
// 图片地址：后端返回相对路径（如 /uploads/2026/10/30/uuid.jpg），
//      这里统一转成绝对地址再写库，避免正文在不同域名/子路径下丢图；
//      代价是换域名时需要批量刷新存量正文里的图片地址。
// 依赖：POST /api/admin/upload/image（需 blog:upload:edit 权限，由后端 JwtInterceptor 校验）。
//      注意：该权限不在后端种子数据内（种子只按业务表生成权限），需在 sys_permission 手工插入。
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadImgEvent } from 'md-editor-v3'
import { adminUploadImage } from '@/api/admin'
import { useUserStore } from '@/store/user'

/** 相对地址 -> 绝对地址；已是绝对地址或格式异常时原样返回 */
function toAbsoluteUrl(url: string): string {
  if (!url) return ''
  try {
    return new URL(url, window.location.origin).href
  } catch {
    return url
  }
}

export function useMarkdownUpload() {
  const userStore = useUserStore()
  // 是否具备图片上传权限
  const canUpload = computed(() => userStore.hasPerm('blog:upload:edit'))

  // 逐个上传后把 URL 列表回传给编辑器
  const onUploadImg: UploadImgEvent = async (files, callBack) => {
    if (!canUpload.value) {
      ElMessage.warning('没有图片上传权限')
      return
    }
    try {
      const urls: string[] = []
      for (const file of files) {
        const res = await adminUploadImage(file)
        // 转绝对地址再插入正文
        urls.push(toAbsoluteUrl(res.url))
      }
      // 必须调用回调，编辑器才会把 ![](url) 插入正文
      callBack(urls)
    } catch (e: any) {
      ElMessage.error(e?.message || '图片上传失败')
    }
  }

  return { canUpload, onUploadImg }
}
