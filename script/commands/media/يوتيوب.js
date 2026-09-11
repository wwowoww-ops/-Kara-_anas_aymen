const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports.config = {
  name: "يوتيوب",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "البحث عن فيديوهات يوتيوب وتحميلها",
  commandCategory: "media",
  usages: "يوتيوب [اسم الفيديو]",
  cooldowns: 10
};

const NEW_API_BASE =
  "https://engez.a7a.online/api/v1/download/ytdl";

const OLD_API_BASE =
  "https://engez.a7a.online/api/v1/download/youtube";

const DOWNLOAD_TIMEOUT = 120000;

function cleanText(text) {
  return String(text || "")
    .replace(/\n+/g, " ")
    .trim();
}

function formatDuration(seconds) {
  if (!seconds) return "غير معروف";

  seconds = Number(seconds);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return `${m}:${String(s).padStart(2, "0")}`;
}

function isYouTubeUrl(url) {
  try {
    const parsed = new URL(url);

    const host = parsed.hostname
      .replace(/^www\./i, "")
      .replace(/^m\./i, "");

    return (
      host === "youtube.com" ||
      host.endsWith(".youtube.com") ||
      host === "youtu.be"
    );
  } catch {
    return false;
  }
}

function buildApiUrl(base, url, type, quality) {
  const params = new URLSearchParams();

  params.set("url", url);

  if (type) {
    params.set("type", type);
  }

  if (quality) {
    params.set("quality", quality);
  }

  return `${base}?${params.toString()}`;
}

/**
 * المصدر الجديد
 */
async function fetchNewApi(url, type, quality) {
  const apiURL = buildApiUrl(
    NEW_API_BASE,
    url,
    type,
    quality
  );

  const response = await axios.get(apiURL, {
    timeout: DOWNLOAD_TIMEOUT
  });

  const data = response.data;

  if (
    !data ||
    data.success !== true ||
    !data.response ||
    !data.response.download_url
  ) {
    throw new Error(
      data?.error ||
      "المصدر الرئيسي لم يرجع رابط التحميل"
    );
  }

  return {
    title: data.response.title || "YouTube",
    download_url: data.response.download_url,
    type:
      data.response.type === "audio"
        ? "audio"
        : "video",
    quality:
      data.response.requested_quality ||
      quality ||
      "auto",
    source: "new"
  };
}

/**
 * المصدر الاحتياطي
 */
async function fetchOldApi(url, type, quality) {
  const apiURL = buildApiUrl(
    OLD_API_BASE,
    url,
    type,
    quality
  );

  const response = await axios.get(apiURL, {
    timeout: DOWNLOAD_TIMEOUT
  });

  const data = response.data;

  if (
    !data ||
    data.success !== true ||
    !data.data ||
    !data.data.download_url
  ) {
    throw new Error(
      data?.error ||
      "المصدر الاحتياطي لم يرجع رابط التحميل"
    );
  }

  return {
    title: data.data.title || "YouTube",
    download_url: data.data.download_url,
    type:
      data.data.type === "mp3" ||
      data.data.type === "audio"
        ? "audio"
        : "video",
    quality:
      data.data.requested_quality ||
      quality ||
      "auto",
    source: "old"
  };
}

/**
 * يجرب المصدر الجديد
 * وإذا فشل يستخدم القديم
 */
async function getDownload(url, type, quality) {
  try {
    return await fetchNewApi(
      url,
      type,
      quality
    );
  } catch (error) {
    console.log(
      "HINA YOUTUBE NEW API FAILED:",
      error.message
    );

    return await fetchOldApi(
      url,
      type,
      quality
    );
  }
}

/**
 * تحميل الملف إلى الكاش
 */
async function downloadFile(url, filePath) {
  const response = await axios.get(url, {
    responseType: "stream",
    timeout: DOWNLOAD_TIMEOUT,
    maxRedirects: 5,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36",
      Accept: "*/*"
    }
  });

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

/**
 * حذف الملف
 */
async function removeFile(file) {
  try {
    if (file && fs.existsSync(file)) {
      await fs.unlink(file);
    }
  } catch {}
}

