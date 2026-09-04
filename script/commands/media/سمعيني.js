/*
╭──────────────────────────────╮
│       𝗛𝗜𝗡𝗔 MEDIA           │
│          سمعيني              │
╰──────────────────────────────╯
*/

/* =========================================================
   FIX FOR NODE 18 + UNDICI
   يجب أن يكون قبل youtubei.js وأي مكتبة تعتمد عليه
========================================================= */

try {
  const { Blob, File } = require("buffer");
  const { toUSVString } = require("util");

  if (
    typeof globalThis.Blob === "undefined" &&
    Blob
  ) {
    globalThis.Blob = Blob;
  }

  if (
    typeof globalThis.File === "undefined" &&
    File
  ) {
    globalThis.File = File;
  }

  if (
    typeof String.prototype.toWellFormed !== "function"
  ) {
    String.prototype.toWellFormed = function () {
      return toUSVString(this);
    };
  }

  if (
    typeof String.prototype.isWellFormed !== "function"
  ) {
    String.prototype.isWellFormed = function () {
      return toUSVString(this) === this;
    };
  }

} catch (error) {
  console.error(
    "[سمعيني] File/Blob polyfill error:",
    error
  );
}


/* =========================================================
   IMPORTS
========================================================= */

const fs = require("fs-extra");
const path = require("path");
const ytSearch = require("yt-search");


/* =========================================================
   CONFIG
========================================================= */

module.exports.config = {
  name: "سمعيني",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "البحث عن الأغاني وتحميل الصوت فقط من YouTube",
  commandCategory: "media",
  usages: "[اسم الأغنية أو رابط YouTube]",
  cooldowns: 10
};


const MAX_FILE_SIZE =
  25 * 1024 * 1024;

const CACHE_DIR =
  path.join(__dirname, "cache");


let youtube = null;
let youtubeLoading = null;


/* =========================================================
   ERROR FORMAT
========================================================= */

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


/* =========================================================
   SEND ERROR
========================================================= */

async function sendError(
  api,
  event,
  error,
  extra = ""
) {

  let text =
`⌬ ━━ 𝗛𝗜𝗡𝗔 MEDIA ━━ ⌬

❌ حدث خطأ في أمر سمعيني

${extra ? extra + "\n\n" : ""}الخطأ:

${formatError(error)}

⌬ ━━━━━━━━━━━━━━━ ⌬`;


  if (text.length > 5000) {

    text =
      text.slice(0, 4900) +
      "\n\n[تم اختصار الخطأ]";
  }


  return api.sendMessage(
    text,
    event.threadID
  );
}


/* =========================================================
   LOAD YOUTUBE.JS
========================================================= */

async function getYouTube() {

  if (youtube) {
    return youtube;
  }


  if (youtubeLoading) {
    return youtubeLoading;
  }


  youtubeLoading =
    (async () => {

      try {

        /*
         * مهم:
         * نستعمل import هنا لأن youtubei.js الحديثة ESM
         */

        const module =
          await import("youtubei.js");


        const Innertube =
          module.Innertube ||
          module.default?.Innertube;


        if (!Innertube) {

          throw new Error(
            "تعذر العثور على Innertube داخل youtubei.js"
          );
        }


        youtube =
          await Innertube.create({
            generate_session_locally: true
          });


        return youtube;

      } catch (error) {

        youtubeLoading = null;

        throw new Error(
          `فشل تشغيل youtubei.js\n\n${formatError(error)}`
        );
      }

    })();


  return youtubeLoading;
}


/* =========================================================
   CLEAN CACHE
========================================================= */

async function cleanCache() {

  try {

    await fs.ensureDir(
      CACHE_DIR
    );


    const files =
      await fs.readdir(
        CACHE_DIR
      );


    const now =
      Date.now();


    for (const file of files) {

      const filePath =
        path.join(
          CACHE_DIR,
          file
        );


      try {

        const stat =
          await fs.stat(
            filePath
          );


        /*
         * حذف الملفات الأقدم من 30 دقيقة
         */

        if (
          now - stat.mtimeMs >
          30 * 60 * 1000
        ) {

          await fs.remove(
            filePath
          );
        }

      } catch (_) {}
    }

  } catch (_) {}
}


/* =========================================================
   EXTRACT VIDEO ID
========================================================= */

