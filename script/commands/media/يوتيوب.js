const fs = require("fs-extra");
const path = require("path");
const ytSearch = require("yt-search");
const {
  YtdlCore,
  toPipeableStream
} = require("@ybd-project/ytdl-core");

const ytdl = new YtdlCore();

const MAX_FILE_SIZE = 25 * 1024 * 1024;

module.exports.config = {
  name: "يوتيوب",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "البحث وتحميل فيديوهات YouTube",
  commandCategory: "media",
  usages: "[اسم الفيديو أو رابط YouTube]",
  cooldowns: 10
};

// ============================================================
// HELPERS
// ============================================================

function getCacheDir() {
  const dir = path.join(__dirname, "cache");
  fs.ensureDirSync(dir);
  return dir;
}

function getSafeFileName(name) {
  return String(name || "youtube")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

function isYouTubeUrl(text) {
  return /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]+/i.test(
    String(text || "").trim()
  );
}

function extractVideoId(url) {
  const text = String(url || "").trim();

  const match = text.match(
    /(?:v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([\w-]{6,})/i
  );

  return match ? match[1] : null;
}

async function removeFile(filePath) {
  try {
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
    }
  } catch (error) {
    console.log(
      "[YOUTUBE] Failed to remove cache:",
      error.message
    );
  }
}

async function sendVideo(api, event, filePath, title) {
  try {
    const stat = await fs.stat(filePath);

    if (stat.size > MAX_FILE_SIZE) {
      await removeFile(filePath);

      return api.sendMessage(
        `⌬ ━━ HINA MEDIA ━━ ⌬

❌ لا يمكن إرسال الفيديو

📦 حجم الملف:
${(stat.size / 1024 / 1024).toFixed(2)} MB

⚠️ الحد المسموح للإرسال هو 25 MB`,
        event.threadID,
        event.messageID
      );
    }

    const stream = fs.createReadStream(filePath);

    return api.sendMessage(
      {
        body:
          `⌬ ━━ HINA MEDIA ━━ ⌬\n\n` +
          `🎬 ${title || "YouTube"}\n\n` +
          `✓ تم تحميل الفيديو بنجاح`,
        attachment: stream
      },
      event.threadID,
      async (error) => {
        await removeFile(filePath);

        if (error) {
          console.log(
            "[YOUTUBE SEND ERROR]",
            error
          );
        }
      },
      event.messageID
    );

  } catch (error) {

    await removeFile(filePath);

    console.log(
      "[YOUTUBE SEND ERROR]",
      error
    );

    return api.sendMessage(
      `⌬ ━━ HINA MEDIA ━━ ⌬

❌ حدث خطأ أثناء إرسال الفيديو
${error.message}`,
      event.threadID,
      event.messageID
    );
  }
}

// ============================================================
// DOWNLOAD
// ============================================================

async function downloadVideo(url, outputPath) {

  const downloadStream =
    await ytdl.download(url);

  const stream =
    toPipeableStream(downloadStream);

  await new Promise(
    (resolve, reject) => {

      const output =
        fs.createWriteStream(
          outputPath
        );

      let settled = false;

      function finish(error) {

        if (settled) {
          return;
        }

        settled = true;

        if (error) {
          try {
            output.destroy();
          } catch (e) {}

          reject(error);

        } else {
          resolve();
        }
      }

      output.on(
        "finish",
        () => finish()
      );

      output.on(
        "error",
        finish
      );

      stream.on(
        "error",
        finish
      );

      stream.pipe(output);
    }
  );
}

// ============================================================
// HANDLE REPLY
// ============================================================

module.exports.handleReply = async function ({
  api,
  event,
  handleReply
}) {

  if (
    !handleReply ||
    !Array.isArray(handleReply.links)
  ) {
    return;
  }

  if (
    String(event.senderID) !==
    String(handleReply.author)
  ) {
    return;
  }

  const input =
    String(event.body || "")
      .trim();

  const index =
    Number(input) - 1;

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= handleReply.links.length
  ) {

    return api.sendMessage(
      `⌬ ━━ HINA MEDIA ━━ ⌬

⚠️ اختر رقمًا صحيحًا من القائمة

مثال:
1
2
3`,
      event.threadID,
      event.messageID
    );
  }

  const selected =
    handleReply.links[index];

  const url =
    selected.url;

  const title =
    selected.title ||
    "YouTube";

  const videoId =
    extractVideoId(url) ||
    Date.now().toString();

  const fileName =
    `youtube_${videoId}_${Date.now()}.mp4`;

  const filePath =
    path.join(
      getCacheDir(),
      fileName
    );

  try {

    if (
      handleReply.messageID &&
      typeof api.unsendMessage ===
      "function"
    ) {

      try {
        await api.unsendMessage(
          handleReply.messageID
        );
      } catch (e) {}

    }

    if (
      typeof api.setMessageReaction ===
      "function"
    ) {

      try {

        await new Promise(
          resolve => {

            api.setMessageReaction(
              "⏳",
              event.messageID,
              () => resolve(),
              true
            );

          }
        );

      } catch (e) {}
    }

    await api.sendMessage(
      `⌬ ━━ HINA MEDIA ━━ ⌬

⏳ جاري تحميل:

${title}

انتظر قليلًا...`,
      event.threadID,
      event.messageID
    );

    await downloadVideo(
      url,
      filePath
    );

    await sendVideo(
      api,
      event,
      filePath,
      title
    );

  } catch (error) {

    await removeFile(
      filePath
    );

    console.log(
      "[YOUTUBE DOWNLOAD ERROR]",
      error
    );

    return api.sendMessage(
      `⌬ ━━ HINA MEDIA ━━ ⌬

❌ حدث خطأ أثناء تحميل الفيديو

${error.message || error}`,
      event.threadID,
      event.messageID
    );
  }
};

