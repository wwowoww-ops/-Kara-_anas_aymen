const fs = require("fs-extra");
const path = require("path");
const ytSearch = require("yt-search");

let YtdlCore;
let toPipeableStream;

try {
  const ytdlModule = require("@ybd-project/ytdl-core");

  YtdlCore = ytdlModule.YtdlCore;
  toPipeableStream = ytdlModule.toPipeableStream;

} catch (error) {

  console.error(
    "[YOUTUBE MODULE ERROR]",
    error
  );

  // لا نخلي الملف ينهار أثناء تحميل الأوامر
  // حتى يظهر الخطأ للمستخدم بدل اختفاء الأمر
}

let ytdl = null;

if (YtdlCore) {
  try {
    ytdl = new YtdlCore();
  } catch (error) {
    console.error(
      "[YOUTUBE INIT ERROR]",
      error
    );
  }
}

const MAX_FILE_SIZE = 25 * 1024 * 1024;

// ============================================================
// CONFIG
// ============================================================

module.exports.config = {
  name: "يوتيوب",
  version: "2.1.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "البحث وتحميل فيديوهات YouTube",
  commandCategory: "media",
  usages: "[اسم الفيديو أو رابط YouTube]",
  cooldowns: 10
};

// ============================================================
// ERROR FORMAT
// ============================================================

function getErrorMessage(error) {

  if (!error) {
    return "خطأ غير معروف";
  }

  let message =
    error.message ||
    String(error);

  if (error.code) {
    message += `\n\nCode: ${error.code}`;
  }

  if (error.statusCode) {
    message += `\n\nHTTP Status: ${error.statusCode}`;
  }

  if (error.status) {
    message += `\n\nStatus: ${error.status}`;
  }

  if (error.response?.status) {
    message +=
      `\n\nHTTP Status: ${error.response.status}`;
  }

  if (error.response?.data) {

    try {

      message +=
        `\n\nResponse:\n${
          typeof error.response.data === "string"
            ? error.response.data
            : JSON.stringify(
                error.response.data,
                null,
                2
              )
        }`;

    } catch (e) {}
  }

  return message;
}

// ============================================================
// SEND ERROR
// ============================================================

async function sendError(
  api,
  event,
  title,
  error
) {

  const errorMessage =
    getErrorMessage(error);

  console.error(
    `[YOUTUBE ${title}]`,
    error
  );

  const message =
`⌬ ━━ HINA MEDIA ━━ ⌬

❌ ${title}

━━━━━━━━━━━━━━━━━━

${errorMessage}

━━━━━━━━━━━━━━━━━━`;

  try {

    return await api.sendMessage(
      message,
      event.threadID,
      event.messageID
    );

  } catch (sendError) {

    console.error(
      "[YOUTUBE SEND ERROR]",
      sendError
    );
  }
}

// ============================================================
// CACHE
// ============================================================

function getCacheDir() {

  const dir =
    path.join(
      __dirname,
      "cache"
    );

  fs.ensureDirSync(dir);

  return dir;
}

// ============================================================
// SAFE FILE NAME
// ============================================================

function getSafeFileName(name) {

  return String(
    name || "youtube"
  )
    .replace(
      /[<>:"/\\|?*\x00-\x1F]/g,
      "_"
    )
    .replace(
      /\s+/g,
      "_"
    )
    .slice(
      0,
      80
    );
}

// ============================================================
// YOUTUBE URL
// ============================================================

function isYouTubeUrl(text) {

  return /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]+/i.test(
    String(text || "").trim()
  );
}

// ============================================================
// VIDEO ID
// ============================================================

