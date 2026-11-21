// 后台图片上传逻辑：权限判断 + 扩展名 / 体积校验 + 上传请求 + 错误提示。
// 背景：上传逻辑此前在 views/admin/crud/ImageUpload.vue、views/admin/content/project、
//   views/admin/content/article 三处各写一份，扩展名白名单与体积上限各写一份，
//   改动时容易漏改；现统一到本 composable，三处的模板与样式保持原样。
// 被谁引用：src/components/ImageUpload.vue、
//   src/views/admin/content/project/index.vue、src/views/admin/content/article/index.vue。
// 依赖：POST /api/admin/upload/image（需 blog:upload:edit 权限，由后端 JwtInterceptor 校验）。
//   注意：该权限不在后端种子数据内（种子只按业务表生成权限），需在 sys_permission 手工插入。
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadRequestOptions } from 'element-plus'
import { adminUploadImage } from '@/api/admin'
import { useUserStore } from '@/store/user'
import { IMAGE_UPLOAD_ACCEPT, validateImageFile } from '@/utils/image'
import { PERM_UPLOAD } from '@/config/permissions'

/** 上传行为配置 */
export interface ImageUploadOptions {
  /** 上传成功后的回调：参数为后端返回的相对 URL（如 /uploads/2026/09/26/uuid.jpg） */
  onUploaded?: (url: string) => void
}

/**
 * 后台图片上传逻辑。
 * @param options 行为配置
 */
export function useImageUpload(options: ImageUploadOptions = {}) {
  const userStore = useUserStore()

  /** 是否具备图片上传权限 */
  const canUpload = computed(() => userStore.hasPerm(PERM_UPLOAD))
  /** 上传中（用于按钮 loading） */
  const uploading = ref(false)
  /** 校验 / 上传失败的提示文案 */
  const errorMsg = ref('')

  /**
   * 前置校验：类型白名单 + 体积上限，不合规直接拦截、不发请求。
   * @param file 待校验的文件
   * @returns 是否允许继续上传
   */
  function beforeUpload(file: File): boolean {
    errorMsg.value = ''
    const error = validateImageFile(file)
    if (error) {
      errorMsg.value = error
      return false
    }
    return true
  }

  /**
   * 自定义上传：复用 service，自动带 JWT、统一错误提示与 401 处理。
   * @param uploadOptions el-upload 传入的上传参数
   */
  async function handleUpload(uploadOptions: UploadRequestOptions) {
    uploading.value = true
    try {
      const res = await adminUploadImage(uploadOptions.file)
      // 上传成功后回写业务字段（各页面自行决定写到哪个字段）
      options.onUploaded?.(res.url)
      ElMessage.success('上传成功')
      uploadOptions.onSuccess(res)
    } catch (e) {
      errorMsg.value = (e as { message?: string })?.message || '上传失败'
      // el-upload 的 onError 参数类型未对外导出，此处按其签名取类型
      uploadOptions.onError(e as Parameters<UploadRequestOptions['onError']>[0])
    } finally {
      uploading.value = false
    }
  }

  return {
    canUpload,
    uploading,
    errorMsg,
    /** el-upload 的 accept 属性值（由扩展名白名单派生） */
    ACCEPT: IMAGE_UPLOAD_ACCEPT,
    beforeUpload,
    handleUpload
  }
}
