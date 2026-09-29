<!-- 荣誉多语（通用接口 /api/admin/honor_i18n，下划线字段） -->
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
          <el-table-column prop="honor_id" label="荣誉ID" width="120" show-overflow-tooltip />
          <el-table-column label="语言" width="90" align="center">
            <template #default="{ row }">
              <RyStatusTag :value="row.lang" :options="LANG_OPTIONS" />
            </template>
          </el-table-column>
          <el-table-column prop="content" label="内容" min-width="280" show-overflow-tooltip />
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
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="荣誉ID" prop="honor_id">
              <el-input v-model="formData.honor_id" placeholder="关联 honor.id" />
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
            <el-form-item label="内容" prop="content">
              <el-input v-model="formData.content" type="textarea" :rows="3" />
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
  { key: 'honor_id', label: '荣誉ID' },
  { key: 'lang', label: '语言', type: 'select', options: LANG_OPTIONS }
]

const rules = {
  honor_id: [{ required: true, message: '荣誉ID不能为空', trigger: 'blur' }]
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
  resource: 'honor_i18n',
  title: '荣誉多语',
  defaultFilters: { honor_id: '', lang: '' },
  defaultForm: {
    honor_id: '',
    lang: 'zh',
    content: ''
  }
})

onMounted(query)
</script>
