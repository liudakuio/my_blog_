<!-- 菜单管理（/api/system/menu，主键 menuId；支持平铺/树形切换） -->
<template>
  <div class="ry-page">
    <!-- 搜索区：菜单页需额外提供 平铺/树形 切换，故自行渲染而非用 RySearchBar -->
    <div v-show="searchVisible" class="ry-card ry-search">
      <el-form :model="filters" inline>
        <el-form-item label="菜单名称">
          <el-input v-model="filters.menuName" placeholder="菜单名称" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="filters.menuType"
            placeholder="类型"
            clearable
            style="width: 180px"
          >
            <el-option v-for="o in MENU_TYPES" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="状态" clearable style="width: 180px">
            <el-option v-for="o in STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item class="ry-search-btns">
          <el-radio-group v-model="treeMode" size="default" @change="query">
            <el-radio-button :value="false">平铺</el-radio-button>
            <el-radio-button :value="true">树形</el-radio-button>
          </el-radio-group>
          <el-button type="primary" :icon="Search" @click="query">搜索</el-button>
          <el-button :icon="RefreshRight" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

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
          row-key="menuId"
          :tree-props="{ children: 'children' }"
          default-expand-all
          border
          stripe
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column prop="menuId" label="ID" width="80" align="center" />
          <el-table-column prop="menuName" label="菜单名称" min-width="160" show-overflow-tooltip />
          <el-table-column label="类型" width="90" align="center">
            <template #default="{ row }">
              <el-tag effect="light" size="small" disable-transitions>
                {{ menuTypeLabel(row.menuType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="orderNum" label="排序" width="80" align="center" />
          <el-table-column prop="path" label="路径" width="140" show-overflow-tooltip />
          <el-table-column prop="component" label="组件" width="180" show-overflow-tooltip />
          <el-table-column prop="perms" label="权限标识" width="160" show-overflow-tooltip />
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <RyStatusTag :value="row.status" />
            </template>
          </el-table-column>
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
      width="600px"
      @confirm="submit"
    >
      <el-form ref="formRef" :model="formData" label-width="100px" :rules="rules">
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
            <el-option v-for="o in STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
      </el-form>
    </RyFormDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Delete, Edit, RefreshRight, Search } from '@element-plus/icons-vue'
import RyToolbar from '../../shared/RyToolbar.vue'
import RyFormDialog from '../../shared/RyFormDialog.vue'
import RyStatusTag from '../../shared/RyStatusTag.vue'
import { useResourceCrud } from '../../shared/useResourceCrud'
import { STATUS_OPTIONS } from '../../shared/types'
import {
  systemMenuList,
  systemMenuGet,
  systemMenuCreate,
  systemMenuUpdate,
  systemMenuDelete
} from '@/api/system'

const MENU_TYPES = [
  { label: '目录', value: 'M' },
  { label: '菜单', value: 'C' },
  { label: '按钮', value: 'F' }
]

function menuTypeLabel(t?: string) {
  return MENU_TYPES.find((o) => o.value === t)?.label ?? t ?? ''
}

const searchVisible = ref(true)
// 列表展示模式：平铺 / 树形
const treeMode = ref(false)

const rules = {
  menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }]
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
  resource: 'menu',
  title: '菜单',
  perm: 'system:menu:edit',
  idKey: 'menuId',
  api: {
    list: systemMenuList,
    get: systemMenuGet,
    create: systemMenuCreate,
    update: systemMenuUpdate,
    remove: systemMenuDelete
  },
  defaultFilters: { menuName: '', menuType: '', status: '' },
  defaultForm: {
    parentId: 0,
    menuName: '',
    menuType: 'C',
    orderNum: 0,
    path: '',
    component: '',
    icon: '',
    perms: '',
    status: '0'
  },
  extraParams: () => ({ tree: treeMode.value })
})

onMounted(() => {
  loadMenuTree()
  query()
})
</script>

<style lang="less" scoped>
.w-full {
  width: 100%;
}
</style>
