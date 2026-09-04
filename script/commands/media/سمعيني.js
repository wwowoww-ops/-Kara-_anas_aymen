const fs = require("fs-extra");
const path = require("path");
const ytSearch = require("yt-search");

module.exports.config = {
  name: "سمعيني",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "البحث عن الأغاني وتحميل الصوت فقط من YouTube",
  commandCategory: "media",
  usages: "[اسم الأغنية أو رابط YouTube]",
  cooldowns: 10
};

const MAX_FILE_SIZE = 25 * 1024 * 1024;

const CACHE_DIR = path.join(__dirname, "cache");

let youtube = null;
let youtubeLoading = null;


/* =========================
   تحميل youtubei.js
========================= */

async function getYouTube() {
  if (youtube) return youtube;

  if (youtubeLoading) {
    return youtubeLoading;
  }

  youtubeLoading = (async () => {
    try {
      /*
       * youtubei.js الحديثة ESM
       * لذلك نستعمل import داخل CommonJS
       */
      const module = await import("youtubei.js");

      const Innertube = module.Innertube || module.default?.Innertube;

      if (!Innertube) {
        throw new Error(
          "تعذر العثور على Innertube داخل youtubei.js"
        );
      }

      youtube = await Innertube.create({
        generate_session_locally: true
      });

      return youtube;

    } catch (error) {
      youtubeLoading = null;

      throw new Error(
        `فشل تشغيل youtubei.js\n${formatError(error)}`
      );
    }
  })();

  return youtubeLoading;
}


/* =========================
   معالجة الأخطاء
========================= */

function formatError(error) {
  if (!error) {
    return "خطأ غير معروف";
  }

  if (error.stack) {
    return error.stack;
  }

  if (error.message) {
    return error.message;
  }

  return String(error);
}


async function sendError(api, event, error, extra = "") {
  let text =
`╭───〔 𓆩 𝐇𝐈𝐍𝐀 𓆪 〕───╮
│ ❌ حدث خطأ في أمر سمعيني
╰────────────────────╯

${extra ? extra + "\n\n" : ""}الخطأ:

${formatError(error)}`;

  /*
   * حتى لا تصبح رسالة الخطأ ضخمة جدًا
   */
  if (text.length > 5000) {
    text = text.slice(0, 4900) + "\n\n[تم اختصار الخطأ]";
  }

  return api.sendMessage(text, event.threadID);
}


/* =========================
   تنظيف الملفات
========================= */

async function cleanCache() {
  try {
    await fs.ensureDir(CACHE_DIR);

    const files = await fs.readdir(CACHE_DIR);

    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(CACHE_DIR, file);

      try {
        const stat = await fs.stat(filePath);

        /*
         * حذف الملفات الأقدم من 30 دقيقة
         */
        if (now - stat.mtimeMs > 30 * 60 * 1000) {
          await fs.remove(filePath);
        }

      } catch (_) {}
    }

  } catch (_) {}
}


/* =========================
   استخراج Video ID
========================= */

function extractVideoId(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (
      parsed.hostname.includes("youtube.com") ||
      parsed.hostname.includes("youtube-nocookie.com")
    ) {
      if (parsed.searchParams.get("v")) {
        return parsed.searchParams.get("v");
      }

      const parts = parsed.pathname.split("/").filter(Boolean);

      if (
        parts[0] === "shorts" ||
        parts[0] === "embed" ||
        parts[0] === "live"
      ) {
        return parts[1] || null;
      }
    }

    if (
      parsed.hostname === "youtu.be" ||
      parsed.hostname.endsWith(".youtu.be")
    ) {
      return parsed.pathname.split("/").filter(Boolean)[0] || null;
    }

  } catch (_) {}

  /*
   * في حالة إرسال ID مباشرة
   */
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
}


/* =========================
   التحقق من رابط YouTube
========================= */

function isYouTubeUrl(text) {
  if (!text) return false;

  return (
    /https?:\/\/(?:www\.)?youtube\.com\/watch/i.test(text) ||
    /https?:\/\/youtu\.be\//i.test(text) ||
    /https?:\/\/(?:www\.)?youtube\.com\/shorts\//i.test(text) ||
    /https?:\/\/(?:www\.)?youtube\.com\/live\//i.test(text) ||
    /https?:\/\/(?:www\.)?youtube\.com\/embed\//i.test(text)
  );
}