module.exports.run = async function ({
  api,
  event,
  args
}) {
  const {
    threadID,
    messageID,
    senderID
  } = event;

  const query = Array.isArray(args)
    ? args.join(" ").trim()
    : "";

  if (!query) {
    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n" +
      "اكتب اسم الفيديو الذي تريد البحث عنه.\n\n" +
      "مثال:\n" +
      ".يوتيوب Aizen Bankai",
      threadID,
      messageID
    );
  }

  try {
    api.setMessageReaction(
      "⏳",
      messageID,
      () => {},
      true
    );

    const result = await yts(query);

    const videos = Array.isArray(result.videos)
      ? result.videos.slice(0, 10)
      : [];

    if (videos.length === 0) {
      api.setMessageReaction(
        "❌",
        messageID,
        () => {},
        true
      );

      return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n" +
        "لم أجد نتائج لهذا البحث.",
        threadID,
        messageID
      );
    }

    let msg =
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n";

    msg += `نتائج البحث عن:\n${query}\n\n`;

    videos.forEach((video, index) => {
      msg +=
        `${index + 1} ┊ ${cleanText(video.title)}\n` +
        `   المدة: ${formatDuration(video.seconds)}\n` +
        `   القناة: ${cleanText(video.author?.name || "غير معروف")}\n\n`;
    });

    msg +=
      "━━━━━━━━━━━━━━━━━━\n" +
      "أرسل رقم الفيديو للمتابعة";

    api.setMessageReaction(
      "✅",
      messageID,
      () => {},
      true
    );

    return api.sendMessage(
      msg,
      threadID,
      (error, info) => {
        if (error || !info?.messageID) {
          console.error(
            "HINA YOUTUBE LIST ERROR:",
            error
          );
          return;
        }

        if (!Array.isArray(global.client.handleReply)) {
          global.client.handleReply = [];
        }

        global.client.handleReply.push({
          name: "يوتيوب",
          messageID: info.messageID,
          author: String(senderID),
          type: "youtubeSearch",
          videos
        });

        console.log(
          `𝗛𝗜𝗡𝗔 | يوتيوب | HR registered: ${info.messageID}`
        );
      },
      messageID
    );

  } catch (error) {
    console.error(
      "HINA YOUTUBE SEARCH ERROR:",
      error
    );

    api.setMessageReaction(
      "❌",
      messageID,
      () => {},
      true
    );

    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n" +
      "حدث خطأ أثناء البحث.\n\n" +
      `${error.message || "خطأ غير معروف"}`,
      threadID,
      messageID
    );
  }
};

/**
 * اختيار الفيديو
 */
module.exports.handleReply = async function ({
  api,
  event,
  handleReply
}) {
  try {
    if (
      !handleReply ||
      handleReply.name !== "يوتيوب" ||
      handleReply.type !== "youtubeSearch"
    ) {
      return;
    }

    if (
      String(event.senderID) !==
      String(handleReply.author)
    ) {
      return;
    }

    const body = String(
      event.body || ""
    ).trim();

    const choice = parseInt(body, 10);

    const videos = Array.isArray(handleReply.videos)
      ? handleReply.videos
      : [];

    if (
      !Number.isInteger(choice) ||
      choice < 1 ||
      choice > videos.length
    ) {
      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n` +
        `اختر رقمًا من 1 إلى ${videos.length}`,
        event.threadID,
        event.messageID
      );
    }

    const video = videos[choice - 1];

    if (!video || !isYouTubeUrl(video.url)) {
      return api.sendMessage(
        "تعذر الحصول على رابط الفيديو.",
        event.threadID,
        event.messageID
      );
    }

    const index =
      global.client.handleReply.indexOf(
        handleReply
      );

    if (index !== -1) {
      global.client.handleReply.splice(
        index,
        1
      );
    }

    const qualityMessage =
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n" +
      `الفيديو:\n${cleanText(video.title)}\n\n` +
      "اختر نوع التحميل:\n\n" +
      "1 ┊ فيديو\n" +
      "2 ┊ صوت\n\n" +
      "أرسل رقم الاختيار";

    return api.sendMessage(
      qualityMessage,
      event.threadID,
      (error, info) => {
        if (error || !info?.messageID) {
          console.error(
            "HINA YOUTUBE TYPE LIST ERROR:",
            error
          );
          return;
        }

        if (!Array.isArray(global.client.handleReply)) {
          global.client.handleReply = [];
        }

        global.client.handleReply.push({
          name: "يوتيوب",
          messageID: info.messageID,
          author: String(event.senderID),
          type: "youtubeType",
          video
        });
      },
      event.messageID
    );

  } catch (error) {
    console.error(
      "HINA YOUTUBE SELECT ERROR:",
      error
    );

    return api.sendMessage(
      "حدث خطأ أثناء اختيار الفيديو.",
      event.threadID,
      event.messageID
    );
  }
};

/**
 * اختيار فيديو أو صوت
 */
module.exports.handleReply = async function ({
  api,
  event,
  handleReply
}) {
  // هذا الجزء سيتم دمجه مع المعالج أدناه
};