function extractVideoId(url) {

  const text =
    String(url || "").trim();

  const match =
    text.match(
      /(?:v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([\w-]{6,})/i
    );

  return match
    ? match[1]
    : null;
}

// ============================================================
// REMOVE FILE
// ============================================================

async function removeFile(filePath) {

  try {

    if (
      filePath &&
      await fs.pathExists(filePath)
    ) {

      await fs.remove(
        filePath
      );
    }

  } catch (error) {

    console.log(
      "[YOUTUBE CACHE REMOVE ERROR]",
      error.message
    );
  }
}

// ============================================================
// SEND VIDEO
// ============================================================

async function sendVideo(
  api,
  event,
  filePath,
  title
) {

  try {

    const stat =
      await fs.stat(
        filePath
      );

    if (
      stat.size >
      MAX_FILE_SIZE
    ) {

      await removeFile(
        filePath
      );

      return api.sendMessage(
`⌬ ━━ HINA MEDIA ━━ ⌬

❌ لا يمكن إرسال الفيديو

📦 حجم الملف:
${(
  stat.size /
  1024 /
  1024
).toFixed(2)} MB

⚠️ الحد المسموح للإرسال هو 25 MB`,
        event.threadID,
        event.messageID
      );
    }

    const stream =
      fs.createReadStream(
        filePath
      );

    return api.sendMessage(
      {
        body:
`⌬ ━━ HINA MEDIA ━━ ⌬

🎬 ${title || "YouTube"}

✓ تم تحميل الفيديو بنجاح`,

        attachment:
          stream
      },

      event.threadID,

      async error => {

        await removeFile(
          filePath
        );

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

    await removeFile(
      filePath
    );

    return sendError(
      api,
      event,
      "حدث خطأ أثناء إرسال الفيديو",
      error
    );
  }
}

// ============================================================
// DOWNLOAD VIDEO
// ============================================================

async function downloadVideo(
  url,
  outputPath
) {

  if (!YtdlCore) {

    throw new Error(
      "مكتبة @ybd-project/ytdl-core لم يتم تحميلها"
    );
  }

  if (!toPipeableStream) {

    throw new Error(
      "الدالة toPipeableStream غير موجودة في @ybd-project/ytdl-core"
    );
  }

  if (!ytdl) {

    ytdl =
      new YtdlCore();
  }

  const downloadStream =
    await ytdl.download(
      url
    );

  if (!downloadStream) {

    throw new Error(
      "YouTube لم يُرجع Stream للتحميل"
    );
  }

  const stream =
    toPipeableStream(
      downloadStream
    );

  if (!stream) {

    throw new Error(
      "فشل تحويل YouTube Stream"
    );
  }

  await new Promise(
    (
      resolve,
      reject
    ) => {

      const output =
        fs.createWriteStream(
          outputPath
        );

      let settled =
        false;

      function finish(error) {

        if (settled) {
          return;
        }

        settled = true;

        if (error) {

          try {
            output.destroy();
          } catch (e) {}

          reject(
            error
          );

        } else {

          resolve();
        }
      }

      output.once(
        "finish",
        () => finish()
      );

      output.once(
        "error",
        finish
      );

      stream.once(
        "error",
        finish
      );

      try {

        stream.pipe(
          output
        );

      } catch (error) {

        finish(
          error
        );
      }
    }
  );

  const exists =
    await fs.pathExists(
      outputPath
    );

  if (!exists) {

    throw new Error(
      "تم انتهاء التحميل لكن الملف غير موجود"
    );
  }

  const stat =
    await fs.stat(
      outputPath
    );

  if (!stat.size) {

    throw new Error(
      "تم إنشاء الملف لكنه فارغ"
    );
  }
}

// ============================================================
// HANDLE REPLY
// ============================================================

module.exports.handleReply =
async function ({
  api,
  event,
  handleReply
}) {

  try {

    if (
      !handleReply ||
      !Array.isArray(
        handleReply.links
      )
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
      String(
        event.body || ""
      ).trim();

    const index =
      Number(input) - 1;

    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >=
        handleReply.links.length
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

    if (!url) {

      return sendError(
        api,
        event,
        "الرابط المحدد غير موجود",
        new Error(
          "selected.url is empty"
        )
      );
    }

    const videoId =
      extractVideoId(
        url
      ) ||
      Date.now().toString();

    const fileName =
      `youtube_${getSafeFileName(videoId)}_${Date.now()}.mp4`;

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

      return sendError(
        api,
        event,
        "حدث خطأ أثناء تحميل الفيديو",
        error
      );
    }

  } catch (error) {

    return sendError(
      api,
      event,
      "حدث خطأ في معالجة الرد",
      error
    );
  }
};

// ============================================================
// MAIN COMMAND
// ============================================================

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
`⌬ ━━ HINA MEDIA ━━ ⌬

⚠️ اكتب اسم الفيديو أو ضع رابط YouTube

مثال:

.يوتيوب اسم الفيديو`,
        event.threadID,
        event.messageID
      );
    }

    // ========================================================
    // DIRECT URL
    // ========================================================

    if (
      isYouTubeUrl(input)
    ) {

      const videoId =
        extractVideoId(
          input
        );

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
          `youtube_${getSafeFileName(videoId)}_${Date.now()}.mp4`
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

          if (!ytdl) {

            throw new Error(
              "مكتبة ytdl-core غير مهيأة"
            );
          }

          const info =
            await ytdl.getBasicInfo(
              input
            );

          title =
            info?.videoDetails?.title ||
            title;

        } catch (infoError) {

          console.log(
            "[YOUTUBE INFO ERROR]",
            infoError
          );

          // لا نوقف التحميل بسبب فشل جلب العنوان
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

        return sendError(
          api,
          event,
          "حدث خطأ أثناء تحميل الفيديو",
          error
        );
      }
    }

    // ========================================================
    // SEARCH
    // ========================================================

    try {

      const result =
        await ytSearch(
          input
        );

      if (
        !result ||
        !Array.isArray(
          result.videos
        ) ||
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
        result.videos.slice(
          0,
          5
        );

      let message =
`⌬ ━━ HINA MEDIA ━━ ⌬

🔎 نتائج البحث عن:
${input}

`;

      videos.forEach(
        (
          video,
          index
        ) => {

          message +=
`${index + 1} ┃ ${video.title}
   ⏱️ ${video.timestamp || "غير معروف"}
   👤 ${video.author?.name || "غير معروف"}

`;
        }
      );

      message +=
`━━━━━━━━━━━━━━━━━━
↪️ أرسل رقم الفيديو لتحميله`;

      const links =
        videos.map(
          video => ({
            url:
              video.url,

            title:
              video.title
          })
        );

      return api.sendMessage(
        message,
        event.threadID,
        (
          error,
          info
        ) => {

          if (error) {

            console.error(
              "[YOUTUBE SEARCH MESSAGE ERROR]",
              error
            );

            return;
          }

          if (!info) {

            console.error(
              "[YOUTUBE SEARCH] No message info"
            );

            return;
          }

          if (
            !global.client ||
            !Array.isArray(
              global.client.handleReply
            )
          ) {

            console.error(
              "[YOUTUBE HANDLE REPLY ERROR] global.client.handleReply is not available"
            );

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

      return sendError(
        api,
        event,
        "حدث خطأ أثناء البحث في YouTube",
        error
      );
    }

  } catch (error) {

    return sendError(
      api,
      event,
      "حدث خطأ في أمر يوتيوب",
      error
    );
  }
};