/* =========================
   تنظيف اسم الملف
========================= */

function safeFileName(name) {
  return String(name || "audio")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100) || "audio";
}


/* =========================
   تحويل Stream إلى File
========================= */

async function saveStreamToFile(stream, filePath, maxSize) {
  const writer = fs.createWriteStream(filePath);

  let total = 0;

  try {
    /*
     * youtubei.js يعيد Web ReadableStream
     * لذلك نتعامل معه عن طريق async iterator
     */
    for await (const chunk of stream) {
      let buffer;

      if (Buffer.isBuffer(chunk)) {
        buffer = chunk;
      } else if (chunk instanceof Uint8Array) {
        buffer = Buffer.from(chunk);
      } else {
        buffer = Buffer.from(chunk);
      }

      total += buffer.length;

      if (total > maxSize) {
        writer.destroy();

        await fs.remove(filePath).catch(() => {});

        throw new Error(
          `حجم الصوت تجاوز الحد المسموح وهو ${Math.round(maxSize / 1024 / 1024)}MB`
        );
      }

      if (!writer.write(buffer)) {
        await new Promise(resolve => {
          writer.once("drain", resolve);
        });
      }
    }

    await new Promise((resolve, reject) => {
      writer.end();

      writer.once("finish", resolve);
      writer.once("error", reject);
    });

    return total;

  } catch (error) {
    writer.destroy();

    await fs.remove(filePath).catch(() => {});

    throw error;
  }
}


/* =========================
   تحميل الصوت
========================= */

