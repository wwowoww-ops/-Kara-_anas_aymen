"use strict";

/* =========================
   Node 18 - File / Blob Fix
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

} catch (error) {
  console.error(
    "[يوتيوب] فشل تجهيز توافق Node.js:",
    error
  );
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

  const ytdlCore =
    require("@ybd-project/ytdl-core");

  YtdlCore =
    ytdlCore.YtdlCore;

  toPipeableStream =
    ytdlCore.toPipeableStream;

  if (!YtdlCore) {
    throw new Error(
      "YtdlCore غير موجود"
    );
  }

  if (!toPipeableStream) {
    throw new Error(
      "toPipeableStream غير موجود"
    );
  }

  ytdl =
    new YtdlCore();

  console.log(
    "[يوتيوب] تم تحميل ytdl-core بنجاح"
  );

} catch (error) {

  console.error(
    "[يوتيوب] فشل تحميل ytdl-core:",
    error
  );

  ytdl = null;
}


/* =========================
   حماية عامة
========================= */

process.on(
  "unhandledRejection",
  reason => {
    console.error(
      "❌ [يوتيوب] UNHANDLED REJECTION:",
      reason
    );
  }
);

process.on(
  "uncaughtException",
  error => {
    console.error(
      "❌ [يوتيوب] UNCAUGHT EXCEPTION:",
      error
    );
  }
);


/* =========================
   الإعدادات
========================= */

const MAX_FILE_SIZE =
  25 * 1024 * 1024;

module.exports.config = {

  name: "يوتيوب",

  version: "2.4.0",

  hasPermssion: 0,

  credits: "أبو هريرة",

  description:
    "البحث وتحميل فيديوهات YouTube",

  commandCategory: "media",

  usages:
    "[اسم الفيديو أو رابط YouTube]",

  cooldowns: 10
};


/* =========================
   الكاش
========================= */

const cacheDir =
  path.join(__dirname, "cache");

try {

  fs.ensureDirSync(cacheDir);

} catch (error) {

  console.error(
    "[يوتيوب] فشل إنشاء مجلد الكاش:",
    error
  );
}


/* =========================
   إرسال الأخطاء
========================= */

async function sendError(
  api,
  event,
  error,
  extra = ""
) {

  const message =
    error instanceof Error
      ? error.stack || error.message
      : String(error);

  console.error(
    "[يوتيوب ERROR]",
    message
  );

  const text =
    `❌ حدث خطأ في أمر يوتيوب\n\n` +
    `${extra ? extra + "\n\n" : ""}` +
    `الخطأ:\n${message}`;

  try {

    await api.sendMessage(
      text,
      event.threadID
    );

  } catch (sendError) {

    console.error(
      "[يوتيوب] تعذر إرسال الخطأ:",
      sendError
    );
  }
}


/* =========================
   YouTube URL
========================= */

function isYouTubeUrl(input) {

  if (!input) {
    return false;
  }

  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i
    .test(input.trim());
}


/* =========================
   استخراج ID
========================= */

function extractVideoId(url) {

  try {

    const parsed =
      new URL(url);

    if (
      parsed.hostname
        .toLowerCase()
        .includes("youtu.be")
    ) {

      return parsed.pathname
        .slice(1)
        .split("/")[0];
    }

    const videoId =
      parsed.searchParams.get("v");

    if (videoId) {
      return videoId;
    }

    const match =
      parsed.pathname.match(
        /\/(?:shorts|embed|live)\/([^/?]+)/
      );

    return match
      ? match[1]
      : null;

  } catch {

    return null;
  }
}


/* =========================
   معلومات الصيغ
========================= */

function formatDescription(format) {

  if (!format) {
    return "غير معروف";
  }

  return (
    `itag=${format.itag || "?"}` +
    ` | النوع=${format.mimeType || "?"}` +
    ` | container=${format.container || "?"}` +
    ` | الجودة=${format.qualityLabel || "?"}` +
    ` | video=${format.hasVideo ? "yes" : "no"}` +
    ` | audio=${format.hasAudio ? "yes" : "no"}` +
    ` | bitrate=${format.bitrate || "?"}`
  );
}


/* =========================
   اختيار صيغة مدمجة
========================= */

