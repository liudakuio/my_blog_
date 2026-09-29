<!-- 作品多语（通用接口 /api/admin/project_i18n，下划线字段） -->
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
          <el-table-column label="语言" width="90" align="center">
            <template #default="{ row }">
              <RyStatusTag :value="row.lang" :options="LANG_OPTIONS" />
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
          <el-table-column prop="subtitle" label="副标题" min-width="160" show-overflow-tooltip />
          <el-table-column prop="role" label="角色" min-width="140" show-overflow-tooltip />
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
      width="720px"
      @confirm="submit"
    >
      <el-form ref="formRef" :model="formData" label-width="96px" :rules="rules">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="作品ID" prop="project_id">
              <el-input v-model="formData.project_id" placeholder="关联 project.id" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="语言" prop="lang">
              <el-select v-model="formData.lang" class="w-full">
                <el-option v-for="o in LANG_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="标题" prop="title">
              <el-input v-model="formData.title" placeholder="作品标题" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="副标题" prop="subtitle">
              <el-input v-model="formData.subtitle" placeholder="一句话简介" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input v-model="formData.description" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="角色" prop="role">
              <el-input v-model="formData.role" placeholder="如 交互设计 / 前端开发" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="角色详情" prop="role_detail">
              <el-input v-model="formData.role_detail" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="理念" prop="concept">
              <el-input v-model="formData.concept" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
        </el-row>
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
import { LANG_OPTIONS, type RySearchField } from '../../shared/types'

const searchVisible = ref(true)

const searchFields: RySearchField[] = [
  { key: 'project_id', label: '作品ID' },
  { key: 'lang', label: '语言', type: 'select', options: LANG_OPTIONS },
  { key: 'title', label: '标题' }
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
  resource: 'project_i18n',
  title: '作品多语',
  defaultFilters: { project_id: '', lang: '', title: '' },
  defaultForm: {
    project_id: '',
    lang: 'zh',
    title: '',
    subtitle: '',
    description: '',
    role: '',
    role_detail: '',
    concept: ''
  }
})

onMounted(query)
</script>
