// 音乐播放列表数据：歌曲标题、艺术家、封面图、音频文件路径
// 说明：public/music 下的音频与封面已在「增加前后端对接」中重命名为
// island / lofi / pirene / updater，此处路径与当前文件名保持一致。
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
    title: "Pirene's Fountain",
    artist: 'Vallès',
    cover: '/music/covers/pirene.jpg',
    audio: '/music/audio/pirene.mp3'
  },
  {
    id: 'local-02',
    title: 'Sleepless nights - lofi hiphop mix pt.2',
    artist: 'Mixed Artists',
    cover: '/music/covers/lofi.jpg',
    audio: '/music/audio/lofi.mp3'
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
