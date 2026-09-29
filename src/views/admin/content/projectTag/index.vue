<!-- 作品标签（通用接口 /api/admin/project_tag，下划线字段） -->
<template>
  <div class="ry-page">
    <RySearchBar
      v-model="filters"
      :fields="searchFields"
      :visible="searchVisible"
      @search="query"
      @reset="resetQuery"
    />

    <div class="ry-card">
      <RyToolbar
        :editable="editable"
        :selection-count="selection.length"
        :search-visible="searchVisible"
        :total="total"
        @add="openAdd"
        @edit="openEdit(selection[0])"
        @delete="batchRemove"
        @refresh="query"
        @toggle-search="searchVisible = !searchVisible"
      />

      <div class="ry-grid">
        <el-table
          v-loading="loading"
          :data="list"
          border
          stripe
          row-key="id"
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="id" label="ID" width="70" align="center" />
          <el-table-column prop="project_id" label="作品ID" width="140" show-overflow-tooltip />
          <el-table-column prop="tag_name_zh" label="中文标签" min-width="160" show-overflow-tooltip />
          <el-table-column prop="tag_name_en" label="英文标签" min-width="160" show-overflow-tooltip />
          <el-table-column prop="sort" label="排序" width="80" align="center" />
          <el-table-column v-if="editable" label="操作" width="150" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" :icon="Edit" @click="openEdit(row)">修改</el-button>
              <el-button link type="primary" :icon="Delete" @click="remove(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <RyFormDialog v-model="dialogVisible" :title="dialogTitle" :saving="saving" @confirm="submit">
      <el-form ref="formRef" :model="formData" label-width="96px" :rules="rules">
        <el-form-item label="作品ID" prop="project_id">
          <el-input v-model="formData.project_id" placeholder="关联 project.id" />
        </el-form-item>
        <el-form-item label="中文标签" prop="tag_name_zh">
          <el-input v-model="formData.tag_name_zh" placeholder="如 交互设计" />
        </el-form-item>
        <el-form-item label="英文标签" prop="tag_name_en">
          <el-input v-model="formData.tag_name_en" placeholder="e.g. Interaction" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :controls="false" class="w-full" />
        </el-form-item>
      </el-form>
    </RyFormDialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Delete, Edit } from '@element-plus/icons-vue'
import RySearchBar from '../../shared/RySearchBar.vue'
import RyToolbar from '../../shared/RyToolbar.vue'
import RyFormDialog from '../../shared/RyFormDialog.vue'
import { useResourceCrud } from '../../shared/useResourceCrud'
import type { RySearchField } from '../../shared/types'

const searchVisible = ref(true)

const searchFields: RySearchField[] = [
  { key: 'project_id', label: '作品ID' },
  { key: 'tag_name_zh', label: '中文标签' }
]

const rules = {
  project_id: [{ required: true, message: '作品ID不能为空', trigger: 'blur' }]
}

const {
  list,
  loading,
  filters,
  selection,
  editable,
  total,
  dialogVisible,
  dialogTitle,
  saving,
  formRef,
  formData,
  query,
  resetQuery,
  openAdd,
  openEdit,
  submit,
  remove,
  batchRemove,
  onSelectionChange
} = useResourceCrud({
  resource: 'project_tag',
  title: '作品标签',
  defaultFilters: { project_id: '', tag_name_zh: '' },
  defaultForm: {
    project_id: '',
    tag_name_zh: '',
    tag_name_en: '',
    sort: 0
  }
})

onMounted(query)
</script>
