<!--
  竞赛分组（/api/admin/competition，通用接口下划线字段）
  若依原版写法：页面自持全部逻辑与 UI，不依赖任何共享组件 / composable。
-->
<template>
  <div class="app-container">
    <!-- 搜索区 -->
    <div v-show="showSearch" class="search-card">
      <el-form :model="queryParams" inline @submit.prevent>
        <el-form-item label="中文级别">
          <el-input
            v-model="queryParams.level_zh"
            placeholder="中文级别"
            clearable style="width: 180px"
            @keyup.enter="handleQuery"
          />
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
        <el-table-column prop="level_zh" label="中文级别" width="240" show-overflow-tooltip />
        <el-table-column prop="level_en" label="英文级别" width="240" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="80" align="center" show-overflow-tooltip />
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
      width="640px"
      append-to-body
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" label-width="110px" :rules="rules">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="中文级别" prop="level_zh">
              <el-input v-model="form.level_zh" placeholder="中文级别" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="英文级别" prop="level_en">
              <el-input v-model="form.level_en" placeholder="英文级别" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :controls="false" class="w-full" />
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
import { adminList, adminGet, adminCreate, adminUpdate, adminDelete } from '@/api/admin'

const userStore = useUserStore()
const editable = computed(() => userStore.canEdit('competition'))


// ---------------- 列表 ----------------
const list = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const selection = ref<any[]>([])
const showSearch = ref(true)
const advanced = ref(false)

const queryParams = reactive<Record<string, any>>({
  level_zh: ''
})

async function getList() {
  loading.value = true
  try {
    const params: Record<string, any> = {}
    Object.keys(queryParams).forEach((k) => {
      const v = queryParams[k]
      if (v !== '' && v !== undefined && v !== null) params[k] = v
    })
    const data = await adminList('competition', params)
    list.value = Array.isArray(data) ? data : []
    total.value = list.value.length
  } catch (e) {
    console.error('[admin] 竞赛分组列表加载失败', e)
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
    level_zh: '',
    level_en: '',
    sort: 0
})
const form = reactive(defaultForm())

const rules = {}

function handleAdd() {
  editingId.value = null
  dialogTitle.value = '添加竞赛分组'
  Object.assign(form, defaultForm())
  dialogVisible.value = true
}

async function handleUpdate(row?: any) {
  const target = row ?? selection.value[0]
  if (!target) return
  editingId.value = target.id
  dialogTitle.value = '修改竞赛分组'
  Object.assign(form, defaultForm(), target)
  try {
    const detail: any = await adminGet('competition', target.id)
    if (detail) Object.assign(form, detail)
  } catch (e) {
    console.error('[admin] 竞赛分组详情加载失败，使用行数据兜底', e)
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
    payload.level_zh = form.level_zh
    payload.level_en = form.level_en
    payload.sort = form.sort
    if (editingId.value !== null) {
      await adminUpdate('competition', editingId.value, payload)
      ElMessage.success('修改成功')
    } else {
      await adminCreate('competition', payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    getList()
  } catch (e) {
    console.error('[admin] 竞赛分组保存失败', e)
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
    rows.map((r: any) => adminDelete('competition', r.id))
  )
  const failed = results.filter((r) => r.status === 'rejected')
  failed.forEach((r: any) => console.error('[admin] 竞赛分组删除失败', r.reason))
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
