<!--
  若依风格表单弹窗：标题 + 内容插槽 + 底部 确定/取消；
  支持普通宽度与全屏两档（文章正文 Markdown 使用全屏）。
-->
<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    :width="width"
    :fullscreen="fullscreen"
    :close-on-click-modal="false"
    append-to-body
    destroy-on-close
    class="ry-dialog"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
  >
    <div class="ry-dialog-body">
      <slot />
    </div>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取 消</el-button>
      <el-button type="primary" :loading="saving" @click="emit('confirm')">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    width?: string
    fullscreen?: boolean
    saving?: boolean
  }>(),
  { width: '640px', fullscreen: false, saving: false }
)

const emit = defineEmits<{ 'update:modelValue': [boolean]; confirm: [] }>()
</script>