function extractVideoId(url) {

  if (!url) {
    return null;
  }


  try {

    const parsed =
      new URL(url);


    if (
      parsed.hostname.includes(
        "youtube.com"
      ) ||
      parsed.hostname.includes(
        "youtube-nocookie.com"
      )
    ) {

      const id =
        parsed.searchParams.get("v");


      if (id) {
        return id;
      }


      const parts =
        parsed.pathname
          .split("/")
          .filter(Boolean);


      if (
        parts[0] === "shorts" ||
        parts[0] === "embed" ||
        parts[0] === "live"
      ) {

        return parts[1] || null;
      }
    }


    if (
      parsed.hostname ===
        "youtu.be" ||
      parsed.hostname.endsWith(
        ".youtu.be"
      )
    ) {

      return (
        parsed.pathname
          .split("/")
          .filter(Boolean)[0] ||
        null
      );
    }

  } catch (_) {}


  /*
   * دعم Video ID مباشرة
   */

  if (
    /^[a-zA-Z0-9_-]{11}$/.test(
      url
    )
  ) {

    return url;
  }


  return null;
}


/* =========================================================
   CHECK YOUTUBE URL
========================================================= */

function isYouTubeUrl(text) {

  if (!text) {
    return false;
  }


  return (

    /https?:\/\/(?:www\.)?youtube\.com\/watch/i
      .test(text)

    ||

    /https?:\/\/youtu\.be\//i
      .test(text)

    ||

    /https?:\/\/(?:www\.)?youtube\.com\/shorts\//i
      .test(text)

    ||

    /https?:\/\/(?:www\.)?youtube\.com\/live\//i
      .test(text)

    ||

    /https?:\/\/(?:www\.)?youtube\.com\/embed\//i
      .test(text)
  );
}


/* =========================================================
   SAFE FILE NAME
========================================================= */

