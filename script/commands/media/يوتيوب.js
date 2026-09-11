const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const yts = require("yt-search");

module.exports.config = {
  name: "يوتيوب",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "البحث عن فيديوهات يوتيوب وتحميلها",
  commandCategory: "Media",
  usages: "يوتيوب [اسم الفيديو]",
  cooldowns: 10
};

// ==================================================
// إعدادات API
// ==================================================

const NEW_API_BASE =
  "https://engez.a7a.online/api/v1/download/ytdl";

const OLD_API_BASE =
  "https://engez.a7a.online/api/v1/download/youtube";

const REQUEST_TIMEOUT = 120000;


// ==================================================
// أدوات مساعدة
// ==================================================

function cleanText(text) {
  return String(text || "")
    .replace(/\n+/g, " ")
    .trim();
}


function formatDuration(seconds) {
  if (!seconds) return "غير معروف";

  seconds = Number(seconds);

  if (!Number.isFinite(seconds)) {
    return "غير معروف";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return (
      `${hours}:` +
      `${String(minutes).padStart(2, "0")}:` +
      `${String(secs).padStart(2, "0")}`
    );
  }

  return (
    `${minutes}:` +
    `${String(secs).padStart(2, "0")}`
  );
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


// ==================================================
// API الجديد
// ==================================================

async function fetchNewApi(url, type, quality) {
  const apiURL = buildApiUrl(
    NEW_API_BASE,
    url,
    type,
    quality
  );

  const response = await axios.get(apiURL, {
    timeout: REQUEST_TIMEOUT,
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
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
      "الـAPI الجديد لم يرجع رابط التحميل"
    );
  }

  return {
    title:
      data.response.title ||
      "YouTube",

    download_url:
      data.response.download_url,

    type:
      data.response.type === "audio"
        ? "audio"
        : "video",

    quality:
      data.response.requested_quality ||
      quality ||
      "auto"
  };
}


// ==================================================
// API الاحتياطي
// ==================================================

async function fetchOldApi(url, type, quality) {
  const apiURL = buildApiUrl(
    OLD_API_BASE,
    url,
    type,
    quality
  );

  const response = await axios.get(apiURL, {
    timeout: REQUEST_TIMEOUT,
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
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
      "الـAPI الاحتياطي لم يرجع رابط التحميل"
    );
  }

  return {
    title:
      data.data.title ||
      "YouTube",

    download_url:
      data.data.download_url,

    type:
      data.data.type === "mp3" ||
      data.data.type === "audio"
        ? "audio"
        : "video",

    quality:
      data.data.requested_quality ||
      quality ||
      "auto"
  };
}


// ==================================================
// تجربة الجديد ثم الاحتياطي
// ==================================================

async function getDownload(url, type, quality) {
  try {
    console.log(
      "HINA YOUTUBE: تجربة API الجديد..."
    );

    return await fetchNewApi(
      url,
      type,
      quality
    );

  } catch (newError) {

    console.log(
      "HINA YOUTUBE NEW API ERROR:",
      newError.message
    );

    console.log(
      "HINA YOUTUBE: تجربة API الاحتياطي..."
    );

    return await fetchOldApi(
      url,
      type,
      quality
    );
  }
}


// ==================================================
// تحميل الملف
// ==================================================

async function downloadFile(
  url,
  filePath
) {
  const response = await axios.get(
    url,
    {
      responseType: "stream",
      timeout: REQUEST_TIMEOUT,
      maxRedirects: 5,

      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/124.0 Mobile Safari/537.36",

        Accept: "*/*"
      }
    }
  );

  return new Promise(
    (resolve, reject) => {

      const writer =
        fs.createWriteStream(
          filePath
        );

      response.data.pipe(writer);

      writer.on(
        "finish",
        resolve
      );

      writer.on(
        "error",
        reject
      );
    }
  );
}


// ==================================================
// حذف ملف
// ==================================================

async function removeFile(file) {
  try {
    if (
      file &&
      fs.existsSync(file)
    ) {
      await fs.unlink(file);
    }
  } catch (error) {
    console.log(
      "HINA YOUTUBE CLEAN ERROR:",
      error.message
    );
  }
}


// ==================================================
// إضافة HandleReply
// ==================================================

function addHandleReply(data) {
  if (
    !Array.isArray(
      global.client.handleReply
    )
  ) {
    global.client.handleReply = [];
  }

  global.client.handleReply.push(data);
}


