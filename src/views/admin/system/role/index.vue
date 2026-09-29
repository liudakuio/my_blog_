<!--
  角色管理（/api/system/role，主键 roleId；含菜单分配 menuIds）
  若依原版写法：页面自持全部逻辑与 UI，不依赖任何共享组件 / composable。
-->
<template>
  <div class="app-container">
    <!-- 搜索区 -->
    <div v-show="showSearch" class="search-card">
      <el-form :model="queryParams" inline @submit.prevent>
        <el-form-item label="角色键">
          <el-input
            v-model="queryParams.roleKey"
            placeholder="请输入角色键"
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
        row-key="roleId"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="roleId" label="ID" width="80" align="center" />
        <el-table-column prop="roleKey" label="角色键" min-width="160" show-overflow-tooltip />
        <el-table-column prop="roleName" label="角色名称" min-width="160" show-overflow-tooltip />
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '0' ? 'success' : 'info'" effect="light" size="small">
              {{ row.status === '0' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" show-overflow-tooltip />
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
      <el-form ref="formRef" :model="form" label-width="90px" :rules="rules">
        <el-form-item label="角色键" prop="roleKey">
          <el-input v-model="form.roleKey" placeholder="英文唯一标识，如 admin" />
        </el-form-item>
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="显示名称" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" class="w-full">
            <el-option v-for="o in STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="菜单权限">
          <div class="menu-tree-box">
            <el-tree
              ref="treeRef"
              :data="menuTree"
              :props="{ label: 'menuName', children: 'children' }"
              node-key="menuId"
              show-checkbox
              default-expand-all
            />
          </div>
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
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, ArrowUp, Delete, Edit, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import {
  systemRoleList,
  systemRoleGet,
  systemRoleCreate,
  systemRoleUpdate,
  systemRoleDelete,
  systemMenuList
} from '@/api/system'

const userStore = useUserStore()
const editable = computed(() => userStore.hasPerm('system:role:edit'))

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

const queryParams = reactive<Record<string, any>>({ roleKey: '', status: '' })

async function getList() {
  loading.value = true
  try {
    const params: Record<string, any> = {}
    Object.keys(queryParams).forEach((k) => {
      const v = queryParams[k]
      if (v !== '' && v !== undefined && v !== null) params[k] = v
    })
    const data = await systemRoleList(params)
    list.value = Array.isArray(data) ? data : []
    total.value = list.value.length
  } catch (e) {
    console.error('[admin] 角色列表加载失败', e)
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

// ---------------- 菜单树 ----------------
const menuTree = ref<any[]>([])
const treeRef = ref<any>(null)

async function loadMenuTree() {
  try {
    const data = await systemMenuList({ tree: true })
    menuTree.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('[admin] 菜单树加载失败', e)
    menuTree.value = []
  }
}

/** 勾选结果：全选 + 半选父节点，保证父目录可展开 */
function collectMenuIds(): number[] {
  const tree = treeRef.value
  if (!tree) return []
  const checked: number[] = tree.getCheckedKeys() ?? []
  const half: number[] = tree.getHalfCheckedKeys?.() ?? []
  return Array.from(new Set([...checked, ...half]))
}

// ---------------- 弹窗表单 ----------------
const dialogVisible = ref(false)
const dialogTitle = ref('')
const saving = ref(false)
const formRef = ref<any>(null)
const editingId = ref<string | number | null>(null)
const isEdit = computed(() => editingId.value !== null)

const defaultForm = () => ({ roleKey: '', roleName: '', status: '0' })
const form = reactive(defaultForm())

const rules = {
  roleKey: [{ required: true, message: '请输入角色键', trigger: 'blur' }]
}

// 弹窗 destroy-on-close：需等树组件挂载、数据就绪后再回显勾选
async function setCheckedKeys(ids: number[]) {
  if (!menuTree.value.length) await loadMenuTree()
  await nextTick()
  await nextTick()
  treeRef.value?.setCheckedKeys(ids, false)
}

async function handleAdd() {
  editingId.value = null
  dialogTitle.value = '添加角色'
  Object.assign(form, defaultForm())
  dialogVisible.value = true
  await setCheckedKeys([])
}

async function handleUpdate(row?: any) {
  const target = row ?? selection.value[0]
  if (!target) return
  editingId.value = target.roleId
  dialogTitle.value = '修改角色'
  Object.assign(form, defaultForm(), target)
  let menuIds: number[] = []
  try {
    const detail: any = await systemRoleGet(target.roleId)
    if (detail) {
      form.roleKey = detail.roleKey ?? form.roleKey
      form.roleName = detail.roleName ?? form.roleName
      form.status = detail.status ?? form.status
      menuIds = detail.menuIds ?? []
    }
  } catch (e) {
    console.error('[admin] 角色详情加载失败，使用行数据兜底', e)
  }
  dialogVisible.value = true
  await setCheckedKeys(menuIds)
}

function cancel() {
  dialogVisible.value = false
}

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload: Record<string, any> = {
      roleKey: form.roleKey,
      roleName: form.roleName,
      status: form.status,
      menuIds: collectMenuIds()
    }
    if (editingId.value !== null) {
      await systemRoleUpdate(editingId.value, payload)
      ElMessage.success('修改成功')
    } else {
      await systemRoleCreate(payload)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    getList()
  } catch (e) {
    console.error('[admin] 角色保存失败', e)
  } finally {
    saving.value = false
  }
}

// ---------------- 删除 ----------------
async function handleDelete(row?: any) {
  const rows = row ? [row] : selection.value
  if (!rows.length) return
  const ok = await ElMessageBox.confirm(
    row ? `确认删除角色「${row.roleName || row.roleKey}」？` : `确认删除选中的 ${rows.length} 条数据？`,
    '提示',
    { type: 'warning' }
  )
    .then(() => true)
    .catch(() => false)
  if (!ok) return

  const results = await Promise.allSettled(rows.map((r: any) => systemRoleDelete(r.roleId)))
  const failed = results.filter((r) => r.status === 'rejected')
  failed.forEach((r: any) => console.error('[admin] 角色删除失败', r.reason))
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

.menu-tree-box {
  width: 100%;
  max-height: 320px;
  overflow: auto;
  padding: 8px 12px;
  border: 1px solid #ececec;
  border-radius: 8px;

  .dark & {
    border-color: #2a2a2a;
  }
}

.w-full {
  width: 100%;
}
</style>
