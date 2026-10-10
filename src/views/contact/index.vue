<!--
  联系页：邮箱 + 社交平台卡片（微信 / Gitee），支持一键复制
  数据来源：全部文案与社交账号来自本文件 CONTACT_DATA（本地写死），无接口请求。
  注意：要改联系方式直接改 CONTACT_DATA 的 zh / en 两个语言版本。
  样式：统一消费 src/styles/tokens.css 的语义令牌，不出现硬编码色值。
-->
<template>
  <div class="contact-page u-container">
    <!-- 页眉区 -->
    <header class="contact-head">
      <p class="contact-eyebrow">
        <span class="eyebrow-dot"></span>{{ content.contactLabel }}
      </p>
      <h1 class="contact-heading">
        {{ helloParts.main }}<span class="hello-mark">{{ helloParts.tail }}</span>
      </h1>
      <p class="contact-intro">{{ content.intro }}</p>
      <div class="contact-meta">
        <span>{{ content.baseLabel }}</span>
        <span class="meta-sep">/</span>
        <span>{{ content.locationValue }}</span>
        <span class="meta-sep">/</span>
        <span class="meta-live">
          <i class="live-dot"></i>{{ appStore.language === 'zh' ? '可接洽' : 'AVAILABLE' }}
        </span>
      </div>
    </header>

    <!-- 主联系：邮箱大块 -->
    <section class="mail-block">
      <div class="mail-block__label">{{ content.emailMeLabel }}</div>
      <a class="mail-block__value" :href="`mailto:${content.email}`">{{ content.email }}</a>
      <div class="mail-block__actions">
        <button class="ct-btn" type="button" @click="copyMail">
          {{ copied ? (appStore.language === 'zh' ? '已复制' : 'COPIED') : (appStore.language === 'zh' ? '复制' : 'COPY') }}
        </button>
        <a class="ct-btn ct-btn--solid" :href="`mailto:${content.email}`">
          {{ appStore.language === 'zh' ? '发邮件' : 'SEND' }} →
        </a>
      </div>
    </section>

    <!-- 社交平台卡片网格 -->
    <div class="social-grid">
      <!-- 01 微信：点击复制微信号 -->
      <button
        class="social-card"
        type="button"
        style="animation-delay: 0.06s"
        @click="copyWechat"
      >
        <span class="social-index">01</span>
        <el-icon :size="30" class="social-icon"><ChatDotSquare /></el-icon>
        <h3 class="social-name">{{ appStore.language === 'zh' ? '微信' : 'WeChat' }}</h3>
        <p class="social-account">{{ content.socials.wechat }}</p>
        <span class="social-action">
          {{ wechatCopied ? (appStore.language === 'zh' ? '已复制 ✓' : 'COPIED ✓') : (appStore.language === 'zh' ? '点击复制' : 'COPY') }}
        </span>
      </button>

      <!-- 02 邮箱：文字可选中复制 -->
      <div class="social-card" style="animation-delay: 0.14s">
        <span class="social-index">02</span>
        <el-icon :size="30" class="social-icon"><Message /></el-icon>
        <h3 class="social-name">{{ content.emailMeLabel }}</h3>
        <p class="social-account social-account--selectable">{{ content.email }}</p>
        <span class="social-action">{{ appStore.language === 'zh' ? '长按可选中' : 'SELECTABLE' }}</span>
      </div>

      <!-- 03 Gitee：跳转主页 -->
      <button
        class="social-card"
        type="button"
        style="animation-delay: 0.22s"
        @click="openLink('https://gitee.com/liuminglzk')"
      >
        <span class="social-index">03</span>
        <el-icon :size="30" class="social-icon"><Monitor /></el-icon>
        <h3 class="social-name">{{ content.githubLabel }}</h3>
        <p class="social-account">@liuminglzk</p>
        <span class="social-action">{{ appStore.language === 'zh' ? '前往 →' : 'VISIT →' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Message, ChatDotSquare, Monitor } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/app'
import type { Language } from '@/types'

interface SocialLinks {
  wechat: string
  xiaohongshu: string
  bilibili: string
  px500: string
}

interface ContactContent {
  baseLabel: string
  locationValue: string
  contactLabel: string
  emailMeLabel: string
  email: string
  hello: string
  intro: string
  socials: SocialLinks
  tooltip?: string
  githubLabel: string
}

const CONTACT_DATA: Record<Language, ContactContent> = {
  zh: {
    baseLabel: 'BASE', locationValue: '河南 郑州', contactLabel: '取得联系', emailMeLabel: '邮箱',
    email: 'liudakuio@gmail.com', hello: '你好 :-)', intro: '欢迎探讨与合作。',
    socials: { wechat: 'vv8886666999', xiaohongshu: 'YourID', bilibili: 'YourID', px500: 'YourID' },
    githubLabel: 'Gitee'
  },
  en: {
    baseLabel: 'BASE', locationValue: 'HENAN ZHENGZHOU', contactLabel: 'Get in touch', emailMeLabel: 'Email Me',
    email: '1365693530@qq.com', hello: 'Hello :-)', intro: 'Welcome to discuss & cooperate.',
    socials: { wechat: 'YourWeChatID', xiaohongshu: 'YourID', bilibili: 'YourID', px500: 'YourID' },
    githubLabel: 'Gitee'
  }
}

const appStore = useAppStore()
// 联系方式内容数据
const content = computed(() => CONTACT_DATA[appStore.language])

// 把标题里的 ":-)" 拆出来单独上色
const helloParts = computed(() => {
  const text = content.value.hello
  const idx = text.indexOf(':-)')
  if (idx < 0) return { main: text, tail: '' }
  return { main: text.slice(0, idx), tail: text.slice(idx) }
})

const copied = ref(false)
const wechatCopied = ref(false)

// 在新标签页打开链接
function openLink(link: string) {
  window.open(link, '_blank')
}

// 复制文本：优先 Clipboard API，失败回落 textarea + execCommand
async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* 继续走回落方案 */
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

function flash(flag: 'copied' | 'wechatCopied') {
  const target = flag === 'copied' ? copied : wechatCopied
  target.value = true
  setTimeout(() => { target.value = false }, 1600)
}

async function copyMail() {
  if (await writeClipboard(content.value.email)) flash('copied')
}

async function copyWechat() {
  if (await writeClipboard(content.value.socials.wechat)) flash('wechatCopied')
}
</script>

<style lang="less" scoped>
.contact-page {
  padding-top: 1rem;
  padding-bottom: 4rem;
}

/* ── 页眉 ─────────────────────────────── */
.contact-head {
  padding-bottom: 2.5rem;
  border-bottom: 2px solid var(--fg);
  animation: fadeUp 0.7s var(--ease-out) both;
}

.contact-eyebrow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--fg-muted);
}