// ==================================================
// أمر يوتيوب
// ==================================================

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

  const query =
    Array.isArray(args)
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

    // ==============================================
    // البحث
    // ==============================================

    const result =
      await yts(query);

    const videos =
      Array.isArray(result.videos)
        ? result.videos.slice(0, 10)
        : [];

    if (
      videos.length === 0
    ) {

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

    // ==============================================
    // إنشاء القائمة
    // ==============================================

    let msg =
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n";

    msg +=
      `نتائج البحث عن:\n${query}\n\n`;

    videos.forEach(
      (video, index) => {

        msg +=
          `${index + 1} ┊ ` +
          `${cleanText(video.title)}\n`;

        msg +=
          `   المدة: ` +
          `${formatDuration(video.seconds)}\n`;

        msg +=
          `   القناة: ` +
          `${cleanText(
            video.author?.name ||
            "غير معروف"
          )}\n\n`;
      }
    );

    msg +=
      "━━━━━━━━━━━━━━━━━━\n" +
      "أرسل رقم الفيديو للمتابعة";

    api.setMessageReaction(
      "✅",
      messageID,
      () => {},
      true
    );

    // ==============================================
    // إرسال القائمة
    // ==============================================

    return api.sendMessage(
      msg,
      threadID,

      (error, info) => {

        if (error) {

          console.error(
            "HINA YOUTUBE LIST ERROR:",
            error
          );

          return;
        }

        if (
          !info ||
          !info.messageID
        ) {

          console.error(
            "HINA YOUTUBE: لم يتم الحصول على messageID"
          );

          return;
        }

        // ==========================================
        // تسجيل الرد بالطريقة الصحيحة
        // ==========================================

        addHandleReply({
          name: "يوتيوب",

          messageID:
            info.messageID,

          author:
            String(senderID),

          type:
            "youtubeSearch",

          videos
        });

        console.log(
          `𝗛𝗜𝗡𝗔 | يوتيوب | Search HR: ${info.messageID}`
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


// ==================================================
// HandleReply
// ==================================================

module.exports.handleReply = async function ({
  api,
  event,
  handleReply
}) {

  try {

    if (!handleReply) {
      return;
    }

    if (
      handleReply.name !==
      "يوتيوب"
    ) {
      return;
    }

    // ==============================================
    // التأكد من صاحب القائمة
    // ==============================================

    if (
      String(event.senderID) !==
      String(handleReply.author)
    ) {
      return;
    }

    const body =
      String(
        event.body || ""
      ).trim();

    if (!body) {
      return;
    }


    // ==================================================
    // المرحلة الأولى
    // اختيار الفيديو
    // ==================================================

    if (
      handleReply.type ===
      "youtubeSearch"
    ) {

      const choice =
        parseInt(
          body,
          10
        );

      const videos =
        Array.isArray(
          handleReply.videos
        )
          ? handleReply.videos
          : [];

      if (
        !Number.isInteger(choice) ||
        choice < 1 ||
        choice > videos.length
      ) {

        return api.sendMessage(
          "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n" +

          `اختر رقمًا من 1 إلى ${videos.length}`,

          event.threadID,
          event.messageID
        );
      }

      const video =
        videos[choice - 1];

      if (
        !video ||
        !video.url ||
        !isYouTubeUrl(
          video.url
        )
      ) {

        return api.sendMessage(
          "تعذر الحصول على رابط الفيديو.",

          event.threadID,
          event.messageID
        );
      }

      // ==============================================
      // حذف HandleReply القديم
      // ==============================================

      const oldIndex =
        global.client.handleReply
          .indexOf(handleReply);

      if (
        oldIndex !== -1
      ) {

        global.client.handleReply.splice(
          oldIndex,
          1
        );
      }

      // ==============================================
      // قائمة النوع
      // ==============================================

      const typeMessage =
        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n" +

        `الفيديو:\n` +
        `${cleanText(video.title)}\n\n` +

        "اختر نوع التحميل:\n\n" +

        "1 ┊ فيديو\n" +
        "2 ┊ صوت\n\n" +

        "أرسل رقم الاختيار";

      return api.sendMessage(
        typeMessage,
        event.threadID,

        (error, info) => {

          if (error) {

            console.error(
              "HINA YOUTUBE TYPE ERROR:",
              error
            );

            return;
          }

          if (
            !info ||
            !info.messageID
          ) {

            console.error(
              "HINA YOUTUBE: لا يوجد messageID للقائمة الثانية"
            );

            return;
          }

          // ==========================================
          // تسجيل القائمة الثانية
          // ==========================================

          addHandleReply({
            name: "يوتيوب",

            messageID:
              info.messageID,

            author:
              String(event.senderID),

            type:
              "youtubeType",

            video
          });

          console.log(
            `𝗛𝗜𝗡𝗔 | يوتيوب | Type HR: ${info.messageID}`
          );
        },

        event.messageID
      );
    }


    // ==================================================
    // المرحلة الثانية
    // اختيار فيديو أو صوت
    // ==================================================

    if (
      handleReply.type ===
      "youtubeType"
    ) {

      const choice =
        parseInt(
          body,
          10
        );

      if (
        choice !== 1 &&
        choice !== 2
      ) {

        return api.sendMessage(
          "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n" +

          "أرسل:\n\n" +

          "1 للفيديو\n" +
          "2 للصوت",

          event.threadID,
          event.messageID
        );
      }

      const video =
        handleReply.video;

      if (
        !video ||
        !video.url ||
        !isYouTubeUrl(
          video.url
        )
      ) {

        return api.sendMessage(
          "رابط الفيديو غير صالح.",

          event.threadID,
          event.messageID
        );
      }

      // ==============================================
      // حذف HandleReply
      // ==============================================

      const oldIndex =
        global.client.handleReply
          .indexOf(handleReply);

      if (
        oldIndex !== -1
      ) {

        global.client.handleReply.splice(
          oldIndex,
          1
        );
      }

      // ==============================================
      // تحديد النوع
      // ==============================================

      const type =
        choice === 1
          ? "video"
          : "audio";

      const quality =
        choice === 1
          ? "720p"
          : "320kbps";

      // ==============================================
      // رسالة الانتظار
      // ==============================================

      api.setMessageReaction(
        "⏳",
        event.messageID,
        () => {},
        true
      );

      const waitMessage =
        await api.sendMessage(
          "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n" +

          "جاري تجهيز التحميل...\n\n" +

          `النوع: ${
            type === "video"
              ? "فيديو"
              : "صوت"
          }\n` +

          `الجودة: ${quality}`,

          event.threadID
        );

      // ==============================================
      // طلب رابط التحميل
      // ==============================================

      let download;

      try {

        download =
          await getDownload(
            video.url,
            type,
            quality
          );

      } catch (downloadError) {

        console.error(
          "HINA YOUTUBE DOWNLOAD API ERROR:",
          downloadError
        );

        api.setMessageReaction(
          "❌",
          event.messageID,
          () => {},
          true
        );

        return api.sendMessage(
          "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n" +

          "تعذر الحصول على رابط التحميل.\n\n" +

          `${downloadError.message || "الـAPI لا يستجيب"}`,

          event.threadID,
          event.messageID
        );
      }

      if (
        !download ||
        !download.download_url
      ) {

        return api.sendMessage(
          "لم يتم الحصول على رابط تحميل صالح.",

          event.threadID,
          event.messageID
        );
      }

      // ==============================================
      // الكاش
      // ==============================================

      const cacheDir =
        path.join(
          __dirname,
          "cache"
        );

      await fs.ensureDir(
        cacheDir
      );

      const safeName =
        cleanText(
          video.title
        )
          .replace(
            /[\\/:*?"<>|]/g,
            "_"
          )
          .substring(0, 80);

      const extension =
        type === "audio"
          ? "mp3"
          : "mp4";

      const filePath =
        path.join(
          cacheDir,
          `youtube_${event.senderID}_${Date.now()}_${safeName}.${extension}`
        );

      // ==============================================
      // تحميل الملف
      // ==============================================

      try {

        await downloadFile(
          download.download_url,
          filePath
        );

      } catch (fileError) {

        console.error(
          "HINA YOUTUBE FILE ERROR:",
          fileError
        );

        await removeFile(
          filePath
        );

        api.setMessageReaction(
          "❌",
          event.messageID,
          () => {},
          true
        );

        return api.sendMessage(
          "فشل تحميل الملف من رابط الـAPI.",

          event.threadID,
          event.messageID
        );
      }

      // ==============================================
      // التأكد من وجود الملف
      // ==============================================

      if (
        !fs.existsSync(
          filePath
        )
      ) {

        return api.sendMessage(
          "لم يتم إنشاء ملف التحميل.",

          event.threadID,
          event.messageID
        );
      }

      const stat =
        await fs.stat(
          filePath
        );

      if (
        !stat.size
      ) {

        await removeFile(
          filePath
        );

        return api.sendMessage(
          "الملف الناتج فارغ.",

          event.threadID,
          event.messageID
        );
      }

      // ==============================================
      // إرسال الملف
      // ==============================================

      try {

        await api.sendMessage(
          {
            body:
              "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n" +

              `${cleanText(video.title)}\n\n` +

              `النوع: ${
                type === "video"
                  ? "فيديو"
                  : "صوت"
              }\n` +

              `الجودة: ${quality}`,

            attachment:
              fs.createReadStream(
                filePath
              )
          },

          event.threadID
        );

        api.setMessageReaction(
          "✅",
          event.messageID,
          () => {},
          true
        );

      } finally {

        await removeFile(
          filePath
        );
      }

      // ==============================================
      // حذف رسالة الانتظار إن أمكن
      // ==============================================

      if (
        waitMessage &&
        waitMessage.messageID
      ) {

        try {

          await api.unsendMessage(
            waitMessage.messageID
          );

        } catch {}
      }

    }

  } catch (error) {

    console.error(
      "HINA YOUTUBE HANDLE ERROR:",
      error
    );

    api.setMessageReaction(
      "❌",
      event.messageID,
      () => {},
      true
    );

    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n" +

      "حدث خطأ أثناء تنفيذ الأمر.\n\n" +

      `${error.message || "خطأ غير معروف"}`,

      event.threadID,
      event.messageID
    );
  }
};