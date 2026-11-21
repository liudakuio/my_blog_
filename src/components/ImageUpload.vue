<!--
  通用图片上传控件：调用后端 POST /api/admin/upload/image。
  字段值统一为后端返回的相对 URL（如 /uploads/2026/09/26/uuid.jpg），不再手填。
  限制：允许的图片类型与体积上限见 @/utils/image.ts（需与后端 file.upload 配置保持一致）。
  权限：需 blog:upload:edit（该权限不在后端种子数据内，需在 sys_permission 手工插入，否则请求必然 403）。
  结构说明：上传的权限判断 / 类型与体积校验 / 请求与错误处理由 @/composables/useImageUpload
    统一提供，本组件只负责展示与事件派发。
  被谁引用：src/views/admin/crud/index.vue（通用 CRUD 兜底页的 image 字段）。
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

    <p v-if="!canUpload" class="iu-tip">无上传权限（缺少 {{ PERM_UPLOAD }}）</p>
  </div>
</template>

<script setup lang="ts">
import { Picture } from '@element-plus/icons-vue'
import { useImageUpload } from '@/composables/useImageUpload'
import { PERM_UPLOAD } from '@/config/permissions'

defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [url: string] }>()

// 上传逻辑（权限判断 / 类型与体积校验 / 请求与错误处理）由 composable 统一提供
const {
  canUpload,
  uploading,
  errorMsg,
  ACCEPT,
  beforeUpload,
  handleUpload
} = useImageUpload({
  // 上传成功后回写为后端返回的相对 URL
  onUploaded: (url) => emit('update:modelValue', url)
})

/** 移除已上传的图片 */
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