async function downloadAudio(videoId, title) {
  const yt = await getYouTube();

  await fs.ensureDir(CACHE_DIR);

  const cleanTitle = safeFileName(title);

  const random = `${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  /*
   * youtubei.js قد يرجع WebM أو M4A
   * لذلك نبدأ بامتداد webm
   * ثم نغيره حسب الـ Content-Type إذا أمكن
   */
  let extension = "webm";

  const filePath = path.join(
    CACHE_DIR,
    `${random}.${extension}`
  );

  /*
   * طلب Audio Only مباشرة
   *
   * لا يوجد video + audio
   * ولا يوجد FFmpeg
   */
  const stream = await yt.download(videoId, {
    type: "audio",
    quality: "best"
  });

  if (!stream) {
    throw new Error(
      "YouTube لم يرجع Stream للصوت"
    );
  }

  /*
   * الحفظ
   */
  const size = await saveStreamToFile(
    stream,
    filePath,
    MAX_FILE_SIZE
  );

  /*
   * محاولة معرفة الامتداد الحقيقي
   */
  try {
    const info = await yt.getBasicInfo(videoId);

    const formats = [
      ...(info.streaming_data?.formats || []),
      ...(info.streaming_data?.adaptive_formats || [])
    ];

    const audioFormats = formats.filter(format => {
      const mime = String(format.mime_type || format.mimeType || "");

      return (
        mime.startsWith("audio/") &&
        !format.has_video &&
        !format.hasVideo
      );
    });

    if (audioFormats.length) {
      const mime = String(
        audioFormats[0].mime_type ||
        audioFormats[0].mimeType ||
        ""
      );

      if (mime.includes("mp4")) {
        extension = "m4a";
      } else if (mime.includes("webm")) {
        extension = "webm";
      }

      const newPath = path.join(
        CACHE_DIR,
        `${random}.${extension}`
      );

      if (newPath !== filePath) {
        await fs.move(filePath, newPath, {
          overwrite: true
        });

        return {
          filePath: newPath,
          size,
          title: cleanTitle,
          extension
        };
      }
    }

  } catch (_) {
    /*
     * عدم معرفة الامتداد لا يمنع إرسال الملف
     */
  }

  return {
    filePath,
    size,
    title: cleanTitle,
    extension
  };
}


/* =========================
   معلومات الفيديو
========================= */

async function getVideoInfo(videoId) {
  const yt = await getYouTube();

  const info = await yt.getBasicInfo(videoId);

  if (
    info.playability_status &&
    info.playability_status.status &&
    info.playability_status.status !== "OK"
  ) {
    throw new Error(
      `الفيديو غير قابل للتشغيل\nالحالة: ${
        info.playability_status.status
      }\n${
        info.playability_status.reason || "لا يوجد سبب محدد"
      }`
    );
  }

  const basic = info.basic_info || {};

  return {
    id: videoId,
    title: basic.title || "صوت بدون عنوان",
    author: basic.author || "غير معروف",
    duration: basic.duration || 0,
    viewCount: basic.view_count || 0
  };
}


/* =========================
   إرسال الصوت
========================= */

async function sendAudio(api, event, data) {
  if (!await fs.pathExists(data.filePath)) {
    throw new Error(
      "تم تحميل الصوت لكن الملف المؤقت غير موجود"
    );
  }

  const stat = await fs.stat(data.filePath);

  if (stat.size <= 0) {
    throw new Error(
      "تم إنشاء الملف لكنه فارغ"
    );
  }

  if (stat.size > MAX_FILE_SIZE) {
    throw new Error(
      `حجم الملف ${Math.round(stat.size / 1024 / 1024)}MB وهو أكبر من الحد المسموح`
    );
  }

  /*
   * نرسل الملف كـ attachment
   * وهذا يتجنب الحاجة لتحويل WebM/M4A إلى MP3
   */
  await api.sendMessage(
    {
      body:
`🎵 ${data.title}

╰─❖ تم تحميل الصوت بنجاح`,
      attachment: fs.createReadStream(data.filePath)
    },
    event.threadID,
    event.messageID
  );

  /*
   * حذف الملف بعد الإرسال
   */
  setTimeout(() => {
    fs.remove(data.filePath).catch(() => {});
  }, 5000);
}


/* =========================
   تحميل مباشر
========================= */

async function processUrl(api, event, url) {
  const videoId = extractVideoId(url);

  if (!videoId) {
    return sendError(
      api,
      event,
      new Error("تعذر استخراج Video ID من الرابط"),
      `الرابط:\n${url}`
    );
  }

  let loadingMessage = null;

  try {
    loadingMessage = await api.sendMessage(
      "⌬ جاري جلب معلومات الصوت...",
      event.threadID
    );

    const info = await getVideoInfo(videoId);

    if (loadingMessage) {
      await api.editMessage(
        `⌬ جاري تحميل الصوت...\n\n🎵 ${info.title}`,
        loadingMessage.messageID
      ).catch(() => {});
    }

    const audio = await downloadAudio(
      videoId,
      info.title
    );

    if (loadingMessage) {
      await api.unsendMessage(
        loadingMessage.messageID
      ).catch(() => {});
    }

    await sendAudio(api, event, audio);

  } catch (error) {
    if (loadingMessage) {
      await api.unsendMessage(
        loadingMessage.messageID
      ).catch(() => {});
    }

    return sendError(
      api,
      event,
      error,
      `الرابط المختار:\n${url}`
    );
  }
}


/* =========================
   البحث
========================= */

async function searchYouTube(query) {
  const result = await ytSearch(query);

  if (!result || !result.videos || !result.videos.length) {
    throw new Error(
      "لم يتم العثور على نتائج"
    );
  }

  return result.videos
    .slice(0, 5)
    .map(video => ({
      id: video.videoId,
      title: video.title,
      duration: video.timestamp || "غير معروف",
      views: video.views || 0,
      author:
        video.author?.name ||
        "غير معروف",
      url:
        video.url ||
        `https://www.youtube.com/watch?v=${video.videoId}`
    }));
}


/* =========================
   عرض نتائج البحث
========================= */

async function showSearchResults(api, event, results) {
  let message =
`╭───〔 𓆩 𝐒𝐎𝐌𝐈 𓆪 〕───╮
│ 🎵 نتائج البحث
╰────────────────────╯

`;

  results.forEach((video, index) => {
    message +=
`${index + 1} ┃ ${video.title}
   ├ المدة: ${video.duration}
   └ القناة: ${video.author}

`;
  });

  message +=
`╰─❖ أرسل رقم الأغنية لتحميل الصوت`;

  const sent = await api.sendMessage(
    message,
    event.threadID
  );

  /*
   * نفس نظام handleReply الموجود في أوامر البوت
   */
  if (!global.client.handleReply) {
    global.client.handleReply = [];
  }

  global.client.handleReply.push({
    name: module.exports.config.name,
    messageID: sent.messageID,
    author: event.senderID,
    links: results
  });

  return sent;
}


