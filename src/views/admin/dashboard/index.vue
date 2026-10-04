<!--
  仪表盘：欢迎语 + 内容统计卡片 + 快捷入口
  数据来源：统计与快捷入口所需数据走 @/api/admin 的 adminList；不依赖站点配置接口。
  引用关系：由 router 后台路由 /admin/dashboard 直接注册（非动态菜单）。
-->
<template>
  <div class="dashboard">
    <!-- 欢迎横幅 -->
    <section class="welcome">
      <div>
        <h2 class="greeting">{{ greeting }}，{{ username }}</h2>
        <p class="date">{{ today }}</p>
      </div>
      <div class="welcome-badge">内容运营控制台</div>
    </section>

    <!-- 统计卡片 -->
    <section class="stats-grid">
      <div v-for="s in stats" :key="s.resource" class="stat-card" @click="go(s.path)">
        <div class="stat-icon"><el-icon><component :is="s.icon" /></el-icon></div>
        <div class="stat-body">
          <div class="stat-value">{{ s.loading ? '—' : s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>
    </section>

    <!-- 快捷入口 -->
    <section class="panel">
      <h3 class="panel-title">快捷入口</h3>
      <div class="quick-grid">
        <div v-for="q in quickLinks" :key="q.path" class="quick-item" @click="go(q.path)">
          <el-icon class="quick-icon"><component :is="q.icon" /></el-icon>
          <span>{{ q.label }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import dayjs from 'dayjs'
import { useUserStore } from '@/store/user'
import { adminList } from '@/api/admin'
import { Document, Files, Collection } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const { username } = storeToRefs(userStore)

const hour = new Date().getHours()
const greeting = computed(() =>
  hour < 6 ? '夜深了' : hour < 12 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好'
)
const today = dayjs().format('YYYY 年 MM 月 DD 日 dddd')

interface Stat {
  resource: string
  label: string
  icon: any
  path: string
  value: number
  loading: boolean
}
const stats = ref<Stat[]>([
  { resource: 'article', label: '文章', icon: Document, path: '/admin/article/list', value: 0, loading: true },
  { resource: 'project', label: '作品', icon: Files, path: '/admin/project/list', value: 0, loading: true },
  { resource: 'article_category', label: '文章分类', icon: Collection, path: '/admin/article/category', value: 0, loading: true },
  { resource: 'project_category', label: '作品分类', icon: Collection, path: '/admin/project/category', value: 0, loading: true }
])

const quickLinks = [
  { label: '文章列表', icon: Document, path: '/admin/article/list' },
  { label: '作品列表', icon: Files, path: '/admin/project/list' }
]

function go(path: string) {
  router.push(path)
}

onMounted(async () => {
  await Promise.all(
    stats.value.map(async (s) => {
      try {
        const list = await adminList(s.resource)
        s.value = Array.isArray(list) ? list.length : 0
      } catch (e) {
        s.value = 0
      } finally {
        s.loading = false
      }
    })
  )
})
</script>

<style lang="less" scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.welcome {
  background: #ffffff;
  border: 1px solid #ececec;
  border-radius: 16px;
  padding: 24px 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .dark & {
    background: #141414;
    border-color: #2a2a2a;
  }
}

.greeting {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1a1a1a;

  .dark & {
    color: #f0f0f0;
  }
}

.date {
  margin: 6px 0 0;
  font-size: 13px;
  color: #9ca3af;
}

.welcome-badge {
  font-size: 12px;
  letter-spacing: 0.1em;
  color: #6b7280;
  border: 1px solid #e5e5e5;
  border-radius: 20px;
  padding: 6px 14px;

  .dark & {
    border-color: #2a2a2a;
    color: #b5b5b5;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.stat-card {
  background: #ffffff;
  border: 1px solid #ececec;
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.07);
    border-color: #d4d4d4;
  }

  .dark & {
    background: #141414;
    border-color: #2a2a2a;

    &:hover {
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
      border-color: #3a3a3a;
    }
  }
}

.stat-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: #1a1a1a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;

  .dark & {
    background: #fff;
    color: #141414;
  }
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.1;

  .dark & {
    color: #f0f0f0;
  }
}

.stat-label {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 2px;
}

.panel {
  background: #ffffff;
  border: 1px solid #ececec;
  border-radius: 16px;
  padding: 22px 26px;

  .dark & {
    background: #141414;
    border-color: #2a2a2a;
  }
}

.panel-title {
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;

  .dark & {
    color: #f0f0f0;
  }
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 14px;
}

.quick-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid #ececec;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  color: #4b4b4b;
  transition: background 0.18s, color 0.18s, border-color 0.18s;

  &:hover {
    border-color: #1a1a1a;
    color: #1a1a1a;
  }

  .dark & {
    border-color: #2a2a2a;
    color: #b5b5b5;

    &:hover {
      border-color: #fff;
      color: #fff;
    }
  }
}

.quick-icon {
  font-size: 18px;
}
</style>
