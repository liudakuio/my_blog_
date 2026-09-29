<!-- 角色管理（/api/system/role，主键 roleId；含菜单分配 menuIds） -->
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
          row-key="roleId"
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="roleId" label="ID" width="80" align="center" />
          <el-table-column prop="roleKey" label="角色键" min-width="160" show-overflow-tooltip />
          <el-table-column prop="roleName" label="角色名称" min-width="160" show-overflow-tooltip />
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <RyStatusTag :value="row.status" />
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" show-overflow-tooltip />
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
      width="640px"
      @confirm="submit"
    >
      <el-form ref="formRef" :model="formData" label-width="90px" :rules="rules">
        <el-form-item label="角色键" prop="roleKey">
          <el-input v-model="formData.roleKey" placeholder="英文唯一标识，如 admin" />
        </el-form-item>
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="formData.roleName" placeholder="显示名称" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" class="w-full">
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
    </RyFormDialog>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { Delete, Edit } from '@element-plus/icons-vue'
import RySearchBar from '../../shared/RySearchBar.vue'
import RyToolbar from '../../shared/RyToolbar.vue'
import RyFormDialog from '../../shared/RyFormDialog.vue'
import RyStatusTag from '../../shared/RyStatusTag.vue'
import { useResourceCrud } from '../../shared/useResourceCrud'
import { STATUS_OPTIONS, type RySearchField } from '../../shared/types'
import {
  systemRoleList,
  systemRoleGet,
  systemRoleCreate,
  systemRoleUpdate,
  systemRoleDelete,
  systemMenuList
} from '@/api/system'

const searchVisible = ref(true)

const searchFields: RySearchField[] = [
  { key: 'roleKey', label: '角色键' },
  { key: 'status', label: '状态', type: 'select', options: STATUS_OPTIONS }
]

const rules = {
  roleKey: [{ required: true, message: '请输入角色键', trigger: 'blur' }]
}

// 菜单树（用于分配菜单）
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

const {
  list,
  loading,
  filters,
  selection,
  editable,
  total,
  dialogVisible,
  dialogTitle,
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
  resource: 'role',
  title: '角色',
  perm: 'system:role:edit',
  idKey: 'roleId',
  api: {
    list: systemRoleList,
    get: systemRoleGet,
    create: systemRoleCreate,
    update: systemRoleUpdate,
    remove: systemRoleDelete
  },
  defaultFilters: { roleKey: '', status: '' },
  defaultForm: { roleKey: '', roleName: '', status: '0' },
  // 弹窗 destroy-on-close：需等树挂载、数据就绪后再回显勾选
  async afterOpen({ detail }: { detail: any }) {
    if (!menuTree.value.length) await loadMenuTree()
    await nextTick()
    await nextTick()
    treeRef.value?.setCheckedKeys(detail?.menuIds ?? [], false)
  },
  beforeSubmit(payload: Record<string, any>) {
    payload.menuIds = collectMenuIds()
    return payload
  }
})

onMounted(query)
</script>

<style lang="less" scoped>
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