function choosePlayableFormat(formats) {

  if (!Array.isArray(formats)) {

    throw new Error(
      "YouTube لم يرجع قائمة Formats"
    );
  }

  /*
   * أولاً:
   * صيغة تحتوي فيديو وصوت معًا
   */

  const combined =
    formats.filter(format => {

      return (
        format &&
        format.url &&
        format.hasVideo === true &&
        format.hasAudio === true
      );

    });


  if (!combined.length) {

    const available =
      formats
        .filter(
          format =>
            format &&
            format.url
        )
        .slice(0, 20)
        .map(formatDescription)
        .join("\n");


    throw new Error(
      "لم يتم العثور على صيغة فيديو + صوت مدمجة.\n\n" +
      "الصيغ التي رجعتها YouTube:\n" +
      (available ||
        "لا توجد صيغ قابلة للاستخدام")
    );
  }


  /*
   * نحاول تفضيل MP4
   */

  const mp4 =
    combined.filter(format => {

      return String(
        format.container || ""
      ).toLowerCase() === "mp4";

    });


  const candidates =
    mp4.length
      ? mp4
      : combined;


  /*
   * ترتيب الجودة
   */

  candidates.sort((a, b) => {

    const heightA =
      Number(a.height || 0);

    const heightB =
      Number(b.height || 0);

    if (heightA !== heightB) {

      return heightB - heightA;
    }


    const bitrateA =
      Number(a.bitrate || 0);

    const bitrateB =
      Number(b.bitrate || 0);

    return bitrateB - bitrateA;
  });


  return candidates[0];
}


/* =========================
   تحميل الفيديو
========================= */

