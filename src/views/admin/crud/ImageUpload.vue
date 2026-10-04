<!--
  通用 CRUD 兜底页的图片上传控件：调用后端 POST /api/admin/upload/image。
  字段值统一为后端返回的相对 URL（如 /uploads/2026/09/26/uuid.jpg），不再手填。
  数据来源：调 adminUploadImage -> POST /api/admin/upload/image，返回可直接访问的相对 URL（如 /uploads/xxx.jpg）。
  限制：仅 jpg/jpeg/png/gif/webp，单文件不超过 5MB；需 blog:upload:edit 权限。
-->
<template>
  <div class="image-upload">
    <!-- 已上传：缩略图，点击可看大图 -->
    <div v-if="modelValue" class="iu-preview">
      <el-image
        :src="modelValue"
        fit="cover"
        class="iu-thumb"
        :preview-src-list="[modelValue]"
        preview-teleported
      />
    </div>
    <!-- 未上传：虚线占位 -->
    <div v-else class="iu-empty">
      <el-icon class="iu-empty-icon"><Picture /></el-icon>
      <span class="iu-empty-text">未上传</span>
    </div>

    <!-- 校验/失败提示 -->
    <p v-if="errorMsg" class="iu-error">{{ errorMsg }}</p>

    <div class="iu-actions">
      <el-upload
        :show-file-list="false"
        :accept="ACCEPT"
        :disabled="!canUpload"
        :before-upload="beforeUpload"
        :http-request="handleUpload"
      >
        <el-button type="primary" size="small" :loading="uploading" :disabled="!canUpload">
          {{ modelValue ? '重新上传' : '上传图片' }}
        </el-button>
      </el-upload>
      <el-button
        v-if="modelValue"
        size="small"
        type="danger"
        plain
        :disabled="!canUpload"
        @click="handleRemove"
      >
        移除
      </el-button>
    </div>

    <p v-if="!canUpload" class="iu-tip">无上传权限（缺少 blog:upload:edit）</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import type { UploadRequestOptions } from 'element-plus'
import { useUserStore } from '@/store/user'
import { adminUploadImage } from '@/api/admin'

defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [url: string] }>()

const userStore = useUserStore()

// 与后端 application.yml 的 file.upload 保持一致
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp']
const MAX_SIZE = 5 * 1024 * 1024
const ACCEPT = ALLOWED_EXT.map((e) => '.' + e).join(',')

const uploading = ref(false)
const errorMsg = ref('')

const canUpload = computed(() => userStore.hasPerm('blog:upload:edit'))

/** 前置校验：类型白名单 + 大小上限，不合规直接拦截不发请求 */
function beforeUpload(file: File) {
  errorMsg.value = ''
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (!ALLOWED_EXT.includes(ext)) {
    errorMsg.value = `不支持的图片类型：${ext || '未知'}（仅支持 ${ALLOWED_EXT.join('/')}）`
    return false
  }
  if (file.size > MAX_SIZE) {
    errorMsg.value = `图片超过 5MB（当前 ${(file.size / 1024 / 1024).toFixed(2)}MB）`
    return false
  }
  return true
}

/** 自定义上传：复用 service，自动带 JWT、统一错误提示与 401 处理 */
async function handleUpload(options: UploadRequestOptions) {
  uploading.value = true
  try {
    const res = await adminUploadImage(options.file)
    emit('update:modelValue', res.url)
    ElMessage.success('上传成功')
    options.onSuccess(res as any)
  } catch (e: any) {
    errorMsg.value = e?.message || '上传失败'
    options.onError(e)
  } finally {
    uploading.value = false
  }
}

function handleRemove() {
  errorMsg.value = ''
  emit('update:modelValue', '')
}
</script>

<style lang="less" scoped>
.image-upload {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.iu-preview {
  .iu-thumb {
    width: 120px;
    height: 90px;
    border: 1px solid #ececec;
    border-radius: 8px;
    background: #f3f4f6;
    transition: transform 0.25s;

    &:hover {
      transform: scale(1.04);
    }

    .dark & {
      border-color: #2a2a2a;
    }
  }
}

.iu-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 120px;
  height: 90px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  color: #9ca3af;

  .dark & {
    border-color: #2a2a2a;
    color: #6b7280;
  }
}

.iu-empty-icon {
  font-size: 22px;
}

.iu-empty-text {
  font-size: 12px;
}

.iu-error {
  margin: 0;
  color: #f56c6c;
  font-size: 12px;
}

.iu-tip {
  margin: 0;
  color: #e6a23c;
  font-size: 12px;
}

.iu-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