// ============================================================
// MAIN COMMAND
// ============================================================

module.exports.run = async function ({
  api,
  event,
  args
}) {

  const input =
    String(args?.join(" ") || "")
      .trim();

  if (!input) {

    return api.sendMessage(
      `⌬ ━━ HINA MEDIA ━━ ⌬

⚠️ اكتب اسم الفيديو أو ضع رابط YouTube

مثال:

.يوتيوب اسم الفيديو`,
      event.threadID,
      event.messageID
    );
  }

  // ==========================================================
  // DIRECT URL
  // ==========================================================

  if (isYouTubeUrl(input)) {

    const videoId =
      extractVideoId(input);

    if (!videoId) {

      return api.sendMessage(
        `⌬ ━━ HINA MEDIA ━━ ⌬

❌ لم أستطع استخراج رابط الفيديو`,
        event.threadID,
        event.messageID
      );
    }

    const filePath =
      path.join(
        getCacheDir(),
        `youtube_${videoId}_${Date.now()}.mp4`
      );

    try {

      await api.sendMessage(
        `⌬ ━━ HINA MEDIA ━━ ⌬

⏳ جاري تحميل الفيديو...`,
        event.threadID,
        event.messageID
      );

      let title =
        "YouTube";

      try {

        const info =
          await ytdl.getBasicInfo(
            input
          );

        title =
          info?.videoDetails?.title ||
          title;

      } catch (infoError) {

        console.log(
          "[YOUTUBE INFO]",
          infoError.message
        );

      }

      await downloadVideo(
        input,
        filePath
      );

      return sendVideo(
        api,
        event,
        filePath,
        title
      );

    } catch (error) {

      await removeFile(
        filePath
      );

      console.log(
        "[YOUTUBE ERROR]",
        error
      );

      return api.sendMessage(
        `⌬ ━━ HINA MEDIA ━━ ⌬

❌ حدث خطأ أثناء تحميل الفيديو

${error.message || error}`,
        event.threadID,
        event.messageID
      );
    }
  }

  // ==========================================================
  // SEARCH
  // ==========================================================

  try {

    const result =
      await ytSearch(input);

    if (
      !result ||
      !Array.isArray(result.videos) ||
      !result.videos.length
    ) {

      return api.sendMessage(
        `⌬ ━━ HINA MEDIA ━━ ⌬

❌ لم أجد نتائج لهذا البحث`,
        event.threadID,
        event.messageID
      );
    }

    const videos =
      result.videos
        .slice(0, 5);

    let message =
      `⌬ ━━ HINA MEDIA ━━ ⌬\n\n`;

    message +=
      `🔎 نتائج البحث عن:\n${input}\n\n`;

    videos.forEach(
      (video, index) => {

        message +=
          `${index + 1} ┃ ${video.title}\n`;

        message +=
          `   ⏱️ ${video.timestamp || "غير معروف"}\n`;

        message +=
          `   👤 ${video.author?.name || "غير معروف"}\n\n`;
      }
    );

    message +=
      `━━━━━━━━━━━━━━━━━━\n`;

    message +=
      `↪️ أرسل رقم الفيديو لتحميله`;

    const links =
      videos.map(
        video => ({
          url: video.url,
          title: video.title
        })
      );

    return api.sendMessage(
      message,
      event.threadID,
      (error, info) => {

        if (error || !info) {
          return;
        }

        if (
          !global.client ||
          !Array.isArray(
            global.client.handleReply
          )
        ) {
          return;
        }

        global.client.handleReply.push({
          name:
            module.exports.config.name,

          messageID:
            info.messageID,

          author:
            event.senderID,

          links
        });

      },
      event.messageID
    );

  } catch (error) {

    console.log(
      "[YOUTUBE SEARCH ERROR]",
      error
    );

    return api.sendMessage(
      `⌬ ━━ HINA MEDIA ━━ ⌬

❌ حدث خطأ أثناء البحث

${error.message || error}`,
      event.threadID,
      event.messageID
    );
  }
};