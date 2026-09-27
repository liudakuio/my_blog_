<!-- 角色管理：GET/POST/PUT/DELETE /api/system/role（含菜单分配 menuIds） -->
<template>
  <div class="sys-page">
    <div class="page-head">
      <h2 class="page-title">角色管理</h2>
      <p class="page-desc">角色与可访问菜单（共 {{ list.length }} 条）</p>
    </div>

    <div class="toolbar">
      <div class="filters">
        <el-input
          v-model="filters.roleKey"
          placeholder="角色键"
          size="default"
          clearable
          class="filter-input"
        />
        <el-select v-model="filters.status" placeholder="状态" clearable class="filter-input">
          <el-option v-for="o in STATUS" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
        <el-button @click="load">查询</el-button>
        <el-button text @click="resetFilters">重置</el-button>
      </div>
      <div class="actions">
        <el-button v-if="editable" type="primary" @click="openAdd">
          <el-icon><Plus /></el-icon> 新增
        </el-button>
        <el-button @click="load"><el-icon><Refresh /></el-icon> 刷新</el-button>
      </div>
    </div>

    <el-table v-loading="loading" :data="list" border stripe class="grid">
      <el-table-column prop="roleId" label="ID" width="80" />
      <el-table-column prop="roleKey" label="角色键" />
      <el-table-column prop="roleName" label="角色名称" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === '0' ? 'success' : 'info'" effect="plain" size="small">
            {{ row.status === '0' ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column v-if="editable" label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button text type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px" destroy-on-close>
      <el-form ref="formRef" :model="formData" label-width="90px" :rules="formRules">
        <el-form-item label="角色键" prop="roleKey">
          <el-input v-model="formData.roleKey" placeholder="英文唯一标识，如 admin" />
        </el-form-item>
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="formData.roleName" placeholder="显示名称" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" class="w-full">
            <el-option v-for="o in STATUS" :key="o.value" :label="o.label" :value="o.value" />
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
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import {
  systemRoleList,
  systemRoleGet,
  systemRoleCreate,
  systemRoleUpdate,
  systemRoleDelete,
  systemMenuList,
  type SysRoleSaveVo
} from '@/api/system'

const userStore = useUserStore()
const editable = computed(() => userStore.hasPerm('system:role:edit'))

const STATUS = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' }
]

const list = ref<any[]>([])
const loading = ref(false)
const filters = reactive<{ roleKey: string; status: string }>({ roleKey: '', status: '' })

// 菜单树（用于分配菜单）
const menuTree = ref<any[]>([])
const treeRef = ref<any>(null)

async function load() {
  loading.value = true
  try {
    const params: Record<string, any> = {}
    if (filters.roleKey) params.roleKey = filters.roleKey
    if (filters.status) params.status = filters.status
    const data = await systemRoleList(params)
    list.value = Array.isArray(data) ? data : []
  } catch (e) {
    list.value = []
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.roleKey = ''
  filters.status = ''
  load()
}

async function loadMenuTree() {
  try {
    const data = await systemMenuList({ tree: true })
    menuTree.value = Array.isArray(data) ? data : []
  } catch (e) {
    menuTree.value = []
  }
}

// ---------------- 弹窗表单 ----------------
const dialogVisible = ref(false)
const dialogTitle = ref('')
const saving = ref(false)
const formRef = ref()
const editingId = ref<number | string | null>(null)
const formData = reactive({ roleKey: '', roleName: '', status: '0' })

const formRules = {
  roleKey: [{ required: true, message: '请输入角色键', trigger: 'blur' }]
}

async function openAdd() {
  editingId.value = null
  dialogTitle.value = '新增角色'
  formData.roleKey = ''
  formData.roleName = ''
  formData.status = '0'
  dialogVisible.value = true
  // 弹窗 destroy-on-close：需等树组件挂载、数据就绪后再回显勾选
  await nextTick()
  await ensureMenuTree()
  await nextTick()
  treeRef.value?.setCheckedKeys([], false)
}

async function openEdit(row: any) {
  editingId.value = row.roleId
  dialogTitle.value = '编辑角色'
  let menuIds: number[] = []
  try {
    const detail: any = await systemRoleGet(row.roleId)
    formData.roleKey = detail?.roleKey ?? row.roleKey ?? ''
    formData.roleName = detail?.roleName ?? row.roleName ?? ''
    formData.status = detail?.status ?? row.status ?? '0'
    menuIds = detail?.menuIds ?? []
  } catch (e) {
    // 详情失败则用行数据兜底
    formData.roleKey = row.roleKey ?? ''
    formData.roleName = row.roleName ?? ''
    formData.status = row.status ?? '0'
  }
  dialogVisible.value = true
  // 弹窗 destroy-on-close：需等树组件挂载、数据就绪后再回显勾选
  await nextTick()
  await ensureMenuTree()
  await nextTick()
  treeRef.value?.setCheckedKeys(menuIds, false)
}

// 弹窗打开后再渲染树，确保 setCheckedKeys 能作用到节点
async function ensureMenuTree() {
  if (!menuTree.value.length) await loadMenuTree()
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload: SysRoleSaveVo = {
      roleKey: formData.roleKey,
      roleName: formData.roleName,
      status: formData.status,
      // 菜单勾选结果（半选父节点一并提交，保证父目录可展开）
      menuIds: collectMenuIds()
    }
    if (editingId.value !== null) {
      await systemRoleUpdate(editingId.value, payload)
      ElMessage.success('已更新')
    } else {
      await systemRoleCreate(payload)
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    load()
  } catch (e) {
    // roleKey 重复、内置角色不可删等由拦截器统一提示
  } finally {
    saving.value = false
  }
}

function collectMenuIds(): number[] {
  const tree = treeRef.value
  if (!tree) return []
  const checked: number[] = tree.getCheckedKeys() ?? []
  const half: number[] = tree.getHalfCheckedKeys?.() ?? []
  return Array.from(new Set([...checked, ...half]))
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除角色「${row.roleName || row.roleKey}」？`, '提示', {
      type: 'warning'
    })
  } catch (e) {
    return
  }
  try {
    await systemRoleDelete(row.roleId)
    ElMessage.success('已删除')
    load()
  } catch (e) {
    // 内置 admin 角色不可删，由拦截器统一提示
  }
}

onMounted(load)
</script>

<style lang="less" scoped>
.sys-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-head {
  .page-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;

    .dark & {
      color: #f0f0f0;
    }
  }
  .page-desc {
    margin: 4px 0 0;
    font-size: 13px;
    color: #9ca3af;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 14px;
  padding: 14px 16px;

  .dark & {
    background: #141414;
    border-color: #2a2a2a;
  }
}

.filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-input {
  width: 160px;
}

.actions {
  display: flex;
  gap: 10px;
}

.grid {
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #ececec;

  .dark & {
    background: #141414;
    border-color: #2a2a2a;
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
