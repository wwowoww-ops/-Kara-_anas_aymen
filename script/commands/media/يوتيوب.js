"use strict";

/*
 * إصلاح مشكلة:
 * ReferenceError: File is not defined
 *
 * يجب أن يكون هذا الجزء قبل أي require
 * لمكتبات قد تستعمل cheerio / undici
 */

try {
  const { Blob, File } = require("buffer");

  if (typeof globalThis.Blob === "undefined" && Blob) {
    globalThis.Blob = Blob;
  }

  if (typeof globalThis.File === "undefined" && File) {
    globalThis.File = File;
  }

  // دعم إضافي لبعض إصدارات undici على Node 18
  const { toUSVString } = require("util");

  if (typeof String.prototype.toWellFormed !== "function") {
    String.prototype.toWellFormed = function () {
      return toUSVString(this);
    };
  }

  if (typeof String.prototype.isWellFormed !== "function") {
    String.prototype.isWellFormed = function () {
      return toUSVString(this) === this;
    };
  }

} catch (err) {
  console.error("[يوتيوب] فشل تجهيز توافق Node.js:", err);
}


/* =========================
   المكتبات
========================= */

const fs = require("fs-extra");
const path = require("path");
const ytSearch = require("yt-search");

let YtdlCore;
let toPipeableStream;
let ytdl;

try {
  const ytdlCore = require("@ybd-project/ytdl-core");

  YtdlCore = ytdlCore.YtdlCore;
  toPipeableStream = ytdlCore.toPipeableStream;

  if (!YtdlCore || !toPipeableStream) {
    throw new Error(
      "لم يتم العثور على YtdlCore أو toPipeableStream داخل @ybd-project/ytdl-core"
    );
  }

  ytdl = new YtdlCore();

} catch (error) {
  console.error("[يوتيوب] فشل تحميل @ybd-project/ytdl-core");
  console.error(error);

  ytdl = null;
}


/* =========================
   الإعدادات
========================= */

const MAX_FILE_SIZE = 25 * 1024 * 1024;

module.exports.config = {
  name: "يوتيوب",
  version: "2.2.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "البحث وتحميل فيديوهات YouTube",
  commandCategory: "media",
  usages: "[اسم الفيديو أو رابط YouTube]",
  cooldowns: 10
};


/* =========================
   مجلد الكاش
========================= */

const cacheDir = path.join(__dirname, "cache");

try {
  fs.ensureDirSync(cacheDir);
} catch (error) {
  console.error("[يوتيوب] فشل إنشاء مجلد الكاش:", error);
}


/* =========================
   إرسال الأخطاء للمجموعة
========================= */

async function sendError(api, event, error, extra = "") {
  let message = "";

  if (error instanceof Error) {
    message = error.stack || error.message;
  } else {
    message = String(error);
  }

  const text =
    `❌ حدث خطأ في أمر يوتيوب\n\n` +
    `${extra ? extra + "\n\n" : ""}` +
    `الخطأ:\n${message}`;

  console.error("[يوتيوب ERROR]", message);

  try {
    await api.sendMessage(text, event.threadID);
  } catch (sendErr) {
    console.error("[يوتيوب] تعذر إرسال الخطأ للمجموعة:", sendErr);
  }
}


/* =========================
   فحص رابط يوتيوب
========================= */

function isYouTubeUrl(input) {
  if (!input) return false;

  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(
    input.trim()
  );
}


/* =========================
   استخراج Video ID
========================= */

function extractVideoId(url) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1);
    }

    if (parsed.searchParams.get("v")) {
      return parsed.searchParams.get("v");
    }

    const match = parsed.pathname.match(
      /\/(?:shorts|embed|live)\/([^/?]+)/
    );

    return match ? match[1] : null;

  } catch (error) {
    return null;
  }
}


/* =========================
   تحميل الفيديو
========================= */

async function downloadVideo(url, outputPath) {
  if (!ytdl || !toPipeableStream) {
    throw new Error(
      "مكتبة @ybd-project/ytdl-core لم يتم تحميلها بشكل صحيح"
    );
  }

  const stream = await ytdl.download(url);

  if (!stream) {
    throw new Error("المكتبة لم تُرجع Stream للفيديو");
  }

  const pipeableStream = toPipeableStream(stream);

  if (!pipeableStream) {
    throw new Error("تعذر تحويل Stream الفيديو");
  }

  await new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(outputPath);

    let finished = false;

    const cleanup = () => {
      if (finished) return;
      finished = true;
    };

    writeStream.on("finish", () => {
      cleanup();
      resolve();
    });

    writeStream.on("error", (error) => {
      cleanup();
      reject(error);
    });

    pipeableStream.on?.("error", (error) => {
      cleanup();
      reject(error);
    });

    pipeableStream.pipe(writeStream);
  });

  if (!fs.existsSync(outputPath)) {
    throw new Error("لم يتم إنشاء ملف الفيديو");
  }

  const stats = await fs.stat(outputPath);

  if (!stats.size) {
    throw new Error("ملف الفيديو فارغ");
  }

  if (stats.size > MAX_FILE_SIZE) {
    await fs.remove(outputPath).catch(() => {});

    throw new Error(
      `حجم الفيديو أكبر من الحد المسموح به (${MAX_FILE_SIZE / 1024 / 1024}MB)`
    );
  }

  return outputPath;
}


