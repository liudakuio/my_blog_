// 前台文案类型与静态数据的单一出处。
// 背景：SocialLinks / ContactContent / PortfolioPageContent / ArticlesPageContent / Song
//   这 5 个类型原先在 5 个页面里各写一份（dashboard、contact、portfolio、articles、MusicPlayer），
//   与 src/types/index.ts 的声明也不一致，改字段时需要同时改多处；现统一到本文件。
// 类型使用约定：src/types/index.ts 只保留前端内部结构（语言、枚举、Project / Article 等），
//   页面级文案类型统一从本文件 import，不要再在页面里重复声明。
// 静态文案说明：首页 / 联系 / 作品 / 文章页的具体文案仍留在各自页面内，
//   因为首页与联系页虽然结构相同、但文案内容并不相同，合并会改变页面表现。
// 被谁引用：views/dashboard、views/contact、views/portfolio、views/articles、components/MusicPlayer。

/** 社交平台账号集合 */
export interface SocialLinks {
  wechat: string
  xiaohongshu: string
  bilibili: string
  px500: string
}

/** 联系页文案内容（首页页脚也复用同一结构） */
export interface ContactContent {
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

/** 作品页页头文案 */
export interface PortfolioPageContent {
  title: string
  description: string
}

/** 文章页页头文案 */
export interface ArticlesPageContent {
  title: string
  description: string
}

/** 音乐播放器中的单曲信息 */
export interface Song {
  id: string
  title: string
  artist: string
  /** 封面图路径（public 目录下的静态资源） */
  cover: string
  /** 音频文件路径（public 目录下的静态资源） */
  audio: string
}

/**
 * 播放器默认歌单（本地静态资源，随构建产物一起发布）。
 * 被谁引用：src/components/MusicPlayer.vue。
 */
export const MUSIC_PLAYLIST: Song[] = [
  { id: 'local-01', title: '主动', artist: '加木', cover: '/music/covers/pirene.jpg', audio: '/music/audio/zhudong.mp3' },
  { id: 'local-02', title: "Pirene's Fountain", artist: 'Vallès', cover: '/music/covers/lofi.jpg', audio: '/music/audio/pirene.mp3' },
  { id: 'local-03', title: 'Island', artist: 'Nujabes/Uyama Hiroto/Haruka Nakamura', cover: '/music/covers/island.jpg', audio: '/music/audio/island.mp3' },
  { id: 'local-04', title: 'the updater', artist: 'TSUTCHIE', cover: '/music/covers/updater.jpg', audio: '/music/audio/updater.mp3' }
]
