const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "يوتيوب",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "البحث عن فيديوهات YouTube وتحميلها",
  commandCategory: "media",
  usages: "[رابط أو اسم الفيديو]",
  cooldowns: 10,

  dependencies: {
    "ytdl-core": "",
    "simple-youtube-api": "",
    "fs-extra": ""
  },

  envConfig: {
    "YOUTUBE_API": "AIzaSyB6pTkV2PM7yLVayhnjDSIM0cE_MbEtuvo"
  }
};

module.exports.languages = {
  ar: {
    missingInput:
      "⌬ ━━ HINA MEDIA ━━ ⌬\n\n❌ اكتب اسم الفيديو أو ضع رابط YouTube",

    overSizeAllow:
      "⌬ ━━ HINA MEDIA ━━ ⌬\n\n❌ لا يمكن إرسال الفيديو لأن حجمه أكبر من 25MB",

    returnError:
      "⌬ ━━ HINA MEDIA ━━ ⌬\n\n❌ حدث خطأ أثناء تحميل الفيديو\n%1",

    cantProcess:
      "⌬ ━━ HINA MEDIA ━━ ⌬\n\n❌ تعذر معالجة طلبك",

    returnList:
      "⌬ ━━ HINA MEDIA ━━ ⌬\n\n🎬 نتائج البحث عن:\n\n%2\n\n↳ أرسل رقم الفيديو الذي تريد تحميله",

    invalidNumber:
      "⌬ ━━ HINA MEDIA ━━ ⌬\n\n❌ أرسل رقمًا صحيحًا من القائمة",

    downloading:
      "⌬ ━━ HINA MEDIA ━━ ⌬\n\n⏳ جاري تحميل الفيديو...\nيرجى الانتظار",

    tooLarge:
      "⌬ ━━ HINA MEDIA ━━ ⌬\n\n❌ الفيديو أكبر من الحد المسموح به وهو 25MB"
  }
};

function getText(key, ...args) {
  const lang =
    module.exports.languages.ar;

  let text =
    lang[key] || key;

  args.forEach((value, index) => {
    text = text.replace(
      `%${index + 1}`,
      String(value)
    );
  });

  return text;
}

function ensureCache() {
  const cache =
    path.join(__dirname, "cache");

  if (!fs.existsSync(cache)) {
    fs.mkdirSync(cache, {
      recursive: true
    });
  }

  return cache;
}

function getVideoID(url) {
  try {
    const parsed =
      new URL(url);

    if (
      parsed.hostname.includes("youtu.be")
    ) {
      return parsed.pathname
        .replace("/", "")
        .split("/")[0];
    }

    if (
      parsed.searchParams.get("v")
    ) {
      return parsed.searchParams.get("v");
    }

    const match =
      url.match(
        /(?:embed|shorts|live)\/([a-zA-Z0-9_-]{6,})/
      );

    return match
      ? match[1]
      : null;

  } catch {
    return null;
  }
}

async function downloadVideo(
  ytdl,
  url,
  filePath
) {
  return new Promise(
    (resolve, reject) => {

      let stream;

      try {

        stream = ytdl(url, {
          quality: "lowest",
          filter: "audioandvideo"
        });

      } catch (error) {
        return reject(error);
      }

      const output =
        fs.createWriteStream(
          filePath
        );

      stream.pipe(output);

      stream.on(
        "error",
        reject
      );

      output.on(
        "error",
        reject
      );

      output.on(
        "close",
        () => resolve()
      );
    }
  );
}

async function sendVideo(
  api,
  event,
  filePath
) {
  try {

    if (
      !fs.existsSync(filePath)
    ) {
      throw new Error(
        "الملف غير موجود"
      );
    }

    const size =
      fs.statSync(
        filePath
      ).size;

    if (size > 26214400) {

      try {
        fs.unlinkSync(
          filePath
        );
      } catch {}

      return api.sendMessage(
        getText("overSizeAllow"),
        event.threadID,
        event.messageID
      );
    }

    return api.sendMessage(
      {
        body:
          "⌬ ━━ HINA MEDIA ━━ ⌬\n\n🎬 تم تحميل الفيديو",
        attachment:
          fs.createReadStream(
            filePath
          )
      },
      event.threadID,
      () => {
        try {
          fs.unlinkSync(
            filePath
          );
        } catch {}
      },
      event.messageID
    );

  } catch (error) {

    try {
      if (
        fs.existsSync(filePath)
      ) {
        fs.unlinkSync(
          filePath
        );
      }
    } catch {}

    throw error;
  }
}

