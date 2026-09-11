const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { spawn } = require("child_process");
const { pipeline } = require("stream/promises");
const { createWriteStream } = require("fs");
const yts = require("yt-search");

module.exports.config = {
  name: "يوتيوب",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "البحث عن فيديوهات يوتيوب وتحميلها",
  commandCategory: "media",
  usages: "يوتيوب [اسم الفيديو أو الرابط]",
  cooldowns: 10
};

// ==================================================
// API
// ==================================================

const NEW_API_BASE =
  "https://engez.a7a.online/api/v1/download/ytdl";

const OLD_API_BASE =
  "https://engez.a7a.online/api/v1/download/youtube";

const DOWNLOAD_TIMEOUT_MS = 120 * 1000;
const TITLE_TIMEOUT_MS = 8 * 1000;

const VIDEO_QUALITIES = [
  "144",
  "240",
  "360",
  "480",
  "720",
  "1080",
  "1440",
  "2160"
];

const AUDIO_QUALITIES = [
  "128",
  "320"
];


// ==================================================
// أدوات
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


function isYouTubeUrl(input) {
  try {
    const normalized =
      /^https?:\/\//i.test(input)
        ? input
        : `https://${input}`;

    const parsed = new URL(normalized);

    const host = parsed.hostname
      .replace(/^www\./i, "")
      .replace(/^m\./i, "");

    return (
      host === "youtu.be" ||
      host === "youtube.com" ||
      host.endsWith(".youtube.com")
    );

  } catch {
    return false;
  }
}


function extractYouTubeUrl(input) {
  try {
    const normalized =
      /^https?:\/\//i.test(input)
        ? input
        : `https://${input}`;

    const parsed = new URL(normalized);

    const host = parsed.hostname
      .replace(/^www\./i, "")
      .replace(/^m\./i, "");

    if (
      host === "engez.a7a.online" &&
      (
        parsed.pathname.includes(
          "/api/v1/download/youtube"
        ) ||
        parsed.pathname.includes(
          "/api/v1/download/ytdl"
        )
      )
    ) {
      const innerUrl =
        parsed.searchParams.get("url");

      if (innerUrl) {
        return decodeURIComponent(innerUrl);
      }
    }

  } catch {}

  return input;
}


// ==================================================
// بناء روابط API
// ==================================================

function buildNewApiUrl(
  url,
  type,
  quality
) {
  const params =
    new URLSearchParams({
      url
    });

  if (type) {
    params.set("type", type);
  }

  if (quality) {
    params.set("quality", quality);
  }

  return (
    `${NEW_API_BASE}?${params.toString()}`
  );
}


function buildOldApiUrl(
  url,
  type,
  quality
) {
  const params =
    new URLSearchParams({
      url
    });

  if (type) {
    params.set("type", type);
  }

  if (quality) {
    params.set("quality", quality);
  }

  return (
    `${OLD_API_BASE}?${params.toString()}`
  );
}


// ==================================================
// جلب عنوان الرابط
// ==================================================

async function fetchTitleSafely(url) {
  try {

    const oembedUrl =
      "https://www.youtube.com/oembed" +
      `?url=${encodeURIComponent(url)}` +
      "&format=json";

    const {
      data
    } = await axios.get(
      oembedUrl,
      {
        timeout:
          TITLE_TIMEOUT_MS
      }
    );

    return data?.title || null;

  } catch (error) {

    console.error(
      "HINA YOUTUBE TITLE ERROR:",
      error.message
    );

    return null;
  }
}


// ==================================================
// API الجديد
// ==================================================

async function fetchFromNewApi(
  url,
  type,
  quality
) {

  const {
    data
  } = await axios.get(
    buildNewApiUrl(
      url,
      type,
      quality
    ),
    {
      timeout:
        DOWNLOAD_TIMEOUT_MS
    }
  );

  if (
    !data ||
    data.success !== true ||
    !data.response
  ) {

    throw new Error(
      data?.error ||
      "تعذر تحميل هذا الاختيار من المصدر الرئيسي"
    );
  }

  const r =
    data.response;

  if (!r.download_url) {
    throw new Error(
      "المصدر الرئيسي لم يرجع رابط تحميل"
    );
  }

  return {
    title:
      r.title || null,

    thumbnail:
      r.thumbnail || null,

    download_url:
      r.download_url,

    type:
      r.type === "audio"
        ? "audio"
        : "mp4",

    requested_quality:
      r.requested_quality ||
      quality ||
      null,

    file_size_bytes:
      r.file_size_bytes ||
      null,

    source_used:
      "new",

    is_fallback:
      false
  };
}


