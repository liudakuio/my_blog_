// 音乐相关接口
import service from '@/utils/request'
import type { SongVo } from './types'

/** GET /api/music/playlist —— 播放列表（无多语字段） */
export function getPlaylist() {
  return service.get<SongVo[], SongVo[]>('/api/music/playlist')
}
