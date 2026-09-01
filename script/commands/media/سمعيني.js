const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

const HEADER = 
`╭─── 𓆩 𝐀𝐍𝐀𝐒 𝐗 𝐒𝐎𝐌𝐈 𓆪 ───╮
│ 🇾🇪 Dev: Anas Al-Sarouri
│ 📍 Yemen - Mukalla
╰──────────────────╯
`;

module.exports.config = {
  name: "سماعة",
  aliases: ["اغنية","sing"],
  version: "2.0-YE-FIX",
  hasPermssion: 0,
  credits: "Anas Al-Sarouri",
  description: "تحميل اغاني",
  commandCategory: "media",
  usages: "سماعة اسم الاغنية",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const query = args.join(" ").trim();
  if (!query) return api.sendMessage(HEADER + "\n❌ اكتب اسم الاغنية", threadID, messageID);

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  const filePath = path.join(cacheDir, `anas_${Date.now()}.mp3`);

  try {
    api.setMessageReaction("⏳", messageID, () => {}, true);
    
    const search = await yts(query);
    const video = search.videos[0];
    if (!video) throw new Error("ما لقيت نتيجة");

    // API
    const apiUrl = `https://ytdl-api-xdi.onrender.com/api/dl?link=${encodeURIComponent(video.url)}&format=mp3`;
    const res = await axios.get(apiUrl, { timeout: 60000 });
    if (!res.data.downloadUrl) throw new Error(res.data.error || "API مات");

    const dl = await axios.get(res.data.downloadUrl, { responseType: "stream", timeout: 120000 });
    const writer = fs.createWriteStream(filePath);
    dl.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    api.setMessageReaction("✅", messageID, () => {}, true);
    return api.sendMessage({
      body: HEADER + `\n🎶 ${video.title}\n🕒 ${video.timestamp}`,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }, messageID);

  } catch (e) {
    console.log(e);
    api.setMessageReaction("❌", messageID, () => {}, true);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return api.sendMessage(HEADER + "\n❌ فشل: " + e.message, threadID, messageID);
  }
};