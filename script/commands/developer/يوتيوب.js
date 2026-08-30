const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
name: "يوتيوب",
version: "2.0.0",
hasPermssion: 0,
credits: "أبو هريرة",
description: "تحميل فيديوهات YouTube بالبحث أو الرابط",
commandCategory: "media",
usages: "[رابط أو كلمة بحث]",
cooldowns: 10,
dependencies: {
"@ybd-project/ytdl-core": "",
"yt-search": "",
"fs-extra": "",
"axios": ""
}
};

const MAX_SIZE = 25 * 1024 * 1024;

function getModule(name) {
try {
return global.nodemodule?.[name] || require(name);
} catch (error) {
return null;
}
}

function ensureCache() {
const cache = path.join(__dirname, "cache");

if (!fs.existsSync(cache)) {
fs.mkdirSync(cache, {
recursive: true
});
}

return cache;
}

function send(api, message, threadID, messageID) {
return new Promise((resolve) => {
try {
api.sendMessage(
message,
threadID,
(err, info) => resolve(info),
messageID
);
} catch (error) {
resolve(null);
}
});
}

async function downloadVideo(url, filePath) {
const ytdlModule = getModule("@ybd-project/ytdl-core");

if (!ytdlModule) {
throw new Error(
"مكتبة @ybd-project/ytdl-core غير مثبتة"
);
}

const YtdlCore =
ytdlModule.YtdlCore ||
ytdlModule.default ||
ytdlModule;

if (typeof YtdlCore !== "function") {
throw new Error(
"تعذر تحميل مكتبة YouTube"
);
}

const ytdl = new YtdlCore();

const stream = ytdl.download(url);

return new Promise((resolve, reject) => {
const output = fs.createWriteStream(filePath);

stream.pipe(output);

stream.on("error", reject);
output.on("error", reject);

output.on("finish", () => {
  resolve(filePath);
});

});
}

module.exports.handleReply = async function({
api,
event,
handleReply
}) {
const {
threadID,
messageID
} = event;

if (
String(event.senderID) !==
String(handleReply.author)
) {
return;
}

const choice =
Number(event.body.trim());

if (
!Number.isInteger(choice) ||
choice < 1 ||
choice > handleReply.links.length
) {
return send(
api,
`⌬ ━━ HINA MEDIA ━━ ⌬

⚠️ اختر رقمًا صحيحًا من القائمة`,
threadID,
messageID
);
}

const url =
handleReply.links[choice - 1];

const cacheDir = ensureCache();

const filePath = path.join(
cacheDir,
"youtube_${Date.now()}.mp4"
);

try {
await send(
api,
`⌬ ━━ HINA MEDIA ━━ ⌬

⏳ جارِ تحميل الفيديو...`,
threadID,
messageID
);

await downloadVideo(
  url,
  filePath
);

if (!fs.existsSync(filePath)) {
  throw new Error(
    "لم يتم إنشاء ملف الفيديو"
  );
}

const size =
  fs.statSync(filePath).size;

if (size > MAX_SIZE) {
  fs.unlinkSync(filePath);

  return send(
    api,
    `⌬ ━━ HINA MEDIA ━━ ⌬

❌ حجم الفيديو أكبر من 25MB`,
threadID,
messageID
);
}

return api.sendMessage(
  {
    attachment:
      fs.createReadStream(filePath)
  },
  threadID,
  () => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {}
  },
  messageID
);

} catch (error) {
console.error(
"[YOUTUBE DOWNLOAD ERROR]",
error
);

try {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
} catch {}

return send(
  api,
  `⌬ ━━ HINA MEDIA ━━ ⌬

❌ حدث خطأ أثناء تحميل الفيديو

${error.message}`,
threadID,
messageID
);

} finally {
try {
if (
typeof api.unsendMessage ===
"function" &&
handleReply.messageID
) {
api.unsendMessage(
handleReply.messageID
);
}
} catch {}
}
};

module.exports.run = async function({
api,
event,
args
}) {
const {
threadID,
messageID
} = event;

const ytSearch =
getModule("yt-search");

if (!ytSearch) {
return send(
api,
`⌬ ━━ HINA MEDIA ━━ ⌬

❌ مكتبة yt-search غير مثبتة`,
threadID,
messageID
);
}

if (!args || !args.length) {
return send(
api,
`⌬ ━━ HINA MEDIA ━━ ⌬

⚠️ اكتب اسم الفيديو أو أرسل رابط YouTube`,
threadID,
messageID
);
}

const input =
args.join(" ").trim();

const youtubeRegex =
/^(https?://)?(www.)?(m.)?(youtube.com|youtu.be)//i;

// ==========================================================
// DIRECT URL
// ==========================================================

if (youtubeRegex.test(input)) {
const cacheDir = ensureCache();

const filePath = path.join(
  cacheDir,
  `youtube_${Date.now()}.mp4`
);

try {
  await send(
    api,
    `⌬ ━━ HINA MEDIA ━━ ⌬

⏳ جارِ تحميل الفيديو...`,
threadID,
messageID
);

  await downloadVideo(
    input,
    filePath
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(
      "لم يتم إنشاء ملف الفيديو"
    );
  }

  const size =
    fs.statSync(filePath).size;

  if (size > MAX_SIZE) {
    fs.unlinkSync(filePath);

    return send(
      api,
      `⌬ ━━ HINA MEDIA ━━ ⌬

❌ حجم الفيديو أكبر من 25MB`,
threadID,
messageID
);
}

  return api.sendMessage(
    {
      attachment:
        fs.createReadStream(filePath)
    },
    threadID,
    () => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch {}
    },
    messageID
  );

} catch (error) {
  console.error(
    "[YOUTUBE URL ERROR]",
    error
  );

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {}

  return send(
    api,
    `⌬ ━━ HINA MEDIA ━━ ⌬

❌ حدث خطأ أثناء تحميل الفيديو

${error.message}`,
threadID,
messageID
);
}
}

// ==========================================================
// SEARCH
// ==========================================================

try {
const result =
await ytSearch(input);

const videos =
  result?.videos?.slice(0, 5) || [];

if (!videos.length) {
  return send(
    api,
    `⌬ ━━ HINA MEDIA ━━ ⌬

❌ لم يتم العثور على نتائج`,
threadID,
messageID
);
}

let message =
  `⌬ ━━ HINA MEDIA ━━ ⌬\n\n`;

const links = [];

videos.forEach(
  (video, index) => {
    links.push(video.url);

    message +=
      `${index + 1}. ${video.title}\n` +
      `⏱ ${video.timestamp || "غير معروف"}\n\n`;
  }
);

message +=
  `أرسل رقم الفيديو الذي تريد تحميله`;

return api.sendMessage(
  message,
  threadID,
  (error, info) => {
    if (error || !info) {
      return;
    }

    if (
      !global.client.handleReply
    ) {
      global.client.handleReply = [];
    }

    global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      author: event.senderID,
      links
    });
  },
  messageID
);

} catch (error) {
console.error(
"[YOUTUBE SEARCH ERROR]",
error
);

return send(
  api,
  `⌬ ━━ HINA MEDIA ━━ ⌬

❌ حدث خطأ أثناء البحث

${error.message}`,
threadID,
messageID
);
}
};