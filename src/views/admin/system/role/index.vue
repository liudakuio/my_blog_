<!--
  角色管理（/api/system/role，主键 roleId；含菜单分配 menuIds）
  数据来源：@/api/system 的 systemRoleList / Get / Create / Update / Delete。
  结构说明：列表 / 查询 / 多选 / 弹窗 / 提交 / 删除的通用骨架由 @/composables/useAdminCrud
    提供，本页只保留模板、表格列、搜索项、校验规则与差异配置（主键、回填、提交字段、菜单勾选回显）。
  引用关系：由 router/index.ts 的 SYSTEM_PAGES 注册（权限前缀 system: 的菜单）。
  注意：主键为 roleId；menuIds 用于绑定该角色可访问的菜单，为空表示不调整绑定。
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
import { computed, nextTick, onMounted, ref } from 'vue'
import { ArrowDown, ArrowUp, Delete, Edit, Plus, Refresh, Search } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/user'
import { useAdminCrud } from '@/composables/useAdminCrud'
import { systemEditPerm } from '@/config/permissions'
import {
  systemRoleList,
  systemRoleGet,
  systemRoleCreate,
  systemRoleUpdate,
  systemRoleDelete,
  systemMenuList
} from '@/api/system'
import type { SysMenuVo, SysRoleQuery, SysRoleSaveVo, SysRoleVo } from '@/api/system'
import type { TreeInstance } from 'element-plus'

const userStore = useUserStore()
const editable = computed(() => userStore.hasPerm(systemEditPerm('role')))

const STATUS_OPTIONS = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' }
]

/** 角色表单字段 */
type RoleForm = {
  roleKey: string
  roleName: string
  status: string
}

// ---------------- 菜单树（页面特有：用于分配菜单权限） ----------------
const menuTree = ref<SysMenuVo[]>([])
const treeRef = ref<TreeInstance>()

/** 拉取菜单树（供「上级菜单」下拉与勾选回显使用） */
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
  const checked = (tree.getCheckedKeys() ?? []) as number[]
  const half = (tree.getHalfCheckedKeys?.() ?? []) as number[]
  return Array.from(new Set([...checked, ...half]))
}

// 弹窗 destroy-on-close：需等树组件挂载、数据就绪后再回显勾选
async function setCheckedKeys(ids: number[]) {
  if (!menuTree.value.length) await loadMenuTree()
  await nextTick()
  await nextTick()
  treeRef.value?.setCheckedKeys(ids, false)
}

// CRUD 骨架由 composable 提供，本页只声明差异点：
// 主键 roleId、查询条件、默认表单、详情覆盖、提交字段（含菜单勾选）与删除文案。
const {
  list, loading, total, selection, showSearch, queryParams,
  dialogVisible, dialogTitle, saving, formRef, form,
  getList, handleQuery, resetQuery, handleSelectionChange,
  handleAdd, handleUpdate, cancel, submitForm, handleDelete
} = useAdminCrud<SysRoleVo, RoleForm, SysRoleQuery>({
  idField: 'roleId',
  fetchList: (params) => systemRoleList(params),
  fetchDetail: systemRoleGet,
  createFn: (payload) => systemRoleCreate(payload as SysRoleSaveVo),
  updateFn: (id, payload) => systemRoleUpdate(id, payload as SysRoleSaveVo),
  deleteFn: systemRoleDelete,
  defaultQuery: { roleKey: '', status: '' },
  createForm: () => ({ roleKey: '', roleName: '', status: '0' }),
  // 详情覆盖：字段缺失时保留行数据里的值
  applyDetail: (form, detail) => {
    Object.assign(form, {
      roleKey: detail.roleKey ?? form.roleKey,
      roleName: detail.roleName ?? form.roleName,
      status: detail.status ?? form.status
    })
  },
  // 提交字段：menuIds 取自菜单树的勾选结果
  buildPayload: (form) => ({
    roleKey: form.roleKey,
    roleName: form.roleName,
    status: form.status,
    menuIds: collectMenuIds()
  }),
  // 弹窗打开后回显菜单勾选：新增时清空，修改时按详情里的 menuIds 回显
  afterOpen: async ({ isEdit, detail }) => {
    await setCheckedKeys(isEdit ? (detail?.menuIds ?? []) : [])
  },
  titles: { add: '添加角色', edit: '修改角色' },
  deleteConfirmText: (rows, isBatch) => isBatch
    ? `确认删除选中的 ${rows.length} 条数据？`
    : `确认删除角色「${rows[0].roleName || rows[0].roleKey}」？`,
  logLabel: '角色'
})

const rules = {
  roleKey: [{ required: true, message: '请输入角色键', trigger: 'blur' }]
}

onMounted(getList)
</script>

<style lang="less" scoped>
/* 样式分区：
   1) .app-container  页面容器，纵向排列各区块
   2) .search-card    搜索卡片
   3) .table-card     表格卡片
   4) .toolbar       工具栏（左侧操作区 / 右侧统计与刷新）
   5) .icon-btn      圆形图标按钮
   6) .w-full        表单控件占满宽度 */
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