// ==================================================
// API القديم
// ==================================================

async function fetchFromOldApi(
  url,
  type,
  quality
) {

  const {
    data
  } = await axios.get(
    buildOldApiUrl(
      url,
      type,
      quality
    ),
    {
      timeout:
        DOWNLOAD_TIMEOUT_MS
    }
  );

  if (
    !data ||
    data.success !== true
  ) {

    throw new Error(
      data?.error ||
      "تعذر تحميل هذا الاختيار من المصدر الاحتياطي"
    );
  }

  const d =
    data.data;

  if (
    !d ||
    !d.download_url
  ) {

    throw new Error(
      "المصدر الاحتياطي لم يرجع رابط تحميل"
    );
  }

  return {
    title:
      d.title || null,

    thumbnail:
      d.thumbnail || null,

    download_url:
      d.download_url,

    type:
      d.type === "mp3" ||
      d.type === "audio"
        ? "audio"
        : "mp4",

    requested_quality:
      d.requested_quality ||
      quality ||
      null,

    file_size_bytes:
      d.file_size_bytes ||
      null,

    source_used:
      "old",

    is_fallback:
      true
  };
}


// ==================================================
// API الرئيسي + الاحتياطي
// ==================================================

async function fetchDownload(
  url,
  type,
  quality
) {

  try {

    console.log(
      "HINA YOUTUBE: NEW API"
    );

    return await fetchFromNewApi(
      url,
      type,
      quality
    );

  } catch (error) {

    console.error(
      "HINA YOUTUBE NEW API FAILED:",
      error.message
    );

    console.log(
      "HINA YOUTUBE: OLD API"
    );

    return await fetchFromOldApi(
      url,
      type,
      quality
    );
  }
}


// ==================================================
// تحميل الملف
// ==================================================

async function downloadToFile(
  fileUrl,
  filePath
) {

  const response =
    await axios.get(
      fileUrl,
      {
        responseType:
          "stream",

        timeout:
          DOWNLOAD_TIMEOUT_MS,

        maxRedirects:
          5,

        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile Safari/537.36",

          Accept: "*/*",

          "Accept-Language":
            "en-US,en;q=0.9"
        }
      }
    );

  await pipeline(
    response.data,
    createWriteStream(
      filePath
    )
  );
}


// ==================================================
// FFmpeg
// ==================================================

function runFfmpeg(args) {

  return new Promise(
    (resolve, reject) => {

      const ff =
        spawn(
          "ffmpeg",
          args,
          {
            stdio: [
              "ignore",
              "ignore",
              "pipe"
            ]
          }
        );

      let errorText = "";

      ff.stderr.on(
        "data",
        chunk => {
          errorText +=
            chunk.toString();
        }
      );

      ff.on(
        "error",
        reject
      );

      ff.on(
        "close",
        code => {

          if (code === 0) {
            return resolve();
          }

          reject(
            new Error(
              `ffmpeg exited with code ${code}\n${errorText}`
            )
          );
        }
      );
    }
  );
}


async function repairVideoWithFfmpeg(
  inputPath,
  outputPath
) {

  try {

    await runFfmpeg([
      "-y",
      "-i",
      inputPath,

      "-fflags",
      "+genpts",

      "-movflags",
      "+faststart",

      "-map",
      "0:v:0?",

      "-map",
      "0:a:0?",

      "-c:v",
      "libx264",

      "-preset",
      "veryfast",

      "-crf",
      "23",

      "-c:a",
      "aac",

      "-b:a",
      "128k",

      "-pix_fmt",
      "yuv420p",

      outputPath
    ]);

    return outputPath;

  } catch (error) {

    console.error(
      "HINA VIDEO RE-ENCODE ERROR:",
      error.message
    );

    await runFfmpeg([
      "-y",
      "-i",
      inputPath,

      "-c",
      "copy",

      "-movflags",
      "+faststart",

      outputPath
    ]);

    return outputPath;
  }
}


