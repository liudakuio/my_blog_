<!--
  站点文案（/api/admin/site_text，专用接口驼峰 VO）
  若依原版写法：页面自持全部逻辑与 UI，不依赖任何共享组件 / composable。
  数据来源：@/api/adminResource 的 adminResourceList / adminResourceGet /
    adminResourceCreate / adminResourceUpdate / adminResourceDelete（专用接口，字段名驼峰）
  引用关系：本文件不被任何模块静态 import，而是由 src/config/adminPages.ts 的 CONTENT_PAGES
    依据后端菜单 perms 推导出的 resource 名动态匹配后，经 router 的 lazy import 加载；
    请勿因「无静态 import」误判为孤儿文件而删除。
  编辑权限：editable = userStore.canEdit('site_text')，即需 blog:site_text:edit 权限。
  字段约定：表单字段与后端 site_text 表列名一一对应。
-->
<template>
  <div class="app-container">
    <!-- 搜索区 -->
    <div v-show="showSearch" class="search-card">
      <el-form :model="queryParams" inline @submit.prevent>
        <el-form-item label="配置键">
          <el-input
            v-model="queryParams.configKey"
            placeholder="配置键"
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
        <el-table-column prop="configKey" label="配置键" width="220" show-overflow-tooltip />
        <el-table-column prop="valueZh" label="中文值" width="260" show-overflow-tooltip />
        <el-table-column prop="valueEn" label="英文值" width="260" show-overflow-tooltip />
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
          <el-col :span="12">
            <el-form-item label="配置键" prop="configKey">
              <el-input v-model="form.configKey" placeholder="配置键" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="中文值" prop="valueZh">
              <el-input v-model="form.valueZh" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="英文值" prop="valueEn">
              <el-input v-model="form.valueEn" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" placeholder="备注" />
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
const editable = computed(() => userStore.canEdit('site_text'))


// ---------------- 列表 ----------------
const list = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const selection = ref<any[]>([])
const showSearch = ref(true)

const queryParams = reactive<Record<string, any>>({
  configKey: ''
})

/**
 * 拉取 site_text 列表：先剔除查询参数中的空串 / undefined / null 再发请求。
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
    const data = await adminResourceList('site_text', params)
    list.value = Array.isArray(data) ? data : []
    total.value = list.value.length
  } catch (e) {
    console.error('[admin] 站点文案列表加载失败', e)
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
    configKey: '',
    valueZh: '',
    valueEn: '',
    remark: ''
})
const form = reactive(defaultForm())

const rules = {
  configKey: [{ required: true, message: '配置键不能为空', trigger: 'blur' }]
}

/** 打开新增弹窗：editingId 置空表示新增，表单回填默认值 */
function handleAdd() {
  editingId.value = null
  dialogTitle.value = '添加站点文案'
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
  dialogTitle.value = '修改站点文案'
  Object.assign(form, defaultForm(), target)
  try {
    const detail: any = await adminResourceGet('site_text', target.id)
    if (detail) Object.assign(form, detail)
  } catch (e) {
    console.error('[admin] 站点文案详情加载失败，使用行数据兜底', e)
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
    payload.configKey = form.configKey
    payload.valueZh = form.valueZh
    payload.valueEn = form.valueEn
    payload.remark = form.remark
    if (editingId.value !== null) {
      await adminResourceUpdate('site_text', editingId.value, payload)
      ElMessage.success('修改成功')
    } else {
      await adminResourceCreate('site_text', payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    getList()
  } catch (e) {
    console.error('[admin] 站点文案保存失败', e)
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
    rows.map((r: any) => adminResourceDelete('site_text', r.id))
  )
  const failed = results.filter((r) => r.status === 'rejected')
  failed.forEach((r: any) => console.error('[admin] 站点文案删除失败', r.reason))
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