function safeFileName(name) {

  return String(
    name || "audio"
  )

    .replace(
      /[<>:"/\\|?*\x00-\x1F]/g,
      ""
    )

    .replace(
      /\s+/g,
      " "
    )

    .trim()

    .slice(
      0,
      100
    )

    || "audio";
}


/* =========================================================
   SAVE STREAM
========================================================= */

async function saveStreamToFile(
  stream,
  filePath,
  maxSize
) {

  const writer =
    fs.createWriteStream(
      filePath
    );


  let total = 0;


  try {

    for await (
      const chunk of stream
    ) {

      let buffer;


      if (
        Buffer.isBuffer(chunk)
      ) {

        buffer = chunk;

      } else if (
        chunk instanceof Uint8Array
      ) {

        buffer =
          Buffer.from(
            chunk
          );

      } else {

        buffer =
          Buffer.from(
            chunk
          );
      }


      total +=
        buffer.length;


      /*
       * حماية الحجم
       */

      if (
        total >
        maxSize
      ) {

        writer.destroy();


        await fs
          .remove(filePath)
          .catch(() => {});


        throw new Error(
          `حجم الصوت تجاوز الحد المسموح ${Math.round(
            maxSize / 1024 / 1024
          )}MB`
        );
      }


      if (
        !writer.write(
          buffer
        )
      ) {

        await new Promise(
          resolve => {

            writer.once(
              "drain",
              resolve
            );

          }
        );
      }
    }


    await new Promise(
      (resolve, reject) => {

        writer.end();


        writer.once(
          "finish",
          resolve
        );


        writer.once(
          "error",
          reject
        );
      }
    );


    return total;

  } catch (error) {

    writer.destroy();


    await fs
      .remove(filePath)
      .catch(() => {});


    throw error;
  }
}


/* =========================================================
   DOWNLOAD AUDIO ONLY
========================================================= */

async function downloadAudio(
  videoId,
  title
) {

  const yt =
    await getYouTube();


  await fs.ensureDir(
    CACHE_DIR
  );


  const cleanTitle =
    safeFileName(
      title
    );


  const random =
    `${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;


  let extension =
    "webm";


  const filePath =
    path.join(
      CACHE_DIR,
      `${random}.${extension}`
    );


  /*
   * طلب الصوت فقط
   *
   * لا يوجد فيديو
   * لا يوجد دمج
   * لا يوجد FFmpeg
   */

  let stream;


  try {

    stream =
      await yt.download(
        videoId,
        {
          type: "audio",
          quality: "best"
        }
      );

  } catch (error) {

    throw new Error(
      `فشل طلب الصوت من YouTube\n\n${formatError(error)}`
    );
  }


  if (!stream) {

    throw new Error(
      "YouTube لم يرجع Stream للصوت"
    );
  }


  const size =
    await saveStreamToFile(
      stream,
      filePath,
      MAX_FILE_SIZE
    );


  /*
   * نحاول تحديد نوع الصوت
   */

  try {

    const info =
      await yt.getBasicInfo(
        videoId
      );


    const formats = [

      ...(info.streaming_data?.formats || []),

      ...(info.streaming_data?.adaptive_formats || [])

    ];


    const audioFormats =
      formats.filter(
        format => {

          const mime =
            String(
              format.mime_type ||
              format.mimeType ||
              ""
            );


          return (
            mime.startsWith(
              "audio/"
            )
          );
        }
      );


    if (
      audioFormats.length
    ) {

      const mime =
        String(
          audioFormats[0].mime_type ||
          audioFormats[0].mimeType ||
          ""
        );


      if (
        mime.includes(
          "mp4"
        )
      ) {

        extension =
          "m4a";

      } else if (
        mime.includes(
          "webm"
        )
      ) {

        extension =
          "webm";
      }


      const newPath =
        path.join(
          CACHE_DIR,
          `${random}.${extension}`
        );


      if (
        newPath !==
        filePath
      ) {

        await fs.move(
          filePath,
          newPath,
          {
            overwrite: true
          }
        );


        return {

          filePath:
            newPath,

          size,

          title:
            cleanTitle,

          extension

        };
      }
    }

  } catch (_) {}


  return {

    filePath,

    size,

    title:
      cleanTitle,

    extension

  };
}


/* =========================================================
   GET VIDEO INFO
========================================================= */

async function getVideoInfo(
  videoId
) {

  const yt =
    await getYouTube();


  const info =
    await yt.getBasicInfo(
      videoId
    );


  const status =
    info.playability_status;


  if (
    status &&
    status.status &&
    status.status !==
      "OK"
  ) {

    throw new Error(
`الفيديو غير قابل للتشغيل

الحالة:
${status.status}

${
  status.reason ||
  "لا يوجد سبب محدد"
}`
    );
  }


  const basic =
    info.basic_info ||
    {};


  return {

    id:
      videoId,

    title:
      basic.title ||
      "صوت بدون عنوان",

    author:
      basic.author ||
      "غير معروف",

    duration:
      basic.duration ||
      0,

    viewCount:
      basic.view_count ||
      0

  };
}


/* =========================================================
   SEND AUDIO
========================================================= */

async function sendAudio(
  api,
  event,
  data
) {

  if (
    !await fs.pathExists(
      data.filePath
    )
  ) {

    throw new Error(
      "تم تحميل الصوت لكن الملف المؤقت غير موجود"
    );
  }


  const stat =
    await fs.stat(
      data.filePath
    );


  if (
    stat.size <= 0
  ) {

    throw new Error(
      "تم إنشاء الملف لكنه فارغ"
    );
  }


  if (
    stat.size >
    MAX_FILE_SIZE
  ) {

    throw new Error(
      `حجم الملف ${Math.round(
        stat.size / 1024 / 1024
      )}MB وهو أكبر من الحد المسموح`
    );
  }


  await api.sendMessage(
    {

      body:
`⌬ ━━ 𝗛𝗜𝗡𝗔 MEDIA ━━ ⌬

🎵 ${data.title}

╰─❖ تم تحميل الصوت بنجاح`,

      attachment:
        fs.createReadStream(
          data.filePath
        )

    },

    event.threadID,

    event.messageID
  );


  /*
   * حذف الملف بعد الإرسال
   */

  setTimeout(
    () => {

      fs.remove(
        data.filePath
      ).catch(
        () => {}
      );

    },
    5000
  );
}


/* =========================================================
   PROCESS DIRECT URL
========================================================= */

async function processUrl(
  api,
  event,
  url
) {

  const videoId =
    extractVideoId(
      url
    );


  if (!videoId) {

    return sendError(
      api,
      event,

      new Error(
        "تعذر استخراج Video ID من الرابط"
      ),

      `الرابط:\n${url}`
    );
  }


  let loadingMessage =
    null;


  try {

    loadingMessage =
      await api.sendMessage(
        "⌬ جاري جلب معلومات الصوت...",
        event.threadID
      );


    const info =
      await getVideoInfo(
        videoId
      );


    if (
      loadingMessage
    ) {

      await api.editMessage(

        `⌬ جاري تحميل الصوت...

🎵 ${info.title}`,

        loadingMessage.messageID

      ).catch(
        () => {}
      );
    }


    const audio =
      await downloadAudio(
        videoId,
        info.title
      );


    if (
      loadingMessage
    ) {

      await api.unsendMessage(
        loadingMessage.messageID
      ).catch(
        () => {}
      );
    }


    await sendAudio(
      api,
      event,
      audio
    );


  } catch (error) {

    if (
      loadingMessage
    ) {

      await api.unsendMessage(
        loadingMessage.messageID
      ).catch(
        () => {}
      );
    }


    return sendError(
      api,
      event,
      error,

      `الرابط المختار:\n${url}`
    );
  }
}


/* =========================================================
   SEARCH YOUTUBE
========================================================= */

async function searchYouTube(
  query
) {

  const result =
    await ytSearch(
      query
    );


  if (
    !result ||
    !result.videos ||
    !result.videos.length
  ) {

    throw new Error(
      "لم يتم العثور على نتائج"
    );
  }


  return result.videos
    .slice(
      0,
      5
    )

    .map(
      video => ({

        id:
          video.videoId,

        title:
          video.title,

        duration:
          video.timestamp ||
          "غير معروف",

        views:
          video.views ||
          0,

        author:
          video.author?.name ||
          "غير معروف",

        url:
          video.url ||
          `https://www.youtube.com/watch?v=${video.videoId}`

      })
    );
}


