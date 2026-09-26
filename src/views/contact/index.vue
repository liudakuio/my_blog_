<!-- 联系页：邮箱 + 社交平台卡片（微信/小红书/B站/500px/GitHub），悬浮显示提示 -->
<template>
  <div class="contact-page">
    <!-- 大标题 + 介绍语 -->
    <h1 class="contact-heading">{{ content.hello }}</h1>
    <p class="contact-intro">{{ content.intro }}</p>

    <!-- 社交平台卡片网格：由 /api/site/config 的 contact.socials 驱动 -->
    <div class="social-grid">
      <div
        v-for="item in socials"
        :key="item.key"
        class="social-card"
        :class="`social-card--${item.key}`"
        @click="openLink(item)"
        @mouseenter="hoverKey = item.key"
        @mouseleave="hoverKey = ''"
      >
        <el-icon :size="48" class="social-icon">
          <Message v-if="item.icon === 'message'" />
          <ChatDotSquare v-else-if="item.icon === 'chat'" />
          <VideoCamera v-else-if="item.icon === 'video-camera'" />
          <Monitor v-else-if="item.icon === 'monitor'" />
          <Camera v-else />
        </el-icon>
        <h3 class="social-name">{{ item.name }}</h3>
        <p class="social-account" :class="{ 'social-account--selectable': !item.clickable }">
          {{ item.account }}
        </p>
        <!-- 悬浮提示：接口下发 tooltip 时才显示 -->
        <div v-if="item.tooltip && hoverKey === item.key" class="social-tooltip">
          <p class="social-tooltip-text">
            {{ item.tooltip.text }}<br />
            <span class="social-tooltip-sub">{{ item.tooltip.domain }}</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Message, ChatDotSquare, Camera, VideoCamera, Monitor } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/app'
import { useSiteStore } from '@/store/site'
import { pickText } from '@/utils/i18n'

const appStore = useAppStore()
const siteStore = useSiteStore()

// 当前 hover 的社交卡片（用于显示悬浮提示）
const hoverKey = ref('')

// 联系页文案：来自 /api/site/config 的 contact 节点
const content = computed(() => {
  const contact = siteStore.contact
  const lang = appStore.language
  return {
    hello: pickText(contact?.hello, lang),
    intro: pickText(contact?.intro, lang),
    email: contact?.email ?? '',
    emailMeLabel: pickText(contact?.emailLabel, lang)
  }
})

// 社交平台卡片：顺序、文案、链接、是否可点、悬浮提示均由接口决定
const socials = computed(() =>
  (siteStore.contact?.socials ?? []).map(item => ({
    key: item.key,
    name: pickText(item.name, appStore.language, item.key),
    account: item.account,
    url: item.url,
    icon: item.icon,
    clickable: item.clickable !== false,
    tooltip: item.tooltip
  }))
)

// 在新标签页打开链接（不可点或空链接时忽略）
function openLink(item: { url: string; clickable: boolean }) {
  if (!item.clickable || !item.url) return
  window.open(item.url, '_blank')
}
</script>

<style lang="less" scoped>
.contact-page {
  width: 100%;
  max-width: 64rem;
  margin: 0 auto;
  padding: 2rem 1rem 0;
  text-align: center;
}

.contact-heading {
  margin: 0 0 3rem;
  font-size: 12vw;
  font-weight: 900;
  line-height: 1;
  color: #000000;
  transition: color 0.3s;

  .dark & {
    color: #ffffff;
  }
}

.contact-intro {
  max-width: 48rem;
  margin: 0 auto 5rem;
  font-size: 1.875rem;
  font-weight: 500;
  line-height: 1.625;
  color: #6b7280;
  transition: color 0.3s;

  .dark & {
    color: #9ca3af;
  }
}

.social-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 社交平台卡片 */
.social-card {
  position: relative;
  display: block;
  padding: 3rem;
  border: 2px solid #f3f4f6;
  border-radius: 2rem;
  transition: border-color 0.3s;

  .dark & {
    border-color: #1f2937;
  }

  &:hover {
    .social-icon {
      color: inherit;
    }
  }

  &--email {
    cursor: default;

    &:hover {
      border-color: #f97316;

      .social-icon {
        color: #f97316;
      }
    }
  }

  &--wechat {
    cursor: pointer;

    &:hover {
      border-color: #07c160;

      .social-icon {
        color: #07c160;
      }
    }
  }

  &--red,
  &--xiaohongshu {
    cursor: pointer;

    &:hover {
      border-color: #ec4048;

      .social-icon {
        color: #ec4048;
      }
    }
  }

  &--bili,
  &--bilibili {
    cursor: pointer;

    &:hover {
      border-color: #00aeec;

      .social-icon {
        color: #00aeec;
      }
    }
  }

  &--px,
  &--px500 {
    cursor: pointer;

    &:hover {
      border-color: #000000;

      .social-icon {
        color: #000000;
      }
    }

    .dark &:hover {
      border-color: #ffffff;

      .social-icon {
        color: #ffffff;
      }
    }
  }

  &--github {
    cursor: pointer;

    &:hover {
      border-color: #000000;

      .social-icon {
        color: #000000;
      }
    }

    .dark &:hover {
      border-color: #ffffff;

      .social-icon {
        color: #ffffff;
      }
    }
  }
}

.social-icon {
  display: block;
  margin: 0 auto 1.5rem;
  color: #9ca3af;
  transition: color 0.3s;
}

.social-name {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #000000;
  transition: color 0.3s;

  .dark & {
    color: #ffffff;
  }
}

.social-account {
  margin: 0;
  font-size: 1.125rem;
  opacity: 0.7;
  color: #6b7280;
  transition: color 0.3s;

  .dark & {
    color: #9ca3af;
  }

  &--selectable {
    -webkit-user-select: text;
    user-select: text;
  }
}

.social-tooltip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16rem;
  height: 8rem;
  overflow: hidden;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  -webkit-backdrop-filter: blur(24px);
  backdrop-filter: blur(24px);
  pointer-events: none;

  .dark & {
    background: rgba(0, 0, 0, 0.6);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

.social-tooltip-text {
  margin: 0;
  padding: 0 1rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 700;
  opacity: 0.8;
  color: #000000;

  .dark & {
    color: #ffffff;
  }
}

.social-tooltip-sub {
  font-family: monospace;
  font-size: 0.75rem;
  opacity: 0.5;
}
</style>
