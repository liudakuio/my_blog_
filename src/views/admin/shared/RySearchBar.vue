<!--
  若依风格搜索区：inline 表单 + 搜索/重置，字段超过 3 个时支持展开/收起。
  v-model 绑定页面里的筛选对象（直接读写其属性）。
-->
<template>
  <div v-show="visible" class="ry-card ry-search">
    <el-form :model="modelValue" inline @submit.prevent>
      <el-form-item v-for="fld in visibleFields" :key="fld.key" :label="fld.label">
        <el-select
          v-if="fld.type === 'select'"
          v-model="modelValue[fld.key]"
          :placeholder="fld.label"
          clearable
          :style="{ width: (fld.width || 180) + 'px' }"
        >
          <el-option v-for="o in fld.options || []" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>

        <el-date-picker
          v-else-if="fld.type === 'date'"
          v-model="modelValue[fld.key]"
          type="date"
          value-format="YYYY-MM-DD"
          :placeholder="fld.label"
          clearable
          :style="{ width: (fld.width || 180) + 'px' }"
        />

        <el-input
          v-else
          v-model="modelValue[fld.key]"
          :placeholder="fld.label"
          clearable
          :style="{ width: (fld.width || 180) + 'px' }"
          @keyup.enter="emit('search')"
        />
      </el-form-item>

      <el-form-item class="ry-search-btns">
        <el-button type="primary" :icon="Search" @click="emit('search')">搜索</el-button>
        <el-button :icon="RefreshRight" @click="emit('reset')">重置</el-button>
        <el-button
          v-if="fields.length > visibleCount"
          link
          type="primary"
          @click="advanced = !advanced"
        >
          {{ advanced ? '收起' : '展开' }}
          <el-icon class="ry-arrow">
            <ArrowUp v-if="advanced" />
            <ArrowDown v-else />
          </el-icon>
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowDown, ArrowUp, RefreshRight, Search } from '@element-plus/icons-vue'
import type { RySearchField } from './types'

const props = withDefaults(
  defineProps<{
    /** 筛选条件对象（页面传入 reactive 对象） */
    modelValue: Record<string, any>
    fields: RySearchField[]
    /** 是否显示（隐藏搜索） */
    visible?: boolean
    /** 折叠时展示的字段数量 */
    visibleCount?: number
  }>(),
  { visible: true, visibleCount: 3 }
)

const emit = defineEmits<{ search: []; reset: [] }>()

// 是否展开更多搜索项
const advanced = ref(false)
const visibleFields = computed(() =>
  advanced.value ? props.fields : props.fields.slice(0, props.visibleCount)
)
</script>
