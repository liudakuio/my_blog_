<!-- 联系页：邮箱 + 社交平台卡片（微信/小红书/B站/500px/GitHub），悬浮显示提示 -->
<template>
  <div class="contact-page">
    <!-- 大标题 + 介绍语 -->
    <h1 class="contact-heading">{{ content.hello }}</h1>
    <p class="contact-intro">{{ content.intro }}</p>

    <!-- 社交平台卡片网格 -->
    <div class="social-grid">
      <!-- 邮箱卡片：不可点击，文字可选中复制 -->
      <div class="social-card social-card--email">
        <el-icon :size="48" class="social-icon"><Message /></el-icon>
        <h3 class="social-name">{{ content.emailMeLabel }}</h3>
        <p class="social-account social-account--selectable">{{ content.email }}</p>
      </div>

      <!-- 微信公众号卡片：hover 显示提示浮层 -->
      <div
        class="social-card social-card--wechat"
        @click="openLink('https://mp.weixin.qq.com/s/MD5T-BsAgUi9yUo6ISY1CA')"
        @mouseenter="showWechatTooltip = true"
        @mouseleave="showWechatTooltip = false"
      >
        <el-icon :size="48" class="social-icon"><ChatDotSquare /></el-icon>
        <h3 class="social-name">{{ appStore.language === 'zh' ? '公众号' : 'WeChat' }}</h3>
        <p class="social-account">{{ content.socials.wechat }}</p>
        <!-- 悬浮提示 -->
        <div v-if="showWechatTooltip" class="social-tooltip">
          <p class="social-tooltip-text">
            Click to view profile<br />
            <span class="social-tooltip-sub">mp.weixin.qq.com</span>
          </p>
        </div>
      </div>

      <!-- 小红书卡片：hover 显示提示浮层 -->
      <div
        class="social-card social-card--red"
        @click="openLink('https://www.xiaohongshu.com/user/profile/61bbb882000000001000e80d')"
        @mouseenter="showRedTooltip = true"
        @mouseleave="showRedTooltip = false"
      >
        <el-icon :size="48" class="social-icon"><Camera /></el-icon>
        <h3 class="social-name">{{ appStore.language === 'zh' ? '小红书' : 'RED' }}</h3>
        <p class="social-account">{{ content.socials.xiaohongshu }}</p>
        <div v-if="showRedTooltip" class="social-tooltip">
          <p class="social-tooltip-text">
            Click to view profile<br />
            <span class="social-tooltip-sub">xiaohongshu.com</span>
          </p>
        </div>
      </div>

      <!-- B站卡片：hover 显示提示浮层 -->
      <div
        class="social-card social-card--bili"
        @click="openLink('https://b23.tv/XNNX02Q')"
        @mouseenter="showBiliTooltip = true"
        @mouseleave="showBiliTooltip = false"
      >
        <el-icon :size="48" class="social-icon"><VideoCamera /></el-icon>
        <h3 class="social-name">Bilibili</h3>
        <p class="social-account">{{ content.socials.bilibili }}</p>
        <div v-if="showBiliTooltip" class="social-tooltip">
          <p class="social-tooltip-text">
            Click to view profile<br />
            <span class="social-tooltip-sub">b23.tv/XNNX02Q</span>
          </p>
        </div>
      </div>

      <!-- 500px 摄影社区卡片 -->
      <div
        class="social-card social-card--px"
        @click="openLink('https://500px.com.cn/LuN3cy')"
      >
        <el-icon :size="48" class="social-icon"><Camera /></el-icon>
        <h3 class="social-name">500px</h3>
        <p class="social-account">{{ content.socials.px500 }}</p>
      </div>

      <!-- GitHub 卡片 -->
      <div
        class="social-card social-card--github"
        @click="openLink('https://github.com/LuN3cy')"
      >
        <el-icon :size="48" class="social-icon"><Monitor /></el-icon>
        <h3 class="social-name">{{ content.githubLabel }}</h3>
        <p class="social-account">@LuN3cy</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Message, ChatDotSquare, Camera, VideoCamera, Monitor } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/app'
import { CONTACT_DATA } from '@/data/home'

const appStore = useAppStore()
// 联系方式内容数据
const content = computed(() => CONTACT_DATA[appStore.language])

// 各社交平台悬浮提示是否显示
const showWechatTooltip = ref(false)
const showRedTooltip = ref(false)
const showBiliTooltip = ref(false)

// 在新标签页打开链接
function openLink(link: string) {
  window.open(link, '_blank')
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

  &--red {
    cursor: pointer;

    &:hover {
      border-color: #ec4048;

      .social-icon {
        color: #ec4048;
      }
    }
  }

  &--bili {
    cursor: pointer;

    &:hover {
      border-color: #00aeec;

      .social-icon {
        color: #00aeec;
      }
    }
  }

  &--px {
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
