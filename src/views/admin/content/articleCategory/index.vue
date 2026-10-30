<!--
  文章分类（/api/admin/article_category，后端专用接口，字段驼峰）
  若依原版写法：页面自持全部逻辑与 UI，不依赖任何共享组件 / composable。
  数据来源：@/api/adminResource 的 adminResourceList / adminResourceGet /
    adminResourceCreate / adminResourceUpdate / adminResourceDelete（专用接口，字段名驼峰）
  筛选说明：后端该接口仅支持 status 筛选（后端 AdminArticleCategoryQuery 只有这一个字段），
    且列表全量返回、无分页；因此「分类值」「中文名」两个输入框改为前端本地过滤，不额外发请求。
  引用关系：本文件不被任何模块静态 import，而是由 src/config/adminPages.ts 的 CONTENT_PAGES
    依据后端菜单 perms 推导出的 resource 名动态匹配后，经 router 的 lazy import 加载；
    请勿因「无静态 import」误判为孤儿文件而删除。
  编辑权限：editable = userStore.canEdit('article_category')，即需 blog:article_category:edit 权限。
  字段约定：表单字段与后端 AdminArticleCategoryVo 一一对应（id 由 URL 决定，不进表单）。
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
import type { FormInstance } from 'element-plus'
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
import type { AdminArticleCategoryVo, AdminSaveVo } from '@/api/adminTypes'

const userStore = useUserStore()
const editable = computed(() => userStore.canEdit('article_category'))

const STATUS_OPTIONS = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' }
]

/** 表单模型：字段集与后端 AdminArticleCategoryVo 一致（id 由 URL 决定，不进表单） */
interface CategoryForm {
  categoryValue: string
  labelZh: string
  labelEn: string
  shortLabelZh: string
  shortLabelEn: string
  sort: number
  status: string
}

// ---------------- 列表 ----------------
const list = ref<AdminArticleCategoryVo[]>([])
const loading = ref(false)
const total = ref(0)
const selection = ref<AdminArticleCategoryVo[]>([])
const showSearch = ref(true)

/** 查询条件：status 走后端筛选；categoryValue / labelZh 由前端本地过滤（后端不识别） */
const queryParams = reactive({
  categoryValue: '',
  labelZh: '',
  status: ''
})

/**
 * 拉取 article_category 列表。
 * 后端专用接口仅支持 status 筛选（后端 AdminArticleCategoryQuery 只有 status 一个字段），
 * 分类值 / 中文名 透传给后端会被静默忽略，故这里只下发 status，其余在本地过滤。
 * 后端为全量返回（非分页），total 取过滤后的条数。
 * 失败兜底：列表置空、total 归零，错误提示由请求拦截器统一弹出。
 */
async function getList() {
  loading.value = true
  try {
    const params: Record<string, any> = {}
    if (queryParams.status !== '') params.status = queryParams.status
    const data = await adminResourceList('article_category', params)
    const rows: AdminArticleCategoryVo[] = Array.isArray(data) ? data : []
    list.value = rows.filter(matchLocalFilter)
    total.value = list.value.length
  } catch (e) {
    console.error('[admin] 文章分类列表加载失败', e)
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

/** 本地过滤：分类值 / 中文名（模糊匹配，后端不支持这两个查询参数） */
function matchLocalFilter(row: AdminArticleCategoryVo) {
  const categoryValue = queryParams.categoryValue.trim()
  if (categoryValue && !String(row.categoryValue ?? '').includes(categoryValue)) return false
  const labelZh = queryParams.labelZh.trim()
  if (labelZh && !String(row.labelZh ?? '').includes(labelZh)) return false
  return true
}

/** 按当前查询条件重新拉取列表（搜索按钮 / 输入框回车触发） */
function handleQuery() {
  getList()
}

/** 清空全部查询条件后重新拉取列表 */
function resetQuery() {
  queryParams.categoryValue = ''
  queryParams.labelZh = ''
  queryParams.status = ''
  getList()
}

/** 记录表格多选结果，供批量修改 / 批量删除使用 */
function handleSelectionChange(rows: AdminArticleCategoryVo[]) {
  selection.value = rows
}

// ---------------- 弹窗表单 ----------------
const dialogVisible = ref(false)
const dialogTitle = ref('')
const saving = ref(false)
const formRef = ref<FormInstance>()
const editingId = ref<number | null>(null)

const defaultForm = (): CategoryForm => ({
  categoryValue: '',
  labelZh: '',
  labelEn: '',
  shortLabelZh: '',
  shortLabelEn: '',
  sort: 0,
  status: '0'
})
const form = reactive<CategoryForm>(defaultForm())

const rules = {
  categoryValue: [{ required: true, message: '分类值不能为空', trigger: 'blur' }]
}

/** 打开新增弹窗：editingId 置空表示新增，表单回填默认值 */
function handleAdd() {
  editingId.value = null
  dialogTitle.value = '添加文章分类'
  fillForm(defaultForm())
  dialogVisible.value = true
}

/**
 * 打开修改弹窗：优先使用传入行，未传则取表格选中的第一条。
 * 先用行数据填充表单，再拉详情覆盖（保证字段为最新）；
 * 详情请求失败不阻塞，仅打印日志并沿用行数据兜底。
 */
async function handleUpdate(row?: AdminArticleCategoryVo) {
  const target = row ?? selection.value[0]
  if (!target) return
  editingId.value = target.id
  dialogTitle.value = '修改文章分类'
  fillForm(target)
  try {
    const detail = await adminResourceGet('article_category', target.id)
    if (detail) fillForm(detail)
  } catch (e) {
    console.error('[admin] 文章分类详情加载失败，使用行数据兜底', e)
  }
  dialogVisible.value = true
}

/** 用给定数据填充表单：只取表单字段，避免把 id 之类写进表单 */
function fillForm(source: Partial<CategoryForm>) {
  const d = defaultForm()
  form.categoryValue = source.categoryValue ?? d.categoryValue
  form.labelZh = source.labelZh ?? d.labelZh
  form.labelEn = source.labelEn ?? d.labelEn
  form.shortLabelZh = source.shortLabelZh ?? d.shortLabelZh
  form.shortLabelEn = source.shortLabelEn ?? d.shortLabelEn
  form.sort = source.sort ?? d.sort
  form.status = source.status ?? d.status
}

/** 关闭弹窗，不保存任何修改 */
function cancel() {
  dialogVisible.value = false
}

/**
 * 提交表单：先做表单校验，校验失败直接返回；
 * 再按 editingId 是否为空区分「修改」与「新增」；
 * 入参直接由表单模型派生（字段集与后端 VO 一致），成功后关闭弹窗并刷新列表。
 */
async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload: AdminSaveVo<AdminArticleCategoryVo> = { ...form }
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
/**
 * 删除：传入行时删该行，否则批量删除选中行；
 * 先弹二次确认（用户取消则直接返回），再用 Promise.allSettled 并发删除并统计成功 / 失败条数。
 */
async function handleDelete(row?: AdminArticleCategoryVo) {
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
    rows.map((r) => adminResourceDelete('article_category', r.id))
  )
  const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
  failed.forEach((r) => console.error('[admin] 文章分类删除失败', r.reason))
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

.w-full {
  width: 100%;
}

</style>