async function downloadVideo(
  url,
  outputPath
) {

  if (!ytdl) {

    throw new Error(
      "ytdl-core غير محمل"
    );
  }


  if (!toPipeableStream) {

    throw new Error(
      "toPipeableStream غير موجود"
    );
  }


  console.log(
    "[يوتيوب] الحصول على معلومات الفيديو..."
  );


  let info;

  try {

    info =
      await ytdl.getBasicInfo(url);

  } catch (error) {

    throw new Error(
      "فشل الحصول على معلومات الفيديو:\n" +
      (
        error?.stack ||
        error?.message ||
        error
      )
    );
  }


  if (!info) {

    throw new Error(
      "لم يتم الحصول على معلومات الفيديو"
    );
  }


  const formats =
    Array.isArray(info.formats)
      ? info.formats
      : [];


  console.log(
    `[يوتيوب] عدد الصيغ: ${formats.length}`
  );


  if (!formats.length) {

    throw new Error(
      "YouTube لم يرجع أي Format"
    );
  }


  /*
   * اختيار صيغة مدمجة
   */

  const format =
    choosePlayableFormat(formats);


  console.log(
    "[يوتيوب] الصيغة المختارة:",
    formatDescription(format)
  );


  let stream;

  try {

    /*
     * تمرير الـ format مباشرة
     * يمنع اختيار highest تلقائيًا
     */

    stream =
      await ytdl.download(
        url,
        {
          format
        }
      );

  } catch (error) {

    throw new Error(
      "فشل بدء التحميل:\n" +
      (
        error?.stack ||
        error?.message ||
        error
      )
    );
  }


  if (!stream) {

    throw new Error(
      "ytdl-core لم يرجع Stream"
    );
  }


  let pipeableStream;

  try {

    pipeableStream =
      toPipeableStream(stream);

  } catch (error) {

    throw new Error(
      "فشل تحويل Stream:\n" +
      (
        error?.stack ||
        error?.message ||
        error
      )
    );
  }


  if (!pipeableStream) {

    throw new Error(
      "تعذر إنشاء Pipeable Stream"
    );
  }


  /* =========================
     كتابة الملف
  ========================= */

  await new Promise(
    (resolve, reject) => {

      const writeStream =
        fs.createWriteStream(
          outputPath
        );


      let settled = false;


      const success = () => {

        if (settled) {
          return;
        }

        settled = true;

        resolve();
      };


      const failure = error => {

        if (settled) {
          return;
        }

        settled = true;


        try {
          writeStream.destroy();
        } catch {}


        reject(error);
      };


      writeStream.once(
        "finish",
        success
      );


      writeStream.once(
        "error",
        failure
      );


      if (
        typeof pipeableStream.once ===
        "function"
      ) {

        pipeableStream.once(
          "error",
          failure
        );
      }


      try {

        pipeableStream.pipe(
          writeStream
        );

      } catch (error) {

        failure(error);
      }

    }
  );


  /* =========================
     فحص الملف
  ========================= */

  if (
    !fs.existsSync(outputPath)
  ) {

    throw new Error(
      "لم يتم إنشاء ملف الفيديو"
    );
  }


  const stats =
    await fs.stat(
      outputPath
    );


  console.log(
    `[يوتيوب] حجم الملف: ` +
    `${(
      stats.size /
      1024 /
      1024
    ).toFixed(2)}MB`
  );


  if (!stats.size) {

    await fs
      .remove(outputPath)
      .catch(() => {});


    throw new Error(
      "ملف الفيديو فارغ"
    );
  }


  if (
    stats.size >
    MAX_FILE_SIZE
  ) {

    await fs
      .remove(outputPath)
      .catch(() => {});


    throw new Error(
      `حجم الفيديو ` +
      `${(
        stats.size /
        1024 /
        1024
      ).toFixed(2)}MB ` +
      `ويتجاوز الحد ` +
      `${MAX_FILE_SIZE / 1024 / 1024}MB`
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

    if (
      !fs.existsSync(filePath)
    ) {

      throw new Error(
        "ملف الفيديو غير موجود"
      );
    }


    const stats =
      await fs.stat(
        filePath
      );


    if (
      stats.size >
      MAX_FILE_SIZE
    ) {

      throw new Error(
        `حجم الفيديو ` +
        `${(
          stats.size /
          1024 /
          1024
        ).toFixed(2)}MB ` +
        `أكبر من الحد المسموح`
      );
    }


    await api.sendMessage(
      {
        body:
          `🎬 ${title}`,

        attachment:
          fs.createReadStream(
            filePath
          )
      },
      event.threadID
    );

  } finally {

    await fs
      .remove(filePath)
      .catch(() => {});
  }
}


/* =========================
   Handle Reply
========================= */

module.exports.handleReply =
  async function ({
    api,
    event,
    handleReply
  }) {

    try {

      if (
        !handleReply?.links?.length
      ) {
        return;
      }


      if (
        handleReply.author &&
        String(event.senderID) !==
        String(handleReply.author)
      ) {
        return;
      }


      const choice =
        parseInt(
          String(
            event.body || ""
          ).trim(),
          10
        );


      if (
        Number.isNaN(choice) ||
        choice < 1 ||
        choice >
          handleReply.links.length
      ) {

        return api.sendMessage(
          `❌ اختر رقمًا من 1 إلى ` +
          `${handleReply.links.length}`,
          event.threadID
        );
      }


      const url =
        handleReply.links[
          choice - 1
        ];


      let loadingMessage;


      try {

        loadingMessage =
          await api.sendMessage(
            "⏳ جاري تحميل الفيديو...",
            event.threadID
          );

      } catch {}


      const fileName =
        `youtube_` +
        `${Date.now()}_` +
        `${Math.random()
          .toString(36)
          .slice(2)}` +
        `.mp4`;


      const filePath =
        path.join(
          cacheDir,
          fileName
        );


      try {

        await downloadVideo(
          url,
          filePath
        );


        await sendVideo(
          api,
          event,
          filePath,
          handleReply
            .titles?.[choice - 1] ||
          "YouTube"
        );


      } catch (error) {

        await fs
          .remove(filePath)
          .catch(() => {});


        await sendError(
          api,
          event,
          error,
          `الرابط المختار:\n${url}`
        );


      } finally {

        if (
          loadingMessage?.messageID
        ) {

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

module.exports.run =
  async function ({
    api,
    event,
    args
  }) {

    try {

      const input =
        String(
          args?.join(" ") || ""
        ).trim();


      if (!input) {

        return api.sendMessage(
          "❌ استخدم الأمر هكذا:\n" +
          ".يوتيوب اسم الفيديو",
          event.threadID
        );
      }


      /* =========================
         رابط مباشر
      ========================= */

      if (
        isYouTubeUrl(input)
      ) {

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
          `youtube_` +
          `${Date.now()}_` +
          `${Math.random()
            .toString(36)
            .slice(2)}` +
          `.mp4`;


        const filePath =
          path.join(
            cacheDir,
            fileName
          );


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

          await fs
            .remove(filePath)
            .catch(() => {});


          await sendError(
            api,
            event,
            error,
            `الرابط:\n${input}\n` +
            `Video ID: ${videoId}`
          );


        } finally {

          if (
            loadingMessage?.messageID
          ) {

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


      if (
        !search?.videos?.length
      ) {

        return api.sendMessage(
          "❌ لم يتم العثور على نتائج",
          event.threadID
        );
      }


      const results =
        search.videos.slice(
          0,
          5
        );


      let message =
        "⌬ ━━ 𝗬𝗼𝘂𝗧𝘂𝗯𝗲 ━━ ⌬\n\n";


      results.forEach(
        (video, index) => {

          message +=
            `${index + 1}. ` +
            `${video.title}\n` +

            `المدة: ` +
            `${video.timestamp || "غير معروفة"}\n` +

            `القناة: ` +
            `${video.author?.name || "غير معروفة"}\n\n`;
        }
      );


      message +=
        "أرسل رقم الفيديو الذي تريد تحميله";


      const sent =
        await api.sendMessage(
          message,
          event.threadID
        );


      if (
        !global.client.handleReply
      ) {

        global.client.handleReply =
          [];
      }


      global.client.handleReply.push({

        name:
          module.exports.config.name,

        messageID:
          sent.messageID,

        author:
          event.senderID,

        links:
          results.map(
            video => video.url
          ),

        titles:
          results.map(
            video => video.title
          )
      });


    } catch (error) {

      await sendError(
        api,
        event,
        error
      );
    }
  };