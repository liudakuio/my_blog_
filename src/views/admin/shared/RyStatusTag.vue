<!-- 若依风格状态标签：默认 0 正常（绿） / 1 停用（灰），可通过 options 覆盖 -->
<template>
  <el-tag :type="tagType" effect="light" size="small" disable-transitions>
    {{ text }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { STATUS_OPTIONS, type RyOption } from './types'

const props = withDefaults(
  defineProps<{
    value?: string | number | null
    options?: RyOption[]
    /** 正常值对应的标签类型 */
    normalType?: 'success' | 'primary' | 'info'
  }>(),
  { options: () => STATUS_OPTIONS, normalType: 'success' }
)

const current = computed(() =>
  props.options.find((o) => o.value === String(props.value ?? ''))
)
const text = computed(() => current.value?.label ?? String(props.value ?? '-'))
const tagType = computed(() =>
  props.options.indexOf(current.value as RyOption) === 0 ? props.normalType : 'info'
)
</script>