module.exports.run =
async function ({
  api,
  event,
  args
}) {

  const ytdl =
    global.nodemodule[
      "ytdl-core"
    ];

  const YouTubeAPI =
    global.nodemodule[
      "simple-youtube-api"
    ];

  if (!ytdl) {
    return api.sendMessage(
      getText("returnError",
        "مكتبة ytdl-core غير مثبتة"),
      event.threadID,
      event.messageID
    );
  }

  if (!YouTubeAPI) {
    return api.sendMessage(
      getText("returnError",
        "مكتبة simple-youtube-api غير مثبتة"),
      event.threadID,
      event.messageID
    );
  }

  if (
    !args ||
    !args.length
  ) {
    return api.sendMessage(
      getText("missingInput"),
      event.threadID,
      event.messageID
    );
  }

  const input =
    args.join(" ").trim();

  const videoPattern =
    /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/.+$/i;

  const isURL =
    videoPattern.test(input);

  const cache =
    ensureCache();

  // =====================================================
  // DIRECT URL
  // =====================================================

  if (isURL) {

    const id =
      getVideoID(input);

    if (!id) {
      return api.sendMessage(
        getText("cantProcess"),
        event.threadID,
        event.messageID
      );
    }

    const filePath =
      path.join(
        cache,
        `youtube_${id}_${Date.now()}.mp4`
      );

    try {

      await api.sendMessage(
        getText("downloading"),
        event.threadID,
        event.messageID
      );

      await downloadVideo(
        ytdl,
        input,
        filePath
      );

      return await sendVideo(
        api,
        event,
        filePath
      );

    } catch (error) {

      console.error(
        "[YOUTUBE DOWNLOAD ERROR]",
        error
      );

      try {
        if (
          fs.existsSync(filePath)
        ) {
          fs.unlinkSync(
            filePath
          );
        }
      } catch {}

      return api.sendMessage(
        getText(
          "returnError",
          error.message
        ),
        event.threadID,
        event.messageID
      );
    }
  }

  // =====================================================
  // SEARCH
  // =====================================================

  try {

    const apiKey =
      global.configModule
        ?.youtube
        ?.YOUTUBE_API ||
      global.configModule
        ?.يوتيوب
        ?.YOUTUBE_API ||
      module.exports.config
        .envConfig
        .YOUTUBE_API;

    if (!apiKey) {
      return api.sendMessage(
        getText(
          "returnError",
          "لم يتم العثور على YouTube API"
        ),
        event.threadID,
        event.messageID
      );
    }

    const youtube =
      new YouTubeAPI(
        apiKey
      );

    const results =
      await youtube.searchVideos(
        input,
        5
      );

    if (
      !results ||
      !results.length
    ) {
      return api.sendMessage(
        "⌬ ━━ HINA MEDIA ━━ ⌬\n\n❌ لم يتم العثور على نتائج",
        event.threadID,
        event.messageID
      );
    }

    const links = [];
    let message = "";
    let number = 1;

    for (
      const video of results
    ) {

      if (
        !video ||
        !video.id
      ) {
        continue;
      }

      links.push(
        video.id
      );

      message +=
        `${number}. ${video.title}\n\n`;

      number++;
    }

    if (!links.length) {
      return api.sendMessage(
        getText(
          "cantProcess"
        ),
        event.threadID,
        event.messageID
      );
    }

    return api.sendMessage(
      getText(
        "returnList",
        links.length,
        message
      ),
      event.threadID,
      (error, info) => {

        if (
          error ||
          !info
        ) {
          return;
        }

        if (
          !global.client.handleReply
        ) {
          global.client.handleReply =
            [];
        }

        global.client.handleReply.push({
          name:
            module.exports
              .config
              .name,

          messageID:
            info.messageID,

          author:
            String(
              event.senderID
            ),

          link:
            links
        });
      },
      event.messageID
    );

  } catch (error) {

    console.error(
      "[YOUTUBE SEARCH ERROR]",
      error
    );

    return api.sendMessage(
      getText(
        "returnError",
        error.message
      ),
      event.threadID,
      event.messageID
    );
  }
};

// =========================================================
// HANDLE REPLY
// =========================================================

module.exports.handleReply =
async function ({
  api,
  event,
  handleReply
}) {

  if (
    String(event.senderID) !==
    String(handleReply.author)
  ) {
    return;
  }

  const choice =
    Number(
      String(
        event.body || ""
      ).trim()
    );

  if (
    !Number.isInteger(choice) ||
    choice < 1 ||
    choice > handleReply.link.length
  ) {

    return api.sendMessage(
      getText("invalidNumber"),
      event.threadID,
      event.messageID
    );
  }

  const videoID =
    handleReply.link[
      choice - 1
    ];

  const url =
    `https://www.youtube.com/watch?v=${videoID}`;

  const cache =
    ensureCache();

  const filePath =
    path.join(
      cache,
      `youtube_${videoID}_${Date.now()}.mp4`
    );

  const ytdl =
    global.nodemodule[
      "ytdl-core"
    ];

  if (!ytdl) {
    return api.sendMessage(
      getText(
        "returnError",
        "مكتبة ytdl-core غير مثبتة"
      ),
      event.threadID,
      event.messageID
    );
  }

  try {

    await api.unsendMessage(
      handleReply.messageID
    );

  } catch {}

  try {

    await api.sendMessage(
      getText("downloading"),
      event.threadID,
      event.messageID
    );

    await downloadVideo(
      ytdl,
      url,
      filePath
    );

    return await sendVideo(
      api,
      event,
      filePath
    );

  } catch (error) {

    console.error(
      "[YOUTUBE REPLY ERROR]",
      error
    );

    try {
      if (
        fs.existsSync(filePath)
      ) {
        fs.unlinkSync(
          filePath
        );
      }
    } catch {}

    return api.sendMessage(
      getText(
        "returnError",
        error.message
      ),
      event.threadID,
      event.messageID
    );
  }
};