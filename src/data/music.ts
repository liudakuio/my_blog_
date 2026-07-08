// 音乐播放列表数据：歌曲标题、艺术家、封面图、音频文件路径
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
    cover: '/music/covers/Pirene\'s Fountain Vallès.jpg',
    audio: '/music/audio/Vallès - Pirene\'s Fountain.mp3'
  },
  {
    id: 'local-02',
    title: 'Sleepless nights - lofi hiphop mix pt.2',
    artist: 'Mixed Artists',
    cover: '/music/covers/lofi-cat-night.jpg',
    audio: '/music/audio/Sleepless nights - lofi hiphop mix pt.2.mp3'
  },
  {
    id: 'local-03',
    title: 'Island',
    artist: 'Nujabes/Uyama Hiroto/Haruka Nakamura',
    cover: '/music/covers/spiritual state.jpg',
    audio: '/music/audio/Nujabes,Uyama Hiroto,haruka nakamura - Island (feat. Uyama Hiroto & haruka nakamura).mp3'
  },
  {
    id: 'local-04',
    title: 'the updater',
    artist: 'TSUTCHIE',
    cover: '/music/covers/Tsutchie-Samurai Champloo Music Recored.jpg',
    audio: '/music/audio/TSUTCHIE - the updater.mp3'
  }
]
