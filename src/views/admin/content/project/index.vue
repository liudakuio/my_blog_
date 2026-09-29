<!-- 作品列表（专用接口 /api/admin/project，驼峰 VO） -->
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
          <el-table-column prop="id" label="作品ID" width="140" show-overflow-tooltip />
          <el-table-column prop="category" label="分类" width="120" show-overflow-tooltip />
          <el-table-column label="封面" width="90" align="center">
            <template #default="{ row }">
              <el-image
                v-if="row.cover"
                :src="row.cover"
                fit="cover"
                class="ry-thumb"
                :preview-src-list="[row.cover]"
                preview-teleported
              />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="icon" label="图标" width="110" show-overflow-tooltip />
          <el-table-column prop="bilibiliId" label="B站ID" width="120" show-overflow-tooltip />
          <el-table-column label="视频" min-width="160" show-overflow-tooltip>
            <template #default="{ row }">
              <a v-if="row.videoUrl" :href="row.videoUrl" target="_blank" class="ry-cell-link">
                {{ row.videoUrl }}
              </a>
              <span v-else>-</span>
            </template>
          </el-table-column>
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

    <RyFormDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :saving="saving"
      width="760px"
      @confirm="submit"
    >
      <el-form ref="formRef" :model="formData" label-width="96px" :rules="rules">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="作品ID" prop="id">
              <el-input v-model="formData.id" :disabled="isEdit" placeholder="唯一标识，如 p1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-input v-model="formData.category" placeholder="如 interaction" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="formData.sort" :controls="false" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" class="w-full">
                <el-option v-for="o in STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="图标" prop="icon">
              <el-input v-model="formData.icon" placeholder="图标类名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="B站ID" prop="bilibiliId">
              <el-input v-model="formData.bilibiliId" placeholder="BV 号或 av 号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="封面" prop="cover">
              <ImageUpload v-model="formData.cover" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="视频链接" prop="videoUrl">
              <el-input v-model="formData.videoUrl" placeholder="https://" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Figma" prop="figmaUrl">
              <el-input v-model="formData.figmaUrl" placeholder="https://" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="官网" prop="websiteUrl">
              <el-input v-model="formData.websiteUrl" placeholder="https://" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="GitHub" prop="githubUrl">
              <el-input v-model="formData.githubUrl" placeholder="https://" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="内部备注" />
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
import ImageUpload from '../../shared/ImageUpload.vue'
import { useResourceCrud } from '../../shared/useResourceCrud'
import { STATUS_OPTIONS, type RySearchField } from '../../shared/types'

const searchVisible = ref(true)

const searchFields: RySearchField[] = [
  { key: 'id', label: '作品ID' },
  { key: 'category', label: '分类' },
  { key: 'status', label: '状态', type: 'select', options: STATUS_OPTIONS }
]

const rules = {
  id: [{ required: true, message: '作品ID不能为空', trigger: 'blur' }],
  category: [{ required: true, message: '分类不能为空', trigger: 'blur' }]
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
  resource: 'project',
  title: '作品',
  defaultFilters: { id: '', category: '', status: '' },
  defaultForm: {
    id: '',
    category: '',
    cover: '',
    icon: '',
    videoUrl: '',
    bilibiliId: '',
    figmaUrl: '',
    websiteUrl: '',
    githubUrl: '',
    sort: 0,
    status: '0',
    remark: ''
  }
})

onMounted(query)
</script>
