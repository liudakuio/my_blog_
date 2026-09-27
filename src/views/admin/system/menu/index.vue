<!-- 菜单管理：GET/POST/PUT/DELETE /api/system/menu（支持 tree=true 树形） -->
<template>
  <div class="sys-page">
    <div class="page-head">
      <h2 class="page-title">菜单管理</h2>
      <p class="page-desc">后台菜单与权限标识（共 {{ list.length }} 条）</p>
    </div>

    <div class="toolbar">
      <div class="filters">
        <el-input
          v-model="filters.menuName"
          placeholder="菜单名称"
          size="default"
          clearable
          class="filter-input"
        />
        <el-select v-model="filters.menuType" placeholder="类型" clearable class="filter-input">
          <el-option v-for="o in MENU_TYPES" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
        <el-select v-model="filters.status" placeholder="状态" clearable class="filter-input">
          <el-option v-for="o in STATUS" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
        <el-radio-group v-model="treeMode" size="default" @change="load">
          <el-radio-button :value="false">平铺</el-radio-button>
          <el-radio-button :value="true">树形</el-radio-button>
        </el-radio-group>
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

    <el-table
      v-loading="loading"
      :data="list"
      row-key="menuId"
      :tree-props="{ children: 'children' }"
      default-expand-all
      border
      stripe
      class="grid"
    >
      <el-table-column prop="menuId" label="ID" width="80" />
      <el-table-column prop="menuName" label="菜单名称" />
      <el-table-column prop="menuType" label="类型" width="90">
        <template #default="{ row }">
          <el-tag effect="plain" size="small">{{ menuTypeLabel(row.menuType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="orderNum" label="排序" width="80" />
      <el-table-column prop="path" label="路径" width="140" />
      <el-table-column prop="component" label="组件" width="180" show-overflow-tooltip />
      <el-table-column prop="perms" label="权限标识" width="160" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === '0' ? 'success' : 'info'" effect="plain" size="small">
            {{ row.status === '0' ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="editable" label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button text type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" destroy-on-close>
      <el-form ref="formRef" :model="formData" label-width="100px" :rules="formRules">
        <el-form-item label="上级菜单" prop="parentId">
          <el-select v-model="formData.parentId" class="w-full" placeholder="顶级菜单">
            <el-option v-for="o in parentOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="formData.menuName" placeholder="菜单名称" />
        </el-form-item>
        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="formData.menuType">
            <el-radio v-for="o in MENU_TYPES" :key="o.value" :value="o.value">{{ o.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="显示排序" prop="orderNum">
          <el-input-number v-model="formData.orderNum" :controls="false" class="w-full" />
        </el-form-item>
        <el-form-item label="路由路径" prop="path">
          <el-input v-model="formData.path" placeholder="如 user" />
        </el-form-item>
        <el-form-item label="组件路径" prop="component">
          <el-input v-model="formData.component" placeholder="如 blog/system/user" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="formData.icon" placeholder="如 el-icon-user" />
        </el-form-item>
        <el-form-item label="权限标识" prop="perms">
          <el-input v-model="formData.perms" placeholder="如 system:user:edit" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" class="w-full">
            <el-option v-for="o in STATUS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import {
  systemMenuList,
  systemMenuGet,
  systemMenuCreate,
  systemMenuUpdate,
  systemMenuDelete,
  type SysMenuSaveVo
} from '@/api/system'

const userStore = useUserStore()
const editable = computed(() => userStore.hasPerm('system:menu:edit'))

const STATUS = [
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

const list = ref<any[]>([])
const loading = ref(false)
const treeMode = ref(false)
const filters = reactive<{ menuName: string; menuType: string; status: string }>({
  menuName: '',
  menuType: '',
  status: ''
})

async function load() {
  loading.value = true
  try {
    const params: Record<string, any> = { tree: treeMode.value }
    if (filters.menuName) params.menuName = filters.menuName
    if (filters.menuType) params.menuType = filters.menuType
    if (filters.status) params.status = filters.status
    const data = await systemMenuList(params)
    list.value = Array.isArray(data) ? data : []
  } catch (e) {
    list.value = []
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.menuName = ''
  filters.menuType = ''
  filters.status = ''
  load()
}

// 上级菜单下拉：始终拉全量树形
const menuTree = ref<any[]>([])
async function loadMenuTree() {
  try {
    const data = await systemMenuList({ tree: true })
    menuTree.value = Array.isArray(data) ? data : []
  } catch (e) {
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
const formRef = ref()
const editingId = ref<number | string | null>(null)
const formData = reactive<Record<string, any>>({
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

const formRules = {
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }]
}

function openAdd() {
  editingId.value = null
  dialogTitle.value = '新增菜单'
  formData.parentId = 0
  formData.menuName = ''
  formData.menuType = 'C'
  formData.orderNum = 0
  formData.path = ''
  formData.component = ''
  formData.icon = ''
  formData.perms = ''
  formData.status = '0'
  dialogVisible.value = true
}

async function openEdit(row: any) {
  editingId.value = row.menuId
  dialogTitle.value = '编辑菜单'
  try {
    const detail: any = await systemMenuGet(row.menuId)
    fillForm(detail ?? row)
  } catch (e) {
    fillForm(row)
  }
  dialogVisible.value = true
}

function fillForm(src: any) {
  formData.parentId = src.parentId ?? 0
  formData.menuName = src.menuName ?? ''
  formData.menuType = src.menuType ?? 'C'
  formData.orderNum = src.orderNum ?? 0
  formData.path = src.path ?? ''
  formData.component = src.component ?? ''
  formData.icon = src.icon ?? ''
  formData.perms = src.perms ?? ''
  formData.status = src.status ?? '0'
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload: SysMenuSaveVo = {
      parentId: formData.parentId,
      menuName: formData.menuName,
      menuType: formData.menuType,
      orderNum: formData.orderNum,
      path: formData.path,
      component: formData.component,
      icon: formData.icon,
      perms: formData.perms,
      status: formData.status
    }
    if (editingId.value !== null) {
      await systemMenuUpdate(editingId.value, payload)
      ElMessage.success('已更新')
    } else {
      await systemMenuCreate(payload)
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    await Promise.all([load(), loadMenuTree()])
  } catch (e) {
    // 校验失败等由拦截器统一提示
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确认删除菜单「${row.menuName}」？`, '提示', { type: 'warning' })
  } catch (e) {
    return
  }
  try {
    await systemMenuDelete(row.menuId)
    ElMessage.success('已删除')
    await Promise.all([load(), loadMenuTree()])
  } catch (e) {
    // 存在子菜单时后端返回 400，由拦截器统一提示
  }
}

onMounted(async () => {
  await loadMenuTree()
  load()
})
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

.w-full {
  width: 100%;
}
</style>
