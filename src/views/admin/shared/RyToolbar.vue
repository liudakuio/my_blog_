<!--
  若依风格工具栏：左侧 新增/修改/删除 按钮组（按选中条数与权限禁用），
  右侧 自定义插槽 + 隐藏搜索 + 刷新 + 总数统计。
-->
<template>
  <div class="ry-toolbar">
    <div class="ry-toolbar-left">
      <el-button v-if="editable" type="primary" :icon="Plus" @click="emit('add')">新增</el-button>
      <el-button
        v-if="editable"
        type="success"
        plain
        :icon="Edit"
        :disabled="selectionCount !== 1"
        @click="emit('edit')"
      >
        修改
      </el-button>
      <el-button
        v-if="editable"
        type="danger"
        plain
        :icon="Delete"
        :disabled="selectionCount === 0"
        @click="emit('delete')"
      >
        删除
      </el-button>
    </div>

    <div class="ry-toolbar-right">
      <slot name="right" />
      <el-tooltip :content="searchVisible ? '隐藏搜索' : '显示搜索'" placement="top">
        <button class="ry-icon-btn" @click="emit('toggle-search')">
          <el-icon>
            <ArrowUp v-if="searchVisible" />
            <ArrowDown v-else />
          </el-icon>
        </button>
      </el-tooltip>
      <el-tooltip content="刷新" placement="top">
        <button class="ry-icon-btn" @click="emit('refresh')">
          <el-icon><Refresh /></el-icon>
        </button>
      </el-tooltip>
      <span class="ry-total">共 {{ total }} 条</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowDown, ArrowUp, Delete, Edit, Plus, Refresh } from '@element-plus/icons-vue'

withDefaults(
  defineProps<{
    /** 是否具备该资源写权限 */
    editable: boolean
    /** 当前选中条数 */
    selectionCount?: number
    /** 搜索区是否展开（决定隐藏搜索图标方向） */
    searchVisible?: boolean
    /** 数据总条数 */
    total?: number
  }>(),
  { selectionCount: 0, searchVisible: true, total: 0 }
)

const emit = defineEmits<{
  add: []
  edit: []
  delete: []
  refresh: []
  'toggle-search': []
}>()
</script>
