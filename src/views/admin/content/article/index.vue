<!-- 文章列表（专用接口 /api/admin/article，驼峰 VO；正文为 Markdown，弹窗全屏编辑） -->
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
          <el-table-column prop="id" label="文章ID" width="140" show-overflow-tooltip />
          <el-table-column prop="category" label="分类" width="120" show-overflow-tooltip />
          <el-table-column label="封面" width="90" align="center">
            <template #default="{ row }">
              <el-image
                v-if="row.coverImage"
                :src="row.coverImage"
                fit="cover"
                class="ry-thumb"
                :preview-src-list="[row.coverImage]"
                preview-teleported
              />
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="publishDate" label="发布日期" width="120" align="center" />
          <el-table-column label="外链" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <a v-if="row.link" :href="row.link" target="_blank" class="ry-cell-link">
                {{ row.link }}
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
      width="1080px"
      fullscreen
      @confirm="submit"
    >
      <el-form ref="formRef" :model="formData" label-width="96px" :rules="rules">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="文章ID" prop="id">
              <el-input v-model="formData.id" :disabled="isEdit" placeholder="唯一标识，如 a1" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="分类" prop="category">
              <el-input v-model="formData.category" placeholder="如 notes" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="发布日期" prop="publishDate">
              <el-date-picker
                v-model="formData.publishDate"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择日期"
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="formData.sort" :controls="false" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" class="w-full">
                <el-option v-for="o in STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="封面" prop="coverImage">
              <ImageUpload v-model="formData.coverImage" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="外链" prop="link">
              <el-input v-model="formData.link" placeholder="https://（可选）" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="内部备注" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">正文内容</el-divider>
        <MdEditor v-model="formData.content" :theme="mdTheme" :height="mdHeight" :preview="true" />
      </el-form>
    </RyFormDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Delete, Edit } from '@element-plus/icons-vue'
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import RySearchBar from '../../shared/RySearchBar.vue'
import RyToolbar from '../../shared/RyToolbar.vue'
import RyFormDialog from '../../shared/RyFormDialog.vue'
import RyStatusTag from '../../shared/RyStatusTag.vue'
import ImageUpload from '../../shared/ImageUpload.vue'
import { useResourceCrud } from '../../shared/useResourceCrud'
import { STATUS_OPTIONS, type RySearchField } from '../../shared/types'
import { useAppStore } from '@/store/app'

const appStore = useAppStore()
const searchVisible = ref(true)

// Markdown 编辑器主题跟随全局深色模式
const mdTheme = computed(() => (appStore.isDark ? 'dark' : 'light'))
const mdHeight = computed(() => Math.max(420, window.innerHeight - 420))

const searchFields: RySearchField[] = [
  { key: 'id', label: '文章ID' },
  { key: 'category', label: '分类' },
  { key: 'status', label: '状态', type: 'select', options: STATUS_OPTIONS }
]

const rules = {
  id: [{ required: true, message: '文章ID不能为空', trigger: 'blur' }],
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
  resource: 'article',
  title: '文章',
  defaultFilters: { id: '', category: '', status: '' },
  defaultForm: {
    id: '',
    category: '',
    link: '',
    coverImage: '',
    publishDate: '',
    sort: 0,
    status: '0',
    remark: '',
    content: ''
  }
})

onMounted(query)
</script>
