"use strict";

/* =========================
   إصلاح File لـ Node 18
========================= */

try {
  const { Blob, File } = require("buffer");

  if (typeof globalThis.Blob === "undefined" && Blob) {
    globalThis.Blob = Blob;
  }

  if (typeof globalThis.File === "undefined" && File) {
    globalThis.File = File;
  }

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
   حماية البوت من الانهيار
========================= */

process.on("unhandledRejection", (reason) => {
  console.error("❌ [يوتيوب] UNHANDLED REJECTION:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ [يوتيوب] UNCAUGHT EXCEPTION:", error);
});


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
      "لم يتم العثور على YtdlCore أو toPipeableStream"
    );
  }

  ytdl = new YtdlCore();

} catch (error) {
  console.error("[يوتيوب] فشل تحميل المكتبة:", error);
  ytdl = null;
}


/* =========================
   الإعدادات
========================= */

const MAX_FILE_SIZE = 25 * 1024 * 1024;

module.exports.config = {
  name: "يوتيوب",
  version: "2.3.0",
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
  console.error("[يوتيوب] فشل إنشاء الكاش:", error);
}


/* =========================
   إرسال الخطأ
========================= */

async function sendError(api, event, error, extra = "") {
  const message =
    error instanceof Error
      ? error.stack || error.message
      : String(error);

  console.error("[يوتيوب ERROR]", message);

  const text =
    `❌ حدث خطأ في أمر يوتيوب\n\n` +
    `${extra ? extra + "\n\n" : ""}` +
    `الخطأ:\n${message}`;

  try {
    await api.sendMessage(text, event.threadID);
  } catch (sendErr) {
    console.error(
      "[يوتيوب] فشل إرسال الخطأ:",
      sendErr
    );
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

  } catch {
    return null;
  }
}


/* =========================
   اختيار أفضل Format
========================= */

function choosePlayableFormat(formats) {
  if (!Array.isArray(formats)) {
    throw new Error("لم يتم العثور على قائمة الصيغ");
  }

  /*
   * نريد صيغة واحدة تحتوي:
   * فيديو + صوت
   *
   * ويفضل MP4
   */

  const playable = formats.filter(format => {
    return (
      format &&
      format.url &&
      format.hasVideo === true &&
      format.hasAudio === true
    );
  });

  if (!playable.length) {
    throw new Error(
      "YouTube لم يوفر أي صيغة تحتوي على فيديو وصوت معًا"
    );
  }

  const mp4 = playable.filter(format => {
    return String(format.container || "").toLowerCase() === "mp4";
  });

  const candidates = mp4.length ? mp4 : playable;

  /*
   * ترتيب حسب الجودة
   */

  candidates.sort((a, b) => {
    const heightA = Number(a.height || 0);
    const heightB = Number(b.height || 0);

    if (heightB !== heightA) {
      return heightB - heightA;
    }

    const bitrateA = Number(a.bitrate || 0);
    const bitrateB = Number(b.bitrate || 0);

    return bitrateB - bitrateA;
  });

  return candidates[0];
}


/* =========================
   تحميل الفيديو
========================= */

