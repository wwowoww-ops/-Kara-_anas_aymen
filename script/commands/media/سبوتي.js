module.exports.config = {
name: "سبوتي",
version: "2.2.0",
hasPermssion: 0,
credits: "أبو هريرة",
description: "البحث عن الأغاني وإرسالها (نسخة مستقرة)",
commandCategory: "media",
usages: "سبوتي [اسم الأغنية]",
cooldowns: 10
};

module.exports.run = async function({ api, event, args }) {
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { threadID, messageID } = event;

const songName = args.join(" ");

if (!songName) {
return api.sendMessage(
"⌬ ━━ 𝗛𝗜𝗡𝗔 𝗦𝗣𝗢𝗧𝗜 ━━ ⌬\n\nيرجى كتابة اسم الأغنية التي تبحث عنها!",
threadID,
messageID
);
}

api.setMessageReaction(
"🔍",
messageID,
() => {},
true
);

try {

const res = await axios.get(
  `https://api.deezer.com/search?q=${encodeURIComponent(songName)}&limit=1`
);

if (
  !res.data.data ||
  res.data.data.length === 0
) {

  api.setMessageReaction(
    "❌",
    messageID,
    () => {},
    true
  );

  return api.sendMessage(
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗦𝗣𝗢𝗧𝗜 ━━ ⌬\n\nلم أجد هذا المقطع، جرب كتابة اسم الفنان مع الأغنية.",
    threadID,
    messageID
  );
}

const song =
  res.data.data[0];

const audioUrl =
  song.preview;

const title =
  song.title;

const artist =
  song.artist.name;

const coverUrl =
  song.album.cover_big;

const cacheDir =
  path.join(
    __dirname,
    "cache"
  );

if (
  !fs.existsSync(cacheDir)
) {
  fs.ensureDirSync(cacheDir);
}

const timestamp =
  Date.now();

const audioPath =
  path.join(
    cacheDir,
    `${timestamp}_audio.mp3`
  );

const coverPath =
  path.join(
    cacheDir,
    `${timestamp}_cover.jpg`
  );

api.setMessageReaction(
  "🎵",
  messageID,
  () => {},
  true
);

const [
  audioRes,
  coverRes
] = await Promise.all([

  axios.get(
    audioUrl,
    {
      responseType:
        "arraybuffer"
    }
  ),

  axios.get(
    coverUrl,
    {
      responseType:
        "arraybuffer"
    }
  )

]);

fs.writeFileSync(
  audioPath,
  Buffer.from(
    audioRes.data
  )
);

fs.writeFileSync(
  coverPath,
  Buffer.from(
    coverRes.data
  )
);

const msg = {

  body:

`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗦𝗣𝗢𝗧𝗜 ━━ ⌬

🎤 الفنان: ${artist}
🎵 الأغنية: ${title}

جاري إرسال المقطع الصوتي...`,

  attachment:
    fs.createReadStream(
      coverPath
    )
};

return api.sendMessage(
  msg,
  threadID,

  (err, info) => {

    if (err) {

      console.error(
        "❌ Cover Send Error:",
        err
      );

      return;
    }

    api.sendMessage(
      {
        body:
          `🎶 مقطع: ${title}`,

        attachment:
          fs.createReadStream(
            audioPath
          )
      },

      threadID,

      () => {

        try {

          if (
            fs.existsSync(
              audioPath
            )
          ) {
            fs.unlinkSync(
              audioPath
            );
          }

          if (
            fs.existsSync(
              coverPath
            )
          ) {
            fs.unlinkSync(
              coverPath
            );
          }

        } catch (error) {

          console.error(
            "❌ Cache Cleanup Error:",
            error
          );

        }

        api.setMessageReaction(
          "✅",
          messageID,
          () => {},
          true
        );

      },

      messageID
    );

  },

  messageID
);

} catch (error) {

console.error(
  "❌ HINA SPOTI ERROR:",
  error
);

api.setMessageReaction(
  "❌",
  messageID,
  () => {},
  true
);

return api.sendMessage(
  "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗦𝗣𝗢𝗧𝗜 ━━ ⌬\n\nحدث خطأ أثناء الاتصال بالمخدم، حاول لاحقاً.",
  threadID,
  messageID
);

}
};