async function convertAudioWithFfmpeg(
  inputPath,
  outputPath
) {

  try {

    await runFfmpeg([
      "-y",
      "-i",
      inputPath,

      "-vn",

      "-c:a",
      "libmp3lame",

      "-b:a",
      "192k",

      outputPath
    ]);

    return outputPath;

  } catch (error) {

    console.error(
      "HINA AUDIO CONVERT ERROR:",
      error.message
    );

    await runFfmpeg([
      "-y",
      "-i",
      inputPath,

      "-vn",

      "-c:a",
      "aac",

      "-b:a",
      "128k",

      outputPath
    ]);

    return outputPath;
  }
}


// ==================================================
// تجهيز الملف
// ==================================================

async function prepareMediaFile(
  payload
) {

  const tmpDir =
    await fs.mkdtemp(
      path.join(
        os.tmpdir(),
        "hina-ytdl-"
      )
    );

  const id =
    crypto
      .randomBytes(6)
      .toString("hex");

  const srcPath =
    path.join(
      tmpDir,
      `source-${id}.bin`
    );

  const videoPath =
    path.join(
      tmpDir,
      `video-${id}.mp4`
    );

  const audioPath =
    path.join(
      tmpDir,
      `audio-${id}.mp3`
    );

  await downloadToFile(
    payload.download_url,
    srcPath
  );

  if (
    payload.type === "mp4"
  ) {

    try {

      await repairVideoWithFfmpeg(
        srcPath,
        videoPath
      );

      return {
        filePath:
          videoPath,

        tmpDir,

        mimetype:
          "video/mp4"
      };

    } catch (error) {

      console.error(
        "HINA VIDEO FFMPEG FAILED:",
        error.message
      );

      return {
        filePath:
          srcPath,

        tmpDir,

        mimetype:
          "video/mp4"
      };
    }
  }

  try {

    await convertAudioWithFfmpeg(
      srcPath,
      audioPath
    );

    return {
      filePath:
        audioPath,

      tmpDir,

      mimetype:
        "audio/mpeg"
    };

  } catch (error) {

    console.error(
      "HINA AUDIO FFMPEG FAILED:",
      error.message
    );

    return {
      filePath:
        srcPath,

      tmpDir,

      mimetype:
        "audio/mpeg"
    };
  }
}


// ==================================================
// إرسال الملف
// ==================================================

async function sendDownloadedMedia(
  api,
  threadID,
  replyTo,
  payload
) {

  let prepared = null;

  try {

    prepared =
      await prepareMediaFile(
        payload
      );

    const buffer =
      await fs.readFile(
        prepared.filePath
      );

    const isVideo =
      payload.type === "mp4";

    const title =
      payload.title ||
      "بدون عنوان";

    const fallbackNote =
      payload.is_fallback
        ? "\nالمصدر: احتياطي"
        : "\nالمصدر: رئيسي";

    if (isVideo) {

      await api.sendMessage(
        {
          body:
            "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n" +

            "تم التحميل بنجاح\n\n" +

            `العنوان:\n${title}\n\n` +

            `الجودة: ${
              payload.requested_quality ||
              "auto"
            }` +

            fallbackNote,

          attachment:
            require("stream").Readable.from(
              buffer
            )
        },

        threadID,
        replyTo
      );

    } else {

      await api.sendMessage(
        {
          body:
            "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n" +

            "تم تحميل الصوت بنجاح\n\n" +

            `العنوان:\n${title}\n\n` +

            `الجودة: ${
              payload.requested_quality ||
              "auto"
            }` +

            fallbackNote,

          attachment:
            require("stream").Readable.from(
              buffer
            )
        },

        threadID,
        replyTo
      );
    }

  } finally {

    if (
      prepared?.tmpDir
    ) {

      await fs.rm(
        prepared.tmpDir,
        {
          recursive: true,
          force: true
        }
      ).catch(
        () => {}
      );
    }
  }
}


// ==================================================
// تسجيل HandleReply
// ==================================================

function addHandleReply(data) {

  if (
    !Array.isArray(
      global.client.handleReply
    )
  ) {
    global.client.handleReply = [];
  }

  global.client.handleReply.push(
    data
  );
}


// ==================================================
// البحث عن الفيديو
// ==================================================