async function downloadVideo(url, outputPath) {
  if (!ytdl || !toPipeableStream) {
    throw new Error(
      "مكتبة @ybd-project/ytdl-core غير متاحة"
    );
  }

  console.log("[يوتيوب] الحصول على معلومات الفيديو...");

  let info;

  try {
    info = await ytdl.getBasicInfo(url);
  } catch (error) {
    throw new Error(
      `فشل الحصول على معلومات الفيديو:\n${
        error?.stack || error?.message || error
      }`
    );
  }

  if (!info) {
    throw new Error(
      "YouTube لم يُرجع معلومات الفيديو"
    );
  }

  const formats = info.formats || [];

  console.log(
    `[يوتيوب] عدد الصيغ المستلمة: ${formats.length}`
  );

  if (!formats.length) {
    throw new Error(
      "لم يتم العثور على أي صيغة قابلة للتحميل"
    );
  }

  let format;

  try {
    format = choosePlayableFormat(formats);
  } catch (error) {

    /*
     * طباعة الصيغ الموجودة للمساعدة في التشخيص
     */

    console.error(
      "[يوتيوب] الصيغ المتوفرة:"
    );

    for (const f of formats.slice(0, 20)) {
      console.error({
        itag: f.itag,
        container: f.container,
        quality: f.qualityLabel,
        width: f.width,
        height: f.height,
        hasVideo: f.hasVideo,
        hasAudio: f.hasAudio
      });
    }

    throw error;
  }

  console.log(
    "[يوتيوب] الصيغة المختارة:",
    {
      itag: format.itag,
      container: format.container,
      quality: format.qualityLabel,
      height: format.height,
      hasVideo: format.hasVideo,
      hasAudio: format.hasAudio
    }
  );

  /*
   * نمرر الـ format مباشرة
   *
   * وهذا يمنع المكتبة من محاولة:
   *
   * quality: "highest"
   */

  let stream;

  try {
    stream = await ytdl.download(url, {
      format
    });
  } catch (error) {
    throw new Error(
      `فشل بدء تحميل الصيغة ${format.itag || "unknown"}:\n${
        error?.stack || error?.message || error
      }`
    );
  }

  if (!stream) {
    throw new Error(
      "المكتبة لم تُرجع Stream"
    );
  }

  let pipeableStream;

  try {
    pipeableStream = toPipeableStream(stream);
  } catch (error) {
    throw new Error(
      `فشل تحويل Stream:\n${
        error?.stack || error?.message || error
      }`
    );
  }

  if (!pipeableStream) {
    throw new Error(
      "تعذر تحويل Stream الفيديو"
    );
  }


  /* =========================
     الكتابة إلى الملف
  ========================= */

  await new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(outputPath);

    let settled = false;

    const finish = () => {
      if (settled) return;

      settled = true;
      resolve();
    };

    const fail = error => {
      if (settled) return;

      settled = true;

      try {
        writeStream.destroy();
      } catch {}

      reject(error);
    };


    writeStream.once("finish", finish);

    writeStream.once("error", fail);


    if (typeof pipeableStream.once === "function") {
      pipeableStream.once("error", fail);
    }


    try {
      pipeableStream.pipe(writeStream);
    } catch (error) {
      fail(error);
    }
  });


  /* =========================
     فحص الملف
  ========================= */

  if (!fs.existsSync(outputPath)) {
    throw new Error(
      "لم يتم إنشاء ملف الفيديو"
    );
  }

  const stats = await fs.stat(outputPath);

  console.log(
    `[يوتيوب] تم التحميل: ${(stats.size / 1024 / 1024).toFixed(2)}MB`
  );

  if (!stats.size) {
    await fs.remove(outputPath).catch(() => {});

    throw new Error(
      "ملف الفيديو فارغ"
    );
  }

  if (stats.size > MAX_FILE_SIZE) {
    await fs.remove(outputPath).catch(() => {});

    throw new Error(
      `حجم الفيديو ${(stats.size / 1024 / 1024).toFixed(2)}MB ` +
      `ويتجاوز الحد ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  return outputPath;
}


/* =========================
   إرسال الفيديو
========================= */

async function sendVideo(
  api,
  event,
  filePath,
  title = "YouTube"
) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(
        "ملف الفيديو غير موجود"
      );
    }

    const stats = await fs.stat(filePath);

    if (stats.size > MAX_FILE_SIZE) {
      throw new Error(
        `حجم الفيديو كبير جدًا: ` +
        `${(stats.size / 1024 / 1024).toFixed(2)}MB`
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
    if (!handleReply?.links?.length) {
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
    } catch {}

    const fileName =
      `youtube_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}.mp4`;

    const filePath =
      path.join(cacheDir, fileName);

    try {
      await downloadVideo(
        url,
        filePath
      );

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
        `الرابط المختار:\n${url}`
      );

    } finally {

      if (loadingMessage?.messageID) {
        try {
          await api.unsendMessage(
            loadingMessage.messageID
          );
        } catch {}
      }
    }

  } catch (error) {
    await sendError(
      api,
      event,
      error
    );
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

    const input =
      String(args?.join(" ") || "").trim();

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

      const videoId =
        extractVideoId(input);

      if (!videoId) {
        return api.sendMessage(
          "❌ لم أستطع استخراج معرف الفيديو من الرابط",
          event.threadID
        );
      }

      let loadingMessage;

      try {
        loadingMessage =
          await api.sendMessage(
            "⏳ جاري تحميل الفيديو...",
            event.threadID
          );
      } catch {}

      const fileName =
        `youtube_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}.mp4`;

      const filePath =
        path.join(cacheDir, fileName);

      try {

        await downloadVideo(
          input,
          filePath
        );

        await sendVideo(
          api,
          event,
          filePath,
          "YouTube"
        );

      } catch (error) {

        await fs.remove(filePath)
          .catch(() => {});

        await sendError(
          api,
          event,
          error,
          `الرابط:\n${input}\nVideo ID: ${videoId}`
        );

      } finally {

        if (loadingMessage?.messageID) {
          try {
            await api.unsendMessage(
              loadingMessage.messageID
            );
          } catch {}
        }
      }

      return;
    }


    /* =========================
       البحث
    ========================= */

    let search;

    try {

      search =
        await ytSearch(input);

    } catch (error) {

      return sendError(
        api,
        event,
        error,
        `فشل البحث عن:\n${input}`
      );
    }


    if (!search?.videos?.length) {
      return api.sendMessage(
        "❌ لم يتم العثور على نتائج",
        event.threadID
      );
    }


    const results =
      search.videos.slice(0, 5);


    let message =
      "⌬ ━━ 𝗬𝗼𝘂𝗧𝘂𝗯𝗲 ━━ ⌬\n\n";


    results.forEach(
      (video, index) => {

        message +=
          `${index + 1}. ${video.title}\n` +
          `المدة: ${video.timestamp || "غير معروفة"}\n` +
          `القناة: ${video.author?.name || "غير معروفة"}\n\n`;
      }
    );


    message +=
      "أرسل رقم الفيديو الذي تريد تحميله";


    const sent =
      await api.sendMessage(
        message,
        event.threadID
      );


    if (!global.client.handleReply) {
      global.client.handleReply = [];
    }


    global.client.handleReply.push({

      name:
        module.exports.config.name,

      messageID:
        sent.messageID,

      author:
        event.senderID,

      links:
        results.map(video => video.url),

      titles:
        results.map(video => video.title)

    });

  } catch (error) {

    await sendError(
      api,
      event,
      error
    );
  }
};