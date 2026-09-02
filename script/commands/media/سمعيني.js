const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");
const ytdl = require("@ybd-project/ytdl-core");

module.exports.config = {
  name: "صوت",
  aliases: ["سماعة", "samaa", "play", "غنية"],
  version: "1.0.6",
  hasPermssion: 0,
  credits: "Anas fix",
  description: "تشغيل اغنية",
  commandCategory: "media",
  usages: "[اسم الاغنية]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  if (!args[0]) return api.sendMessage("🎧 اكتب: صوت حمودي يا ناسي", threadID, messageID);

  try {
    api.sendMessage(`🔍 ابحث عن: ${args.join(" ")}`, threadID, messageID);

    const search = await yts(args.join(" "));
    const video = search.videos[0];
    if (!video) return api.sendMessage("❌ ما لقيت", threadID, messageID);

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const filePath = path.join(cacheDir, `play_${Date.now()}.mp3`);

    const stream = ytdl(video.url, { filter: "audioonly", quality: "highestaudio" });

    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filePath);
      stream.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
      stream.on("error", reject);
    });

    return api.sendMessage({
      body: `🎵 ${video.title}\n⏱️ ${video.timestamp}`,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, messageID);

  } catch (e) {
    console.log(e);
    return api.sendMessage(`❌ خطأ: ${e.message}`, threadID, messageID);
  }
};