async function searchYouTube(
  query
) {

  const result =
    await yts(query);

  if (
    !result ||
    !Array.isArray(
      result.videos
    )
  ) {
    return [];
  }

  return result.videos
    .slice(0, 10)
    .filter(
      video =>
        video &&
        video.url
    );
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

  const rawInput =
    Array.isArray(args)
      ? args.join(" ").trim()
      : "";

  if (!rawInput) {

    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n" +

      "اكتب اسم الفيديو أو رابط يوتيوب.\n\n" +

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

    const input =
      extractYouTubeUrl(
        rawInput
      );

    // ==============================================
    // إذا كان رابطًا
    // ==============================================

    if (
      isYouTubeUrl(input)
    ) {

      const title =
        await fetchTitleSafely(
          input
        );

      return sendQualityMenu(
        api,
        threadID,
        messageID,
        senderID,
        input,
        title ||
          "YouTube"
      );
    }

    // ==============================================
    // إذا كان اسم فيديو
    // ==============================================

    const videos =
      await searchYouTube(
        rawInput
      );

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

    let text =
      "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n";

    text +=
      `نتائج البحث عن:\n${rawInput}\n\n`;

    videos.forEach(
      (video, index) => {

        text +=
          `${index + 1} ┊ ` +
          `${cleanText(
            video.title
          )}\n`;

        text +=
          `   المدة: ${
            formatDuration(
              video.seconds
            )
          }\n`;

        text +=
          `   القناة: ${
            cleanText(
              video.author?.name ||
              "غير معروف"
            )
          }\n\n`;
      }
    );

    text +=
      "━━━━━━━━━━━━━━━━━━\n" +
      "أرسل رقم الفيديو";

    api.setMessageReaction(
      "✅",
      messageID,
      () => {},
      true
    );

    return api.sendMessage(
      text,
      threadID,

      (error, info) => {

        if (error) {

          console.error(
            "HINA YOUTUBE SEARCH LIST ERROR:",
            error
          );

          return;
        }

        if (
          !info ||
          !info.messageID
        ) {

          console.error(
            "HINA YOUTUBE: no messageID"
          );

          return;
        }

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
      "HINA YOUTUBE RUN ERROR:",
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
// قائمة الجودة
// ==================================================

async function sendQualityMenu(
  api,
  threadID,
  replyTo,
  senderID,
  url,
  title
) {

  let text =
    "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n";

  text +=
    `العنوان:\n${cleanText(
      title
    )}\n\n`;

  text +=
    "اختر نوع التحميل:\n\n";

  text +=
    "1 ┊ فيديو\n";

  text +=
    "2 ┊ صوت\n\n";

  text +=
    "أرسل رقم الاختيار";

  return api.sendMessage(
    text,
    threadID,

    (error, info) => {

      if (error) {
        console.error(
          "HINA YOUTUBE TYPE LIST ERROR:",
          error
        );
        return;
      }

      if (
        !info ||
        !info.messageID
      ) {
        return;
      }

      addHandleReply({
        name: "يوتيوب",

        messageID:
          info.messageID,

        author:
          String(senderID),

        type:
          "youtubeType",

        video: {
          url,
          title
        }
      });

      console.log(
        `𝗛𝗜𝗡𝗔 | يوتيوب | Type HR: ${info.messageID}`
      );
    },

    replyTo
  );
}


// ==================================================
// HandleReply واحد فقط
// ==================================================

module.exports.handleReply = async function ({
  api,
  event,
  handleReply
}) {

  try {

    if (
      !handleReply ||
      handleReply.name !==
        "يوتيوب"
    ) {
      return;
    }

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
    // اختيار الفيديو من نتائج البحث
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
        !Number.isInteger(
          choice
        ) ||
        choice < 1 ||
        choice > videos.length
      ) {

        return api.sendMessage(
          `اختر رقمًا من 1 إلى ${videos.length}`,

          event.threadID,
          event.messageID
        );
      }

      const video =
        videos[
          choice - 1
        ];

      if (
        !video ||
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

      const oldIndex =
        global.client.handleReply
          .indexOf(
            handleReply
          );

      if (
        oldIndex !== -1
      ) {

        global.client.handleReply.splice(
          oldIndex,
          1
        );
      }

      return sendQualityMenu(
        api,

        event.threadID,

        event.messageID,

        event.senderID,

        video.url,

        video.title
      );
    }


    // ==================================================
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
          "أرسل 1 للفيديو أو 2 للصوت.",

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

      const oldIndex =
        global.client.handleReply
          .indexOf(
            handleReply
          );

      if (
        oldIndex !== -1
      ) {

        global.client.handleReply.splice(
          oldIndex,
          1
        );
      }

      const type =
        choice === 1
          ? "video"
          : "audio";

      // ==============================================
      // قائمة الجودة
      // ==============================================

      let text =
        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n";

      text +=
        `العنوان:\n${cleanText(
          video.title
        )}\n\n`;

      if (
        type === "video"
      ) {

        text +=
          "اختر جودة الفيديو:\n\n";

        VIDEO_QUALITIES.forEach(
          (quality, index) => {

            text +=
              `${index + 1} ┊ ${quality}p\n`;
          }
        );

      } else {

        text +=
          "اختر جودة الصوت:\n\n";

        AUDIO_QUALITIES.forEach(
          (quality, index) => {

            text +=
              `${index + 1} ┊ ${quality}kbps\n`;
          }
        );
      }

      text +=
        "\nأرسل رقم الجودة";

      return api.sendMessage(
        text,
        event.threadID,

        (error, info) => {

          if (error) {

            console.error(
              "HINA YOUTUBE QUALITY ERROR:",
              error
            );

            return;
          }

          if (
            !info ||
            !info.messageID
          ) {
            return;
          }

          addHandleReply({
            name: "يوتيوب",

            messageID:
              info.messageID,

            author:
              String(
                event.senderID
              ),

            type:
              "youtubeQuality",

            video,

            mediaType:
              type
          });

          console.log(
            `𝗛𝗜𝗡𝗔 | يوتيوب | Quality HR: ${info.messageID}`
          );
        },

        event.messageID
      );
    }


    // ==================================================
    // اختيار الجودة والتحميل
    // ==================================================

    if (
      handleReply.type ===
      "youtubeQuality"
    ) {

      const choice =
        parseInt(
          body,
          10
        );

      const mediaType =
        handleReply.mediaType;

      const qualities =
        mediaType === "video"
          ? VIDEO_QUALITIES
          : AUDIO_QUALITIES;

      if (
        !Number.isInteger(
          choice
        ) ||
        choice < 1 ||
        choice > qualities.length
      ) {

        return api.sendMessage(
          `اختر رقمًا من 1 إلى ${qualities.length}`,

          event.threadID,
          event.messageID
        );
      }

      const quality =
        qualities[
          choice - 1
        ];

      const video =
        handleReply.video;

      const oldIndex =
        global.client.handleReply
          .indexOf(
            handleReply
          );

      if (
        oldIndex !== -1
      ) {

        global.client.handleReply.splice(
          oldIndex,
          1
        );
      }

      api.setMessageReaction(
        "⏳",
        event.messageID,
        () => {},
        true
      );

      await api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n" +

        "جاري تجهيز التحميل...\n\n" +

        `النوع: ${
          mediaType === "video"
            ? "فيديو"
            : "صوت"
        }\n` +

        `الجودة: ${
          mediaType === "video"
            ? quality + "p"
            : quality + "kbps"
        }`,

        event.threadID,
        event.messageID
      );

      let payload;

      try {

        payload =
          await fetchDownload(
            video.url,

            mediaType,

            quality
          );

      } catch (error) {

        console.error(
          "HINA YOUTUBE API ERROR:",
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

          "تعذر الحصول على رابط التحميل.\n\n" +

          `الخطأ:\n${
            error.message ||
            "خطأ غير معروف"
          }`,

          event.threadID,
          event.messageID
        );
      }

      try {

        await sendDownloadedMedia(
          api,

          event.threadID,

          event.messageID,

          payload
        );

        api.setMessageReaction(
          "✅",
          event.messageID,
          () => {},
          true
        );

      } catch (error) {

        console.error(
          "HINA YOUTUBE SEND ERROR:",
          error
        );

        api.setMessageReaction(
          "❌",
          event.messageID,
          () => {},
          true
        );

        return api.sendMessage(
          "فشل إرسال الملف.\n\n" +
          `${error.message || "خطأ غير معروف"}`,

          event.threadID,
          event.messageID
        );
      }

      return;
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
      "حدث خطأ أثناء تنفيذ أمر يوتيوب.\n\n" +
      `${error.message || "خطأ غير معروف"}`,

      event.threadID,
      event.messageID
    );
  }
};