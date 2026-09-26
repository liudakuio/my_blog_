// 网易云音乐链接解析工具：输入歌曲链接，自动获取歌名/歌手/封面并生成 blog_music 表的 INSERT 语句
const https = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 歌单已由后端 DB 维护（GET /api/music/playlist），这里输出可直接执行的 SQL
const SEED_FILE_PATH = path.join(__dirname, 'song-seed.sql');

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
        const title = song.name;
        const artist = song.artists.map(a => a.name).join(' / ');
        const cover = song.album.picUrl;

        console.log('✅ 获取成功!');
        console.log('歌名:', title);
        console.log('歌手:', artist);

        // 生成 INSERT 语句：audio 需手动补充（网易不提供直链）
        const insert = `INSERT INTO blog_music (id, title, artist, cover, audio, sort, status) `
          + `VALUES ('${id}', '${escapeSql(title)}', '${escapeSql(artist)}', '${escapeSql(cover)}', '', 0, '0');\n`;

        fs.appendFileSync(SEED_FILE_PATH, insert, 'utf8');
        console.log(`🎉 已生成 INSERT 语句并写入 ${SEED_FILE_PATH}`);
        console.log('⚠️  请补充 audio 字段（音频地址需支持 Range 请求）后再执行');

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

function escapeSql(value) {
  return String(value || '').replace(/'/g, "''");
}
