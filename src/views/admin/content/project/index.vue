<!--
  作品列表（/api/admin/project，专用接口驼峰 VO）
  若依原版写法：页面自持全部逻辑与 UI，不依赖任何共享组件 / composable。
  数据来源：@/api/adminResource 的 adminResourceList / adminResourceGet /
    adminResourceCreate / adminResourceUpdate / adminResourceDelete（专用接口，字段名驼峰）
  引用关系：本文件不被任何模块静态 import，而是由 src/config/adminPages.ts 的 CONTENT_PAGES
    依据后端菜单 perms 推导出的 resource 名动态匹配后，经 router 的 lazy import 加载；
    请勿因「无静态 import」误判为孤儿文件而删除。
  编辑权限：editable = userStore.canEdit('project')，即需 blog:project:edit 权限。
  字段约定：表单字段与后端 project 表列名一一对应。
-->
<template>
  <div class="app-container">
    <!-- 搜索区 -->
    <div v-show="showSearch" class="search-card">
      <el-form :model="queryParams" inline @submit.prevent>
        <el-form-item label="作品ID">
          <el-input
            v-model="queryParams.id"
            placeholder="请输入作品ID"
            clearable
            style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-input
            v-model="queryParams.category"
            placeholder="请输入分类"
            clearable
            style="width: 180px"
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
        <el-table-column prop="category" label="分类" width="120" show-overflow-tooltip />
        <el-table-column prop="categoryValue" label="分类中文名" width="140" show-overflow-tooltip />
        <el-table-column label="封面" width="90" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.cover"
              :src="row.cover"
              fit="cover"
              class="thumb"
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
            <a v-if="row.videoUrl" :href="row.videoUrl" target="_blank" class="cell-link">
              {{ row.videoUrl }}
            </a>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column label="状态" width="90" align="center">
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
      width="800px"
      append-to-body
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" label-width="80px" :rules="rules">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="分类" prop="category">
              <el-select v-model="form.category" placeholder="请选择分类" filterable clearable class="w-full">
                <el-option
                  v-for="o in categoryOptions"
                  :key="o.value"
                  :label="o.label"
                  :value="o.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :controls="false" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="图标" prop="icon">
              <el-input v-model="form.icon" placeholder="图标类名" />
            </el-form-item>
          </el-col>
           <!-- 角色 -->
          <el-col :span="8">
            <el-form-item label="角色" prop="role">
              <el-input v-model="form.role"/>
            </el-form-item>
          </el-col>
          <!-- 状态 -->
          <el-col :span="8">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" class="w-full">
                <el-option v-for="o in STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <!-- 标签 -->
          <el-col :span="8">
            <el-form-item label="标签" prop="tags">
              <el-input v-model="form.tags"/>
            </el-form-item>
          </el-col>
          <!-- 标题 -->
          <el-col :span="12">
            <el-form-item label="标题" prop="title">
              <el-input v-model="form.title"/>
            </el-form-item>
          </el-col>
          <!-- 子标题 -->
          <el-col :span="12">
            <el-form-item label="子标题" prop="subtitle">
              <el-input v-model="form.subtitle"/>
            </el-form-item>
          </el-col>
          <!-- 角色详情 -->
          <el-col :span="12">
            <el-form-item label="角色详情" prop="roleDetail">
              <el-input v-model="form.roleDetail"/>
            </el-form-item>
          </el-col>
          <!-- 想法 -->
          <el-col :span="12">
            <el-form-item label="想法" prop="concept">
              <el-input v-model="form.concept"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="视频链接" prop="videoUrl">
              <el-input v-model="form.videoUrl" placeholder="https://" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="GitHub" prop="githubUrl">
              <el-input v-model="form.githubUrl" placeholder="https://" />
            </el-form-item>
          </el-col>
          <!-- 描述 -->
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input v-model="form.description" type="textarea" :rows="3" placeholder="项目描述" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="封面" prop="cover">
              <div class="image-upload">
                <el-image
                  v-if="form.cover"
                  :src="form.cover"
                  fit="cover"
                  class="iu-thumb"
                  :preview-src-list="[form.cover]"
                  preview-teleported
                />
                <div v-else class="iu-empty">
                  <el-icon><Picture /></el-icon>
                  <span>未上传</span>
                </div>
                <p v-if="uploadError" class="iu-error">{{ uploadError }}</p>
                <div class="iu-actions">
                  <el-upload
                    :show-file-list="false"
                    :accept="ACCEPT"
                    :disabled="!canUpload"
                    :before-upload="beforeUpload"
                    :http-request="handleUpload"
                  >
                    <el-button
                      type="primary"
                      size="small"
                      :loading="uploading"
                      :disabled="!canUpload"
                    >
                      {{ form.cover ? '重新上传' : '上传图片' }}
                    </el-button>
                  </el-upload>
                  <el-button
                    v-if="form.cover"
                    size="small"
                    type="danger"
                    plain
                    :disabled="!canUpload"
                    @click="form.cover = ''"
                  >
                    移除
                  </el-button>
                </div>
              </div>
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
import type { UploadRequestOptions } from 'element-plus'
import {
  ArrowDown,
  ArrowUp,
  Delete,
  Edit,
  Picture,
  Plus,
  Refresh,
  Search
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { adminUploadImage } from '@/api/admin'
import {
  adminResourceList,
  adminResourceGet,
  adminResourceCreate,
  adminResourceUpdate,
  adminResourceDelete
} from '@/api/adminResource'

const userStore = useUserStore()
const editable = computed(() => userStore.canEdit('project'))
const canUpload = computed(() => userStore.hasPerm('blog:upload:edit'))

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

const queryParams = reactive<Record<string, any>>({ id: '', category: '', status: '' })

// 分类下拉：来自 /api/admin/project_category
interface CategoryOption {
  value: string
  label: string
}
const categoryOptions = ref<CategoryOption[]>([])

async function loadCategoryOptions() {
  try {
    const data = await adminResourceList('project_category')
    categoryOptions.value = (Array.isArray(data) ? data : []).map((c: any) => ({
      value: c.categoryValue,
      label: c.labelZh ? `${c.labelZh}（${c.categoryValue}）` : c.categoryValue
    }))
  } catch (e) {
    console.error('[admin] 作品分类加载失败', e)
    categoryOptions.value = []
  }
}

/**
 * 拉取 project 列表：先剔除查询参数中的空串 / undefined / null 再发请求。
 * 后端为全量返回（非分页），故 total 直接取列表长度。
 * 失败兜底：列表置空、total 归零，错误提示由请求拦截器统一弹出。
 */
async function getList() {
  loading.value = true
  try {
    const params: Record<string, any> = {}
    Object.keys(queryParams).forEach((k) => {
      const v = queryParams[k]
      if (v !== '' && v !== undefined && v !== null) params[k] = v
    })
    const data = await adminResourceList('project', params)
    list.value = Array.isArray(data) ? data : []
    total.value = list.value.length
  } catch (e) {
    console.error('[admin] 作品列表加载失败', e)
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

/** 按当前查询条件重新拉取列表（搜索按钮 / 输入框回车触发） */
function handleQuery() {
  getList()
}

/** 清空全部查询条件后重新拉取列表 */
function resetQuery() {
  Object.keys(queryParams).forEach((k) => {
    queryParams[k] = ''
  })
  getList()
}

/** 记录表格多选结果，供批量修改 / 批量删除使用 */
function handleSelectionChange(rows: any[]) {
  selection.value = rows
}

// ---------------- 弹窗表单 ----------------
const dialogVisible = ref(false)
const dialogTitle = ref('')
const saving = ref(false)
const formRef = ref<any>(null)
const editingId = ref<string | number | null>(null)

const defaultForm = () => ({
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
  remark: '',
  title: '',
  subtitle: '',
  description: '',
  role: '',
  roleDetail: '',
  concept: '',
  tags: ''
})
const form = reactive(defaultForm())

const rules = {
  id: [{ required: true, message: '作品ID不能为空', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

/** 打开新增弹窗：editingId 置空表示新增，表单回填默认值 */
function handleAdd() {
  editingId.value = null
  dialogTitle.value = '添加作品'
  Object.assign(form, defaultForm())
  dialogVisible.value = true
}

/**
 * 打开修改弹窗：优先使用传入行，未传则取表格选中的第一条。
 * 先用行数据填充表单，再拉详情覆盖（保证字段为最新）；
 * 详情请求失败不阻塞，仅打印日志并沿用行数据兜底。
 */
async function handleUpdate(row?: any) {
  const target = row ?? selection.value[0]
  if (!target) return
  editingId.value = target.id
  dialogTitle.value = '修改作品'
  Object.assign(form, defaultForm(), target)
  try {
    const detail: any = await adminResourceGet('project', target.id)
    if (detail) Object.assign(form, detail)
  } catch (e) {
    console.error('[admin] 作品详情加载失败，使用行数据兜底', e)
  }
  dialogVisible.value = true
}

/** 关闭弹窗，不保存任何修改 */
function cancel() {
  dialogVisible.value = false
}

/**
 * 提交表单：先做表单校验，校验失败直接返回；
 * 再按 editingId 是否为空区分「修改」与「新增」；
 * 成功后关闭弹窗并刷新列表。
 */
async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload: Record<string, any> = {}
    Object.keys(defaultForm()).forEach((k) => {
      payload[k] = (form as any)[k]
    })
    if (editingId.value !== null) {
      await adminResourceUpdate('project', editingId.value, payload)
      ElMessage.success('修改成功')
    } else {
      await adminResourceCreate('project', payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    getList()
  } catch (e) {
    console.error('[admin] 作品保存失败', e)
  } finally {
    saving.value = false
  }
}

// ---------------- 删除 ----------------
/**
 * 删除：传入行时删该行，否则批量删除选中行；
 * 先弹二次确认（用户取消则直接返回），再用 Promise.allSettled 并发删除并统计成功 / 失败条数。
 */
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
    rows.map((r: any) => adminResourceDelete('project', r.id))
  )
  const failed = results.filter((r) => r.status === 'rejected')
  failed.forEach((r: any) => console.error('[admin] 作品删除失败', r.reason))
  if (failed.length) {
    ElMessage.warning(`成功 ${results.length - failed.length} 条，失败 ${failed.length} 条`)
  } else {
    ElMessage.success(`已删除 ${results.length} 条`)
  }
  getList()
}

// ---------------- 封面上传 ----------------
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp']
const MAX_SIZE = 5 * 1024 * 1024
const ACCEPT = ALLOWED_EXT.map((e) => '.' + e).join(',')
const uploading = ref(false)
const uploadError = ref('')

function beforeUpload(file: File) {
  uploadError.value = ''
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (!ALLOWED_EXT.includes(ext)) {
    uploadError.value = `不支持的图片类型：${ext || '未知'}（仅支持 ${ALLOWED_EXT.join('/')}）`
    return false
  }
  if (file.size > MAX_SIZE) {
    uploadError.value = `图片超过 5MB（当前 ${(file.size / 1024 / 1024).toFixed(2)}MB）`
    return false
  }
  return true
}

async function handleUpload(options: UploadRequestOptions) {
  uploading.value = true
  try {
    const res = await adminUploadImage(options.file)
    form.cover = res.url
    ElMessage.success('上传成功')
    options.onSuccess(res as any)
  } catch (e: any) {
    uploadError.value = e?.message || '上传失败'
    options.onError(e)
  } finally {
    uploading.value = false
  }
}

onMounted(() => {
  loadCategoryOptions()
  getList()
})
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

.cell-link {
  color: #409eff;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.w-full {
  width: 100%;
}

// 封面上传（页面内联）
.image-upload {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.iu-thumb {
  width: 120px;
  height: 90px;
  border: 1px solid #ececec;
  border-radius: 8px;
  background: #f3f4f6;

  .dark & {
    border-color: #2a2a2a;
  }
}

.iu-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 120px;
  height: 90px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  color: #9ca3af;

  .dark & {
    border-color: #2a2a2a;
    color: #6b7280;
  }
}

.iu-error {
  margin: 0;
  color: #f56c6c;
  font-size: 12px;
}

// 上传 / 移除 按钮同一行
.iu-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
