// 联系方式数据：邮箱、社交平台账号（中英双语），与 home.ts 中的 CONTACT_DATA 重复定义
import { Language } from '@/types';

export interface SocialLinks {
  wechat: string;
  xiaohongshu: string;
  bilibili: string;
  px500: string;
}

export interface ContactContent {
  baseLabel: string;
  locationValue: string;
  contactLabel: string;
  emailMeLabel: string;
  email: string;
  hello: string;
  intro: string;
  socials: SocialLinks;
  tooltip?: string;
  githubLabel: string;
  footerDesign: string;
}

export const CONTACT_DATA: Record<Language, ContactContent> = {
  zh: {
    baseLabel: "BASE",
    locationValue: "河南 郑州",
    contactLabel: "取得联系",
    emailMeLabel: "邮箱",
    email: "your.email@example.com",
    hello: "你好 ;-)",
    intro: "欢迎探讨与合作。",
    socials: {
      wechat: "YourWeChatID",
      xiaohongshu: "YourID",
      bilibili: "YourID",
      px500: "YourID"
    },
    githubLabel: "GitHub",
    footerDesign: "Powered by Gemini 3 Pro"
  },
  en: {
    baseLabel: "BASE",
    locationValue: "HENAN ZHENGZHOU",
    contactLabel: "Get in touch",
    emailMeLabel: "Email Me",
    email: "your.email@example.com",
    hello: "Hello ;-)",
    intro: "Welcome to discuss & cooperate.",
    socials: {
      wechat: "YourWeChatID",
      xiaohongshu: "YourID",
      bilibili: "YourID",
      px500: "YourID"
    },
    githubLabel: "GitHub",
    footerDesign: "Powered by Gemini 3 Pro"
  }
};
