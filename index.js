const ytdl = require('ytdl-core');
const fs = require('fs');
const { Telegraf } = require('telegraf');
const search = require('youtube-search');
const ffmpeg = require('fluent-ffmpeg');

const bot = new Telegraf('7082296229:AAFXBeq_hjZk4-Fjnf2UjpLUwldKpsMs9ig');

bot.start((ctx) => ctx.reply('Selamat datang! Kirim link video YouTube atau ketik nama video untuk mencari dan mendownload audio'));

bot.on('text', async (ctx) => {
    const searchTerm = ctx.message.text;

    if (ytdl.validateURL(searchTerm)) {
        await downloadAudioFromLink(ctx, searchTerm);
    } else {
        const opts = {
            maxResults: 10,
            key: 'AIzaSyAiXo6gCI9ijydzuLNzVsyrghLy7LNnqSY'
        };

        search(searchTerm, opts, async (err, results) => {
            if (err) {
                console.error('Error searching:', err);
                ctx.reply('Terjadi kesalahan saat mencari video');
                return;
            }

            if (results && results.length > 0) {
                let replyMessage = 'Pilihan lagu yang ditemukan:\n';
                results.forEach((result, index) => {
                    replyMessage += `${index + 1}. ${result.title}\n`;
                });

                ctx.reply(replyMessage);

                const selectedSongIndex = 1; // Change this to the selected song index
                const selectedVideoUrl = results[selectedSongIndex - 1].link;

                ctx.reply(`URL dari lagu yang diunduh: ${selectedVideoUrl}`);
                ctx.reply('Sedang mengunduh audio...');

                await downloadAudioFromLink(ctx, selectedVideoUrl);
            } else {
                ctx.reply('Tidak dapat menemukan video sesuai dengan kata kunci');
            }
        });
    }
});

async function downloadAudioFromLink(ctx, videoUrl) {
  const info = await ytdl.getInfo(videoUrl);
  const title = info.videoDetails.title; // Get the title of the video
  const filePath = `${title}.mp3`;
  const stream = ytdl(videoUrl, { filter: 'audioonly' });
  stream.pipe(fs.createWriteStream(filePath));

  const command = ffmpeg(stream)
      .audioCodec('libmp3lame')
      .format('mp3')
      .on('end', () => {
          ctx.reply('Audio berhasil diunduh!');
          ctx.replyWithAudio({ source: filePath });
      })
      .on('error', (err) => {
          console.error('Error downloading audio:', err);
          ctx.reply('Terjadi kesalahan saat mengunduh audio');
      })
      .save(filePath);
}

bot.launch();
