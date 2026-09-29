<!-- 教育/工作经历（通用接口 /api/admin/experience，下划线字段） -->
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
          <el-table-column prop="id" label="经历ID" width="140" show-overflow-tooltip />
          <el-table-column prop="year" label="年份" width="140" show-overflow-tooltip />
          <el-table-column prop="exp_type" label="类型" width="140" show-overflow-tooltip />
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
        <el-form-item label="经历ID" prop="id">
          <el-input v-model="formData.id" :disabled="isEdit" placeholder="唯一标识，如 e1" />
        </el-form-item>
        <el-form-item label="年份" prop="year">
          <el-input v-model="formData.year" placeholder="如 2021 - 2025" />
        </el-form-item>
        <el-form-item label="类型" prop="exp_type">
          <el-input v-model="formData.exp_type" placeholder="如 education / work" />
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
  { key: 'year', label: '年份' },
  { key: 'exp_type', label: '类型' }
]

const rules = {
  id: [{ required: true, message: '经历ID不能为空', trigger: 'blur' }]
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
  isEdit,
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
  resource: 'experience',
  title: '教育/工作经历',
  defaultFilters: { year: '', exp_type: '' },
  defaultForm: {
    id: '',
    year: '',
    exp_type: '',
    sort: 0
  }
})

onMounted(query)
</script>
