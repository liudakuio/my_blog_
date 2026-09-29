<!-- 竞赛明细（通用接口 /api/admin/competition_award，下划线字段） -->
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
          <el-table-column prop="comp_id" label="竞赛ID" width="120" show-overflow-tooltip />
          <el-table-column prop="content_zh" label="中文内容" min-width="240" show-overflow-tooltip />
          <el-table-column prop="content_en" label="英文内容" min-width="240" show-overflow-tooltip />
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

    <RyFormDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :saving="saving"
      width="680px"
      @confirm="submit"
    >
      <el-form ref="formRef" :model="formData" label-width="96px" :rules="rules">
        <el-form-item label="竞赛ID" prop="comp_id">
          <el-input v-model="formData.comp_id" placeholder="关联 competition.id" />
        </el-form-item>
        <el-form-item label="中文内容" prop="content_zh">
          <el-input v-model="formData.content_zh" placeholder="奖项描述（中）" />
        </el-form-item>
        <el-form-item label="英文内容" prop="content_en">
          <el-input v-model="formData.content_en" placeholder="Award description (EN)" />
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
  { key: 'comp_id', label: '竞赛ID' },
  { key: 'content_zh', label: '中文内容' }
]

const rules = {
  comp_id: [{ required: true, message: '竞赛ID不能为空', trigger: 'blur' }]
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
  resource: 'competition_award',
  title: '竞赛明细',
  defaultFilters: { comp_id: '', content_zh: '' },
  defaultForm: {
    comp_id: '',
    content_zh: '',
    content_en: '',
    sort: 0
  }
})

onMounted(query)
</script>