/* =========================================================
   SEARCH RESULTS
   HINA MEDIA STYLE
========================================================= */

async function showSearchResults(
  api,
  event,
  results
) {

  let message =
`⌬ ━━ 𝗛𝗜𝗡𝗔 MEDIA ━━ ⌬

🎵 نتائج البحث عن الصوت

`;


  results.forEach(
    (video, index) => {

      message +=
`${index + 1} ─ ${video.title}
   ├ المدة: ${video.duration}
   └ القناة: ${video.author}

`;
    }
  );


  message +=
`⌬ ━━━━━━━━━━━━━━━ ⌬
↳ أرسل رقم الأغنية لتحميلها`;


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
      results

  });


  return sent;
}


/* =========================================================
   MAIN COMMAND
========================================================= */

module.exports.run =
async function ({
  api,
  event,
  args
}) {

  try {

    await fs.ensureDir(
      CACHE_DIR
    );


    cleanCache().catch(
      () => {}
    );


    const input =
      args
        .join(" ")
        .trim();


    if (!input) {

      return api.sendMessage(

`⌬ ━━ 𝗛𝗜𝗡𝗔 MEDIA ━━ ⌬

🎵 أمر سمعيني

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

    if (
      isYouTubeUrl(
        input
      )
    ) {

      return processUrl(
        api,
        event,
        input
      );
    }


    /*
     * البحث
     */

    const loading =
      await api.sendMessage(
        "⌬ جاري البحث عن الأغنية...",
        event.threadID
      );


    try {

      const results =
        await searchYouTube(
          input
        );


      await api.unsendMessage(
        loading.messageID
      ).catch(
        () => {}
      );


      return showSearchResults(
        api,
        event,
        results
      );


    } catch (error) {

      await api.unsendMessage(
        loading.messageID
      ).catch(
        () => {}
      );


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


/* =========================================================
   HANDLE REPLY
========================================================= */

module.exports.handleReply =
async function ({
  api,
  event,
  handleReply
}) {

  let filePath =
    null;


  try {

    /*
     * منع الأشخاص الآخرين من استعمال القائمة
     */

    if (
      handleReply.author &&
      String(
        handleReply.author
      ) !==
      String(
        event.senderID
      )
    ) {

      return;
    }


    const input =
      String(
        event.body ||
        ""
      ).trim();


    const number =
      parseInt(
        input,
        10
      );


    if (
      !Number.isInteger(
        number
      ) ||
      number < 1 ||
      number >
        handleReply.links.length
    ) {

      return api.sendMessage(

        `❌ اختر رقمًا من 1 إلى ${handleReply.links.length}`,

        event.threadID,

        event.messageID
      );
    }


    const selected =
      handleReply.links[
        number - 1
      ];


    /*
     * حذف قائمة البحث
     */

    if (
      handleReply.messageID
    ) {

      await api.unsendMessage(
        handleReply.messageID
      ).catch(
        () => {}
      );
    }


    const loading =
      await api.sendMessage(

`⌬ ━━ 𝗛𝗜𝗡𝗔 MEDIA ━━ ⌬

⌬ جاري تحميل الصوت...

🎵 ${selected.title}`,

      event.threadID
    );


    try {

      const info =
        await getVideoInfo(
          selected.id
        );


      const audio =
        await downloadAudio(
          selected.id,

          info.title ||
          selected.title
        );


      filePath =
        audio.filePath;


      await api.unsendMessage(
        loading.messageID
      ).catch(
        () => {}
      );


      await sendAudio(
        api,
        event,
        audio
      );


      filePath =
        null;


    } catch (error) {

      await api.unsendMessage(
        loading.messageID
      ).catch(
        () => {}
      );


      throw error;
    }


  } catch (error) {

    if (
      filePath
    ) {

      await fs.remove(
        filePath
      ).catch(
        () => {}
      );
    }


    return sendError(
      api,
      event,
      error,

      "تعذر تحميل الأغنية المختارة"
    );
  }
};


/* =========================================================
   GLOBAL ERROR LOGGING
========================================================= */

process.on(
  "unhandledRejection",
  error => {

    console.error(
      "[سمعيني] UNHANDLED REJECTION:",
      error
    );
  }
);


process.on(
  "uncaughtException",
  error => {

    console.error(
      "[سمعيني] UNCAUGHT EXCEPTION:",
      error
    );
  }
);