.eyebrow-dot {
  width: 7px;
  height: 7px;
  background: var(--accent);
}

.contact-heading {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(3.5rem, 13vw, 9rem);
  font-weight: 900;
  line-height: 0.92;
  letter-spacing: -0.045em;
  color: var(--fg);
}

.hello-mark {
  color: var(--accent);
  transition: color var(--dur) var(--ease-out);
}

.contact-intro {
  max-width: 40rem;
  margin: 1.75rem 0 0;
  font-size: clamp(1rem, 2.2vw, 1.375rem);
  font-weight: 500;
  line-height: 1.6;
  color: var(--fg-muted);
}

.contact-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  margin-top: 1.5rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--fg-faint);
}

.meta-sep {
  color: var(--border);
}

.meta-live {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--accent-text);
}

.live-dot {
  width: 6px;
  height: 6px;
  background: var(--accent);
  animation: pulse 2s ease-in-out infinite;
}

/* ── 邮箱主块 ─────────────────────────── */
.mail-block {
  position: relative;
  margin: 3rem 0 3.5rem;
  padding: 2.5rem 2rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-sunken);
  animation: fadeUp 0.7s var(--ease-out) 0.05s both;

  @media (min-width: 768px) {
    padding: 3.5rem 3rem;
  }
}

.mail-block__label {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--fg-faint);
}

.mail-block__value {
  display: block;
  margin: 0.75rem 0 1.75rem;
  font-family: var(--font-display);
  font-size: clamp(1.375rem, 5vw, 3rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  word-break: break-all;
  color: var(--fg);
  text-decoration: none;
  background-image: linear-gradient(var(--accent), var(--accent));
  background-repeat: no-repeat;
  background-position: 0 100%;
  background-size: 0 2px;
  transition: background-size var(--dur) var(--ease-out), color var(--dur) var(--ease-out);

  &:hover {
    color: var(--accent-text);
    background-size: 100% 2px;
  }
}

.mail-block__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
}

.ct-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.6rem 1.1rem;
  border: 1px solid var(--ink);
  border-radius: var(--radius-sm);
  background: transparent;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--fg);
  text-decoration: none;
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);

  &:hover {
    background: var(--inverse-bg);
    color: var(--inverse-fg);
  }

  &--solid {
    background: var(--inverse-bg);
    color: var(--inverse-fg);

    &:hover {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }
  }
}

/* ── 社交卡片 ─────────────────────────── */
.social-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.social-card {
  position: relative;
  display: block;
  width: 100%;
  padding: 2rem 1.5rem 1.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  animation: fadeUp 0.7s var(--ease-out) both;
  transition: border-color var(--dur) var(--ease-out), transform var(--dur) var(--ease-out);

  &:hover {
    border-color: var(--accent);
    transform: translateY(-3px);

    .social-icon {
      color: var(--accent-text);
    }

    .social-name {
      background-size: 100% 2px;
    }
  }
}

.social-index {
  position: absolute;
  top: 0.875rem;
  right: 1rem;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--fg-faint);
}

.social-icon {
  display: block;
  margin-bottom: 1.25rem;
  color: var(--fg-faint);
  transition: color var(--dur) var(--ease-out);
}

.social-name {
  display: inline;
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--fg);
  background-image: linear-gradient(var(--accent), var(--accent));
  background-repeat: no-repeat;
  background-position: 0 100%;
  background-size: 0 2px;
  transition: background-size var(--dur) var(--ease-out);
}

.social-account {
  margin: 0.5rem 0 0;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  letter-spacing: 0.02em;
  word-break: break-all;
  color: var(--fg-muted);

  &--selectable {
    -webkit-user-select: text;
    user-select: text;
  }
}

.social-action {
  display: inline-block;
  margin-top: 1.25rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--border);
  width: 100%;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--fg-faint);
}
</style>
