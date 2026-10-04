<!--
  菜单管理（/api/system/menu，主键 menuId；支持平铺 / 树形切换）
  若依原版写法：页面自持全部逻辑与 UI，不依赖任何共享组件 / composable。
  数据来源：@/api/system 的 systemMenuList / Get / Create / Update / Delete。
  引用关系：由 router/index.ts 的 SYSTEM_PAGES 注册（权限前缀 system: 的菜单）。
  注意：主键为 menuId；菜单改动影响后台动态路由与侧边栏，需重新登录生效。
-->
<template>
  <div class="app-container">
    <!-- 搜索区 -->
    <div v-show="showSearch" class="search-card">
      <el-form :model="queryParams" inline @submit.prevent>
        <el-form-item label="菜单名称">
          <el-input
            v-model="queryParams.menuName"
            placeholder="请输入菜单名称"
            clearable
            style="width: 180px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="queryParams.menuType" placeholder="类型" clearable style="width: 180px">
            <el-option v-for="o in MENU_TYPES" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 180px">
            <el-option v-for="o in STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-radio-group v-model="treeMode" size="default" @change="getList">
            <el-radio-button :value="false">平铺</el-radio-button>
            <el-radio-button :value="true">树形</el-radio-button>
          </el-radio-group>
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
        row-key="menuId"
        :tree-props="{ children: 'children' }"
        default-expand-all
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="menuId" label="ID" width="80" align="center" />
        <el-table-column prop="menuName" label="菜单名称" min-width="160" show-overflow-tooltip />
        <el-table-column label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag effect="light" size="small">{{ menuTypeLabel(row.menuType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orderNum" label="排序" width="80" align="center" />
        <el-table-column prop="path" label="路径" width="140" show-overflow-tooltip />
        <el-table-column prop="component" label="组件" width="180" show-overflow-tooltip />
        <el-table-column prop="perms" label="权限标识" width="160" show-overflow-tooltip />
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
      width="600px"
      append-to-body
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" label-width="100px" :rules="rules">
        <el-form-item label="上级菜单" prop="parentId">
          <el-select v-model="form.parentId" class="w-full" placeholder="顶级菜单">
            <el-option v-for="o in parentOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="form.menuName" placeholder="菜单名称" />
        </el-form-item>
        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="form.menuType">
            <el-radio v-for="o in MENU_TYPES" :key="o.value" :value="o.value">{{ o.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="显示排序" prop="orderNum">
          <el-input-number v-model="form.orderNum" :controls="false" class="w-full" />
        </el-form-item>
        <el-form-item label="路由路径" prop="path">
          <el-input v-model="form.path" placeholder="如 user" />
        </el-form-item>
        <el-form-item label="组件路径" prop="component">
          <el-input v-model="form.component" placeholder="如 blog/system/user" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="form.icon" placeholder="如 el-icon-user" />
        </el-form-item>
        <el-form-item label="权限标识" prop="perms">
          <el-input v-model="form.perms" placeholder="如 system:user:edit" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" class="w-full">
            <el-option v-for="o in STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
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
import { ArrowDown, ArrowUp, Delete, Edit, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import {
  systemMenuList,
  systemMenuGet,
  systemMenuCreate,
  systemMenuUpdate,
  systemMenuDelete
} from '@/api/system'

const userStore = useUserStore()
const editable = computed(() => userStore.hasPerm('system:menu:edit'))

const STATUS_OPTIONS = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' }
]
const MENU_TYPES = [
  { label: '目录', value: 'M' },
  { label: '菜单', value: 'C' },
  { label: '按钮', value: 'F' }
]

function menuTypeLabel(t?: string) {
  return MENU_TYPES.find((o) => o.value === t)?.label ?? t ?? ''
}

// ---------------- 列表 ----------------
const list = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const selection = ref<any[]>([])
const showSearch = ref(true)
const treeMode = ref(false)

const queryParams = reactive<Record<string, any>>({ menuName: '', menuType: '', status: '' })

async function getList() {
  loading.value = true
  try {
    const params: Record<string, any> = { tree: treeMode.value }
    Object.keys(queryParams).forEach((k) => {
      const v = queryParams[k]
      if (v !== '' && v !== undefined && v !== null) params[k] = v
    })
    const data = await systemMenuList(params)
    list.value = Array.isArray(data) ? data : []
    total.value = list.value.length
  } catch (e) {
    console.error('[admin] 菜单列表加载失败', e)
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

// 上级菜单下拉：始终拉全量树形
const menuTree = ref<any[]>([])
async function loadMenuTree() {
  try {
    const data = await systemMenuList({ tree: true })
    menuTree.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('[admin] 菜单树加载失败', e)
    menuTree.value = []
  }
}

const parentOptions = computed(() => {
  const out: { value: number; label: string }[] = [{ value: 0, label: '顶级菜单' }]
  const walk = (nodes: any[], depth: number) => {
    for (const n of nodes) {
      const prefix = depth ? '　'.repeat(depth) + '└ ' : ''
      out.push({ value: n.menuId, label: prefix + n.menuName })
      if (n.children && n.children.length) walk(n.children, depth + 1)
    }
  }
  walk(menuTree.value, 0)
  return out
})

// ---------------- 弹窗表单 ----------------
const dialogVisible = ref(false)
const dialogTitle = ref('')
const saving = ref(false)
const formRef = ref<any>(null)
const editingId = ref<string | number | null>(null)

const defaultForm = () => ({
  parentId: 0,
  menuName: '',
  menuType: 'C',
  orderNum: 0,
  path: '',
  component: '',
  icon: '',
  perms: '',
  status: '0'
})
const form = reactive(defaultForm())

const rules = {
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }]
}

function handleAdd() {
  editingId.value = null
  dialogTitle.value = '添加菜单'
  Object.assign(form, defaultForm())
  dialogVisible.value = true
}

async function handleUpdate(row?: any) {
  const target = row ?? selection.value[0]
  if (!target) return
  editingId.value = target.menuId
  dialogTitle.value = '修改菜单'
  Object.assign(form, defaultForm(), target)
  try {
    const detail: any = await systemMenuGet(target.menuId)
    if (detail) Object.assign(form, detail)
  } catch (e) {
    console.error('[admin] 菜单详情加载失败，使用行数据兜底', e)
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
    Object.keys(defaultForm()).forEach((k) => {
      payload[k] = (form as any)[k]
    })
    if (editingId.value !== null) {
      await systemMenuUpdate(editingId.value, payload)
      ElMessage.success('修改成功')
    } else {
      await systemMenuCreate(payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    getList()
    loadMenuTree()
  } catch (e) {
    console.error('[admin] 菜单保存失败', e)
  } finally {
    saving.value = false
  }
}

// ---------------- 删除 ----------------
async function handleDelete(row?: any) {
  const rows = row ? [row] : selection.value
  if (!rows.length) return
  const ok = await ElMessageBox.confirm(
    row ? `确认删除菜单「${row.menuName}」？` : `确认删除选中的 ${rows.length} 条数据？`,
    '提示',
    { type: 'warning' }
  )
    .then(() => true)
    .catch(() => false)
  if (!ok) return

  const results = await Promise.allSettled(rows.map((r: any) => systemMenuDelete(r.menuId)))
  const failed = results.filter((r) => r.status === 'rejected')
  failed.forEach((r: any) => console.error('[admin] 菜单删除失败', r.reason))
  if (failed.length) {
    ElMessage.warning(`成功 ${results.length - failed.length} 条，失败 ${failed.length} 条`)
  } else {
    ElMessage.success(`已删除 ${results.length} 条`)
  }
  getList()
  loadMenuTree()
}

onMounted(() => {
  loadMenuTree()
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

.w-full {
  width: 100%;
}
</style>
