// 网易云音乐链接解析工具：输入歌曲链接，自动获取歌名/歌手/封面并追加到 music.ts
const https = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const MUSIC_FILE_PATH = path.join(__dirname, '../src/data/music.ts');

console.log('🎵 网易云音乐链接解析工具');
console.log('请输入歌曲链接 (例如: https://music.163.com/song?id=1824637):');

rl.on('line', (input) => {
  const url = input.trim();
  if (!url) return;

  // Extract ID
  const match = url.match(/id=(\d+)/);
  if (!match) {
    console.error('❌ 无法从链接中提取歌曲ID');
    rl.close();
    return;
  }

  const id = match[1];
  console.log(`🔍 正在获取歌曲信息 (ID: ${id})...`);

  const apiUrl = `http://music.163.com/api/song/detail/?id=${id}&ids=[${id}]`;

  https.get(apiUrl, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.code !== 200 || !json.songs || json.songs.length === 0) {
          console.error('❌ 获取失败，可能是ID无效或歌曲已下架');
          return;
        }

        const song = json.songs[0];
        const newSong = {
          id: parseInt(song.id),
          title: song.name,
          artist: song.artists.map(a => a.name).join(' / '),
          cover: song.album.picUrl
        };

        console.log('✅ 获取成功!');
        console.log('歌名:', newSong.title);
        console.log('歌手:', newSong.artist);
        
        // Read and update file
        let fileContent = fs.readFileSync(MUSIC_FILE_PATH, 'utf8');
        
        // Find the closing bracket of the array
        const insertIndex = fileContent.lastIndexOf('];');
        
        if (insertIndex === -1) {
          console.error('❌ 无法解析 music.ts 文件结构');
          return;
        }

        const newEntryString = `  {\n    id: ${newSong.id},\n    title: "${newSong.title}",\n    artist: "${newSong.artist}",\n    cover: "${newSong.cover}"\n  },\n`;
        
        const newContent = fileContent.slice(0, insertIndex) + newEntryString + fileContent.slice(insertIndex);
        
        fs.writeFileSync(MUSIC_FILE_PATH, newContent, 'utf8');
        console.log(`🎉 歌曲已自动添加到 ${MUSIC_FILE_PATH}`);
        
      } catch (e) {
        console.error('❌ 解析错误:', e);
      } finally {
        rl.close();
      }
    });
  }).on('error', (err) => {
    console.error('❌ 网络错误:', err.message);
    rl.close();
  });
});
