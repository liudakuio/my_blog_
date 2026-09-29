<!-- 作品分类（专用接口 /api/admin/project_category，驼峰 VO） -->
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
          <el-table-column prop="categoryValue" label="分类值" width="160" show-overflow-tooltip />
          <el-table-column prop="labelZh" label="中文名" min-width="140" show-overflow-tooltip />
          <el-table-column prop="labelEn" label="英文名" min-width="140" show-overflow-tooltip />
          <el-table-column prop="sort" label="排序" width="80" align="center" />
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <RyStatusTag :value="row.status" />
            </template>
          </el-table-column>
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
        <el-form-item label="分类值" prop="categoryValue">
          <el-input v-model="formData.categoryValue" placeholder="如 interaction" />
        </el-form-item>
        <el-form-item label="中文名" prop="labelZh">
          <el-input v-model="formData.labelZh" placeholder="中文展示名" />
        </el-form-item>
        <el-form-item label="英文名" prop="labelEn">
          <el-input v-model="formData.labelEn" placeholder="English label" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :controls="false" class="w-full" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" class="w-full">
            <el-option v-for="o in STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
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
import RyStatusTag from '../../shared/RyStatusTag.vue'
import { useResourceCrud } from '../../shared/useResourceCrud'
import { STATUS_OPTIONS, type RySearchField } from '../../shared/types'

const searchVisible = ref(true)

const searchFields: RySearchField[] = [
  { key: 'categoryValue', label: '分类值' },
  { key: 'labelZh', label: '中文名' },
  { key: 'status', label: '状态', type: 'select', options: STATUS_OPTIONS }
]

const rules = {
  categoryValue: [{ required: true, message: '分类值不能为空', trigger: 'blur' }]
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
  resource: 'project_category',
  title: '作品分类',
  defaultFilters: { categoryValue: '', labelZh: '', status: '' },
  defaultForm: {
    categoryValue: '',
    labelZh: '',
    labelEn: '',
    sort: 0,
    status: '0'
  }
})

onMounted(query)
</script>
