// 音乐播放列表数据：歌曲标题、艺术家、封面图、音频文件路径
// 说明：public/music 下的音频与封面已在「增加前后端对接」中重命名为
// island / lofi / pirene / updater，此处路径与当前文件名保持一致。
// 被谁引用：layout/components/MusicPlayer.vue（左下角播放器）直接取 MUSIC_PLAYLIST 循环播放。
// 注意：这里的 Song 是本地类型，与 api/types.ts 的 SongVo（后端 sys_song 表）无关，
// 歌单目前不读接口，改歌单需改本文件并把资源放进 public/music。
export interface Song {
  id: string
  title: string
  artist: string
  cover: string
  audio: string
}

export const MUSIC_PLAYLIST: Song[] = [
  {
    id: 'local-01',
    title: "主动",
    artist: '加木',
    cover: '/music/covers/pirene.jpg',
    audio: '/music/audio/zhudong.mp3'
  },
  {
    id: 'local-02',
    title: "Pirene's Fountain",
    artist: 'Vallès',
    cover: '/music/covers/lofi.jpg',
    audio: '/music/audio/pirene.mp3'
  },
  {
    id: 'local-03',
    title: 'Island',
    artist: 'Nujabes/Uyama Hiroto/Haruka Nakamura',
    cover: '/music/covers/island.jpg',
    audio: '/music/audio/island.mp3'
  },
  {
    id: 'local-04',
    title: 'the updater',
    artist: 'TSUTCHIE',
    cover: '/music/covers/updater.jpg',
    audio: '/music/audio/updater.mp3'
  }
]