/* =========================
   الأمر الرئيسي
========================= */

module.exports.run = async function ({
  api,
  event,
  args
}) {
  try {
    await fs.ensureDir(CACHE_DIR);

    /*
     * تنظيف الملفات القديمة
     */
    cleanCache().catch(() => {});

    const input = args
      .join(" ")
      .trim();

    if (!input) {
      return api.sendMessage(
`╭───〔 𓆩 𝐒𝐎𝐌𝐈 𓆪 〕───╮
│ 🎵 أمر سمعيني
╰────────────────────╯

الاستخدام:

سمعيني اسم الأغنية

أو:

سمعيني رابط YouTube

مثال:

سمعيني Believer

سمعيني https://youtu.be/xxxxxxxxxxx`,
        event.threadID
      );
    }

    /*
     * رابط مباشر
     */
    if (isYouTubeUrl(input)) {
      return processUrl(
        api,
        event,
        input
      );
    }

    /*
     * البحث
     */
    const loading = await api.sendMessage(
      "⌬ جاري البحث عن الأغنية...",
      event.threadID
    );

    try {
      const results = await searchYouTube(input);

      await api.unsendMessage(
        loading.messageID
      ).catch(() => {});

      return showSearchResults(
        api,
        event,
        results
      );

    } catch (error) {
      await api.unsendMessage(
        loading.messageID
      ).catch(() => {});

      return sendError(
        api,
        event,
        error,
        `البحث:\n${input}`
      );
    }

  } catch (error) {
    return sendError(
      api,
      event,
      error
    );
  }
};


/* =========================
   اختيار نتيجة البحث
========================= */

module.exports.handleReply = async function ({
  api,
  event,
  handleReply
}) {
  let filePath = null;

  try {
    /*
     * حماية من الرد من شخص آخر
     */
    if (
      handleReply.author &&
      String(handleReply.author) !== String(event.senderID)
    ) {
      return;
    }

    const input = String(
      event.body || ""
    ).trim();

    const number = parseInt(
      input,
      10
    );

    if (
      !Number.isInteger(number) ||
      number < 1 ||
      number > handleReply.links.length
    ) {
      return api.sendMessage(
        `❌ اختر رقمًا من 1 إلى ${handleReply.links.length}`,
        event.threadID,
        event.messageID
      );
    }

    const selected =
      handleReply.links[number - 1];

    /*
     * حذف رسالة النتائج
     */
    if (handleReply.messageID) {
      await api.unsendMessage(
        handleReply.messageID
      ).catch(() => {});
    }

    const loading = await api.sendMessage(
      `⌬ جاري تحميل الصوت...\n\n🎵 ${selected.title}`,
      event.threadID
    );

    try {
      const info = await getVideoInfo(
        selected.id
      );

      const audio = await downloadAudio(
        selected.id,
        info.title || selected.title
      );

      filePath = audio.filePath;

      await api.unsendMessage(
        loading.messageID
      ).catch(() => {});

      await sendAudio(
        api,
        event,
        audio
      );

      filePath = null;

    } catch (error) {
      await api.unsendMessage(
        loading.messageID
      ).catch(() => {});

      throw error;
    }

  } catch (error) {
    if (filePath) {
      await fs.remove(filePath).catch(() => {});
    }

    return sendError(
      api,
      event,
      error,
      `الأغنية المختارة:\n${
        handleReply?.links?.[0]?.title || "غير معروف"
      }`
    );
  }
};


/* =========================
   حماية إضافية
========================= */

process.on("unhandledRejection", error => {
  console.error(
    "[سمعيني] UNHANDLED REJECTION:",
    error
  );
});

process.on("uncaughtException", error => {
  console.error(
    "[سمعيني] UNCAUGHT EXCEPTION:",
    error
  );
});