/* =========================
   إرسال الفيديو
========================= */

async function sendVideo(api, event, filePath, title = "YouTube") {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error("ملف الفيديو غير موجود بعد التحميل");
    }

    const stats = await fs.stat(filePath);

    if (stats.size > MAX_FILE_SIZE) {
      throw new Error(
        `حجم الفيديو ${(stats.size / 1024 / 1024).toFixed(2)}MB ` +
        `ويتجاوز الحد ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    await api.sendMessage(
      {
        body: `🎬 ${title}`,
        attachment: fs.createReadStream(filePath)
      },
      event.threadID
    );

  } finally {
    await fs.remove(filePath).catch(() => {});
  }
}


/* =========================
   Handle Reply
========================= */

module.exports.handleReply = async function ({
  api,
  event,
  handleReply
}) {
  try {
    if (!handleReply || !handleReply.links) {
      return;
    }

    if (
      handleReply.author &&
      String(event.senderID) !== String(handleReply.author)
    ) {
      return;
    }

    const choice = parseInt(
      String(event.body || "").trim(),
      10
    );

    if (
      Number.isNaN(choice) ||
      choice < 1 ||
      choice > handleReply.links.length
    ) {
      return api.sendMessage(
        `❌ اختر رقمًا من 1 إلى ${handleReply.links.length}`,
        event.threadID
      );
    }

    const url = handleReply.links[choice - 1];

    let loadingMessage;

    try {
      loadingMessage = await api.sendMessage(
        "⏳ جاري تحميل الفيديو...",
        event.threadID
      );
    } catch (_) {}

    const fileName =
      `youtube_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}.mp4`;

    const filePath = path.join(cacheDir, fileName);

    try {
      await downloadVideo(url, filePath);

      await sendVideo(
        api,
        event,
        filePath,
        handleReply.titles?.[choice - 1] || "YouTube"
      );

    } catch (error) {
      await fs.remove(filePath).catch(() => {});

      await sendError(
        api,
        event,
        error,
        `الرابط المختار: ${url}`
      );

    } finally {
      if (loadingMessage?.messageID) {
        try {
          await api.unsendMessage(loadingMessage.messageID);
        } catch (_) {}
      }
    }

  } catch (error) {
    await sendError(api, event, error);
  }
};


/* =========================
   الأمر الرئيسي
========================= */

module.exports.run = async function ({
  api,
  event,
  args
}) {
  try {
    const input = String(args?.join(" ") || "").trim();

    if (!input) {
      return api.sendMessage(
        "❌ استخدم الأمر هكذا:\n.يوتيوب اسم الفيديو",
        event.threadID
      );
    }


    /* =========================
       رابط مباشر
    ========================= */

    if (isYouTubeUrl(input)) {
      const videoId = extractVideoId(input);

      if (!videoId) {
        return api.sendMessage(
          "❌ لم أستطع استخراج معرف الفيديو من الرابط",
          event.threadID
        );
      }

      let loadingMessage;

      try {
        loadingMessage = await api.sendMessage(
          "⏳ جاري تجهيز الفيديو...",
          event.threadID
        );
      } catch (_) {}

      const fileName =
        `youtube_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}.mp4`;

      const filePath = path.join(cacheDir, fileName);

      try {
        await downloadVideo(input, filePath);

        await sendVideo(
          api,
          event,
          filePath,
          "YouTube"
        );

      } catch (error) {
        await fs.remove(filePath).catch(() => {});

        await sendError(
          api,
          event,
          error,
          `الرابط: ${input}\nVideo ID: ${videoId}`
        );

      } finally {
        if (loadingMessage?.messageID) {
          try {
            await api.unsendMessage(loadingMessage.messageID);
          } catch (_) {}
        }
      }

      return;
    }


    /* =========================
       البحث
    ========================= */

    let search;

    try {
      search = await ytSearch(input);
    } catch (error) {
      return sendError(
        api,
        event,
        error,
        `فشل البحث عن: ${input}`
      );
    }

    if (!search?.videos?.length) {
      return api.sendMessage(
        "❌ لم يتم العثور على نتائج",
        event.threadID
      );
    }

    const results = search.videos.slice(0, 5);

    let message = "⌬ ━━ 𝗬𝗼𝘂𝗧𝘂𝗯𝗲 ━━ ⌬\n\n";

    results.forEach((video, index) => {
      message +=
        `${index + 1}. ${video.title}\n` +
        `المدة: ${video.timestamp || "غير معروفة"}\n` +
        `القناة: ${video.author?.name || "غير معروفة"}\n\n`;
    });

    message +=
      "أرسل رقم الفيديو الذي تريد تحميله";

    const sent = await api.sendMessage(
      message,
      event.threadID
    );

    if (!global.client.handleReply) {
      global.client.handleReply = [];
    }

    global.client.handleReply.push({
      name: module.exports.config.name,
      messageID: sent.messageID,
      author: event.senderID,
      links: results.map(video => video.url),
      titles: results.map(video => video.title)
    });

  } catch (error) {
    await sendError(api, event, error);
  }
};