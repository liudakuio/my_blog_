<!--
  文章分类（/api/admin/article_category，专用接口驼峰 VO）
  若依原版写法：页面自持全部逻辑与 UI，不依赖任何共享组件 / composable。
-->
<template>
  <div class="app-container">
    <!-- 搜索区 -->
    <div v-show="showSearch" class="search-card">
      <el-form :model="queryParams" inline @submit.prevent>
        <el-form-item label="分类值">
          <el-input
            v-model="queryParams.categoryValue"
            placeholder="分类值"
            clearable style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="中文名">
          <el-input
            v-model="queryParams.labelZh"
            placeholder="中文名"
            clearable style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 180px">
            <el-option v-for="o in STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">搜索</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button v-if="editable" type="primary" :icon="Plus" @click="handleAdd">新增</el-button>
          <el-button
            v-if="editable"
            type="success"
            plain
            :icon="Edit"
            :disabled="selection.length !== 1"
            @click="handleUpdate()"
          >
            修改
          </el-button>
          <el-button
            v-if="editable"
            type="danger"
            plain
            :icon="Delete"
            :disabled="selection.length === 0"
            @click="handleDelete()"
          >
            删除
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-tooltip :content="showSearch ? '隐藏搜索' : '显示搜索'" placement="top">
            <button class="icon-btn" @click="showSearch = !showSearch">
              <el-icon>
                <ArrowUp v-if="showSearch" />
                <ArrowDown v-else />
              </el-icon>
            </button>
          </el-tooltip>
          <el-tooltip content="刷新" placement="top">
            <button class="icon-btn" @click="getList">
              <el-icon><Refresh /></el-icon>
            </button>
          </el-tooltip>
          <span class="total-text">共 {{ total }} 条</span>
        </div>
      </div>

      <el-table
        v-loading="loading"
        :data="list"
        border
        stripe
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="id" label="ID" width="70" align="center" show-overflow-tooltip />
        <el-table-column prop="categoryValue" label="分类值" width="150" show-overflow-tooltip />
        <el-table-column prop="labelZh" label="中文名" width="140" show-overflow-tooltip />
        <el-table-column prop="labelEn" label="英文名" width="140" show-overflow-tooltip />
        <el-table-column prop="shortLabelZh" label="短标签(中)" width="130" show-overflow-tooltip />
        <el-table-column prop="shortLabelEn" label="短标签(英)" width="130" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="80" align="center" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === '0' ? 'success' : 'info'" effect="light" size="small">
              {{ row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="editable" label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :icon="Edit" @click="handleUpdate(row)">修改</el-button>
            <el-button link type="primary" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加 / 修改弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="680px"
      append-to-body
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" label-width="110px" :rules="rules">
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="分类值" prop="categoryValue">
              <el-input v-model="form.categoryValue" placeholder="分类值" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="中文名" prop="labelZh">
              <el-input v-model="form.labelZh" placeholder="中文名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="英文名" prop="labelEn">
              <el-input v-model="form.labelEn" placeholder="英文名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="短标签(中)" prop="shortLabelZh">
              <el-input v-model="form.shortLabelZh" placeholder="短标签(中)" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="短标签(英)" prop="shortLabelEn">
              <el-input v-model="form.shortLabelEn" placeholder="短标签(英)" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :controls="false" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" class="w-full">
                <el-option v-for="o in STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="cancel">取 消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowDown,
  ArrowUp,
  Delete,
  Edit,
  Plus,
  Refresh,
  Search
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import {
  adminResourceList,
  adminResourceGet,
  adminResourceCreate,
  adminResourceUpdate,
  adminResourceDelete
} from '@/api/adminResource'

const userStore = useUserStore()
const editable = computed(() => userStore.canEdit('article_category'))

const STATUS_OPTIONS = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' }
]
// ---------------- 列表 ----------------
const list = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const selection = ref<any[]>([])
const showSearch = ref(true)
const advanced = ref(false)

const queryParams = reactive<Record<string, any>>({
  categoryValue: '',
  labelZh: '',
  status: ''
})

async function getList() {
  loading.value = true
  try {
    const params: Record<string, any> = {}
    Object.keys(queryParams).forEach((k) => {
      const v = queryParams[k]
      if (v !== '' && v !== undefined && v !== null) params[k] = v
    })
    const data = await adminResourceList('article_category', params)
    list.value = Array.isArray(data) ? data : []
    total.value = list.value.length
  } catch (e) {
    console.error('[admin] 文章分类列表加载失败', e)
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  getList()
}

function resetQuery() {
  Object.keys(queryParams).forEach((k) => {
    queryParams[k] = ''
  })
  getList()
}

function handleSelectionChange(rows: any[]) {
  selection.value = rows
}

// ---------------- 弹窗表单 ----------------
const dialogVisible = ref(false)
const dialogTitle = ref('')
const saving = ref(false)
const formRef = ref<any>(null)
const editingId = ref<string | number | null>(null)
const isEdit = computed(() => editingId.value !== null)

const defaultForm = () => ({
    categoryValue: '',
    labelZh: '',
    labelEn: '',
    shortLabelZh: '',
    shortLabelEn: '',
    sort: 0,
    status: '0'
})
const form = reactive(defaultForm())

const rules = {
  categoryValue: [{ required: true, message: '分类值不能为空', trigger: 'blur' }]
}

function handleAdd() {
  editingId.value = null
  dialogTitle.value = '添加文章分类'
  Object.assign(form, defaultForm())
  dialogVisible.value = true
}

async function handleUpdate(row?: any) {
  const target = row ?? selection.value[0]
  if (!target) return
  editingId.value = target.id
  dialogTitle.value = '修改文章分类'
  Object.assign(form, defaultForm(), target)
  try {
    const detail: any = await adminResourceGet('article_category', target.id)
    if (detail) Object.assign(form, detail)
  } catch (e) {
    console.error('[admin] 文章分类详情加载失败，使用行数据兜底', e)
  }
  dialogVisible.value = true
}

function cancel() {
  dialogVisible.value = false
}

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload: Record<string, any> = {}
    payload.categoryValue = form.categoryValue
    payload.labelZh = form.labelZh
    payload.labelEn = form.labelEn
    payload.shortLabelZh = form.shortLabelZh
    payload.shortLabelEn = form.shortLabelEn
    payload.sort = form.sort
    payload.status = form.status
    if (editingId.value !== null) {
      await adminResourceUpdate('article_category', editingId.value, payload)
      ElMessage.success('修改成功')
    } else {
      await adminResourceCreate('article_category', payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    getList()
  } catch (e) {
    console.error('[admin] 文章分类保存失败', e)
  } finally {
    saving.value = false
  }
}

// ---------------- 删除 ----------------
async function handleDelete(row?: any) {
  const rows = row ? [row] : selection.value
  if (!rows.length) return
  const ok = await ElMessageBox.confirm(
    row ? '确认删除该条数据？' : `确认删除选中的 ${rows.length} 条数据？`,
    '提示',
    { type: 'warning' }
  )
    .then(() => true)
    .catch(() => false)
  if (!ok) return

  const results = await Promise.allSettled(
    rows.map((r: any) => adminResourceDelete('article_category', r.id))
  )
  const failed = results.filter((r) => r.status === 'rejected')
  failed.forEach((r: any) => console.error('[admin] 文章分类删除失败', r.reason))
  if (failed.length) {
    ElMessage.warning(`成功 ${results.length - failed.length} 条，失败 ${failed.length} 条`)
  } else {
    ElMessage.success(`已删除 ${results.length} 条`)
  }
  getList()
}

onMounted(getList)
</script>

<style lang="less" scoped>
.app-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 16px 16px 0;

  .dark & {
    background: #141414;
    border-color: #2a2a2a;
  }

  :deep(.el-form-item) {
    margin-bottom: 16px;
  }
}

.table-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;

  .dark & {
    background: #141414;
    border-color: #2a2a2a;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #ebeef5;
  flex-wrap: wrap;

  .dark & {
    border-color: #2a2a2a;
  }
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.total-text {
  margin-left: 4px;
  font-size: 13px;
  color: #8c8c8c;
}

.icon-btn {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ebeef5;
  border-radius: 50%;
  background: transparent;
  color: #5a5a5a;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #409eff;
    border-color: #409eff;
    background: #f5f7fa;
  }
}

.thumb {
  width: 56px;
  height: 40px;
  border-radius: 3px;
  display: block;
  background: #f5f7fa;
}

.w-full {
  width: 100%;
}

</style>
