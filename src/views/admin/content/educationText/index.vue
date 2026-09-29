<!-- 教育文案（专用接口 /api/admin/education_text，驼峰 VO） -->
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
          <el-table-column prop="configKey" label="配置键" width="200" show-overflow-tooltip />
          <el-table-column prop="valueZh" label="中文值" min-width="240" show-overflow-tooltip />
          <el-table-column prop="valueEn" label="英文值" min-width="240" show-overflow-tooltip />
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
        <el-form-item label="配置键" prop="configKey">
          <el-input v-model="formData.configKey" placeholder="如 edu.section.title" />
        </el-form-item>
        <el-form-item label="中文值" prop="valueZh">
          <el-input v-model="formData.valueZh" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="英文值" prop="valueEn">
          <el-input v-model="formData.valueEn" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" placeholder="用途说明" />
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

const searchFields: RySearchField[] = [{ key: 'configKey', label: '配置键' }]

const rules = {
  configKey: [{ required: true, message: '配置键不能为空', trigger: 'blur' }]
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
  resource: 'education_text',
  title: '教育文案',
  defaultFilters: { configKey: '' },
  defaultForm: {
    configKey: '',
    valueZh: '',
    valueEn: '',
    remark: ''
  }
})

onMounted(query)
</script>
