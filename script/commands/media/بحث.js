const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "بحث",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "البحث عن صور مشابهة عبر Google Lens و Pinterest",
  commandCategory: "Media",
  usages: "بحث بالرد على صورة",
  cooldowns: 10
};


// ==================================================
// الإعدادات
// ==================================================

const CACHE_DIR = path.join(
  __dirname,
  "cache",
  "search"
);

const MAX_RESULTS = 5;


// ==================================================
// إنشاء مجلد الكاش
// ==================================================

async function ensureCache() {

  await fs.ensureDir(
    CACHE_DIR
  );
}


// ==================================================
// استخراج رابط الصورة من Attachment
// ==================================================

function getImageURLFromAttachment(
  attachment
) {

  if (!attachment) {
    return null;
  }


  const possible = [

    attachment.url,

    attachment.href,

    attachment.imageUrl,

    attachment.imageURL,

    attachment.previewUrl,

    attachment.previewURL,

    attachment.target

  ];


  for (
    const value of possible
  ) {

    if (
      typeof value === "string" &&
      /^https?:\/\//i.test(value)
    ) {

      return value;
    }
  }


  return null;
}


// ==================================================
// استخراج صورة من الرسالة
// ==================================================

function getImageFromMessage(
  message
) {

  if (!message) {
    return null;
  }


  // Attachment مباشر

  if (
    Array.isArray(
      message.attachments
    )
  ) {

    for (
      const attachment
      of message.attachments
    ) {

      if (!attachment) {
        continue;
      }


      const type =
        String(
          attachment.type || ""
        ).toLowerCase();


      const url =
        getImageURLFromAttachment(
          attachment
        );


      if (
        url &&
        (
          !type ||
          type === "photo" ||
          type === "image"
        )
      ) {

        return url;
      }
    }
  }


  // Reply داخلي

  if (
    message.messageReply
  ) {

    const result =
      getImageFromMessage(
        message.messageReply
      );

    if (result) {
      return result;
    }
  }


  if (
    message.replyToMessage
  ) {

    const result =
      getImageFromMessage(
        message.replyToMessage
      );

    if (result) {
      return result;
    }
  }


  return null;
}


// ==================================================
// استخراج صورة من event
// ==================================================

function getReplyImage(
  event
) {

  if (
    !event.messageReply
  ) {

    return null;
  }


  return getImageFromMessage(
    event.messageReply
  );
}


// ==================================================
// تنظيف النص
// ==================================================

function cleanText(
  text
) {

  return String(text || "")
    .replace(
      /\\u003c/gi,
      "<"
    )
    .replace(
      /\\u003e/gi,
      ">"
    )
    .replace(
      /\\"/g,
      '"'
    )
    .replace(
      /\\\//g,
      "/"
    )
    .replace(
      /\\u0026/gi,
      "&"
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


// ==================================================
// استخراج كلمات من نتائج Google Lens
// ==================================================

function extractLensKeywords(
  html
) {

  const keywords = [];


  if (
    !html ||
    typeof html !== "string"
  ) {

    return keywords;
  }


  const text =
    cleanText(
      html
    );


  // ------------------------------------------------
  // title
  // ------------------------------------------------

  const titleMatches =
    html.match(
      /<title[^>]*>([\s\S]*?)<\/title>/gi
    ) || [];


  for (
    const item
    of titleMatches
  ) {

    const value =
      item
        .replace(
          /<[^>]+>/g,
          " "
        )
        .replace(
          /&quot;/g,
          '"'
        )
        .replace(
          /&amp;/g,
          "&"
        )
        .trim();


    if (
      value.length >= 3 &&
      value.length <= 200
    ) {

      keywords.push(
        value
      );
    }
  }


  // ------------------------------------------------
  // metadata
  // ------------------------------------------------

  const metaRegex =
    /<(?:meta)[^>]+(?:content|name|property)=["']([^"']+)["'][^>]*>/gi;


  let match;


  while (
    (match =
      metaRegex.exec(html)) !== null
  ) {

    const value =
      cleanText(
        match[1]
      );


    if (
      value.length >= 3 &&
      value.length <= 200
    ) {

      keywords.push(
        value
      );
    }
  }


  // ------------------------------------------------
  // نصوص ظاهرة محتملة
  // ------------------------------------------------

  const textMatches =
    text.match(
      /[A-Za-z\u0600-\u06FF][A-Za-z0-9\u0600-\u06FF ._-]{2,80}/g
    ) || [];


  for (
    const value
    of textMatches
  ) {

    const cleaned =
      value.trim();


    if (
      cleaned.length >= 3 &&
      cleaned.length <= 80
    ) {

      keywords.push(
        cleaned
      );
    }
  }


  // ------------------------------------------------
  // إزالة الأشياء غير المفيدة
  // ------------------------------------------------

  const blocked = [

    "google",

    "google lens",

    "search",

    "images",

    "image",

    "lens",

    "sign in",

    "privacy",

    "terms",

    "javascript",

    "settings"

  ];


  const final =
    keywords
      .map(
        item =>
          cleanText(item)
      )
      .filter(
        item =>
          item.length >= 3
      )
      .filter(
        item => {

          const lower =
            item.toLowerCase();

          return !blocked.includes(
            lower
          );
        }
      );


  return [
    ...new Set(final)
  ].slice(
    0,
    20
  );
}


// ==================================================
// Google Lens
// ==================================================

async function searchGoogleLens(
  imageURL
) {

  const lensURL =
    "https://lens.google.com/uploadbyurl?url=" +
    encodeURIComponent(
      imageURL
    );


  const response =
    await axios.get(
      lensURL,
      {
        timeout: 30000,

        maxRedirects: 5,

        headers: {

          "User-Agent":
            "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36",

          "Accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",

          "Accept-Language":
            "ar,en-US;q=0.9,en;q=0.8",

          "Referer":
            "https://www.google.com/"

        }
      }
    );


  if (
    !response.data ||
    typeof response.data !== "string"
  ) {

    throw new Error(
      "Google Lens لم يُرجع صفحة نتائج"
    );
  }


  const html =
    response.data;


  const keywords =
    extractLensKeywords(
      html
    );


  return {

    url:
      response.request?.res?.responseUrl ||
      lensURL,

    keywords,

    html

  };
}


// ==================================================
// البحث في Pinterest
// ==================================================

async function searchPinterest(
  query
) {

  const url =
    "https://www.pinterest.com/search/pins/?q=" +
    encodeURIComponent(
      query
    );


  const response =
    await axios.get(
      url,
      {

        timeout: 30000,

        headers: {

          "User-Agent":
            "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36",

          "Accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",

          "Accept-Language":
            "ar,en-US;q=0.9,en;q=0.8",

          "Referer":
            "https://www.pinterest.com/"

        }

      }
    );


  const html =
    response.data;


  if (
    !html ||
    typeof html !== "string"
  ) {

    return [];
  }


  const results = [];


  // ------------------------------------------------
  // الصور
  // ------------------------------------------------

  const imageRegex =
    /https?:\\?\/\\?\/i\.pinimg\.com\\?\/[^"'\\\s<>]+/gi;


  const imageMatches =
    html.match(
      imageRegex
    ) || [];


  for (
    let imageURL
    of imageMatches
  ) {

    imageURL =
      imageURL

        .replace(
          /\\u002F/g,
          "/"
        )

        .replace(
          /\\\//g,
          "/"
        )

        .replace(
          /\\/g,
          ""
        )

        .replace(
          /["']+$/,
          ""
        );


    if (
      !imageURL.includes(
        "i.pinimg.com"
      )
    ) {

      continue;
    }


    imageURL =
      imageURL

        .replace(
          "/75x75_RS/",
          "/originals/"
        )

        .replace(
          "/60x60/",
          "/originals/"
        )

        .replace(
          "/236x/",
          "/originals/"
        )

        .replace(
          "/474x/",
          "/originals/"
        )

        .replace(
          "/564x/",
          "/originals/"
        )

        .replace(
          "/736x/",
          "/originals/"
        )

        .replace(
          "/1200x/",
          "/originals/"
        );


    if (
      !results.some(
        item =>
          item.url ===
          imageURL
      )
    ) {

      results.push({

        url:
          imageURL,

        title:
          query

      });
    }


    if (
      results.length >= 20
    ) {

      break;
    }
  }


  return results;
}


// ==================================================
// تحميل صورة
// ==================================================

async function downloadImage(
  url,
  filePath
) {

  try {

    const response =
      await axios.get(
        url,
        {

          responseType:
            "arraybuffer",

          timeout:
            30000,

          maxContentLength:
            20 * 1024 * 1024,

          maxBodyLength:
            20 * 1024 * 1024,

          headers: {

            "User-Agent":
              "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36",

            "Referer":
              "https://www.pinterest.com/"

          }

        }
      );


    if (
      !response.data
    ) {

      return false;
    }


    await fs.writeFile(
      filePath,
      Buffer.from(
        response.data
      )
    );


    return true;

  } catch (error) {

    console.error(
      "[HINA SEARCH] IMAGE ERROR:",
      error.message
    );

    return false;
  }
}


// ==================================================
// إرسال النتائج
// ==================================================

async function sendResults({
  api,
  event,
  imageURL,
  query,
  keywords,
  startIndex = 0,
  author
}) {

  await ensureCache();


  let pinterestResults =
    await searchPinterest(
      query
    );


  // ------------------------------------------------
  // إذا لم نجد نتائج بالعبارة الأولى
  // نجرب الكلمات الأخرى
  // ------------------------------------------------

  if (
    pinterestResults.length < 5 &&
    Array.isArray(keywords)
  ) {

    for (
      const keyword
      of keywords.slice(0, 5)
    ) {

      if (
        keyword === query
      ) {

        continue;
      }


      try {

        const extra =
          await searchPinterest(
            keyword
          );


        for (
          const result
          of extra
        ) {

          if (
            !pinterestResults.some(
              item =>
                item.url ===
                result.url
            )
          ) {

            pinterestResults.push(
              result
            );
          }


          if (
            pinterestResults.length >= 20
          ) {

            break;
          }
        }

      } catch (_) {}


      if (
        pinterestResults.length >= 20
      ) {

        break;
      }
    }
  }


  if (
    !pinterestResults.length
  ) {

    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 SEARCH ━━ ⌬\n\n` +

      `❌ لم أجد نتائج مناسبة في Pinterest.\n\n` +

      `🔎 البحث:\n${query}`,
      event.threadID,
      event.messageID
    );
  }


  const selected =
    pinterestResults.slice(
      startIndex,
      startIndex + MAX_RESULTS
    );


  if (
    !selected.length
  ) {

    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 SEARCH ━━ ⌬\n\n` +

      `📭 لا توجد نتائج إضافية.\n\n` +

      `استخدم بحثًا جديدًا بصورة أخرى.`,
      event.threadID,
      event.messageID
    );
  }


  const files = [];
  const titles = [];


  // ------------------------------------------------
  // تحميل الصور
  // ------------------------------------------------

  for (
    let i = 0;
    i < selected.length;
    i++
  ) {

    const item =
      selected[i];


    const filePath =
      path.join(
        CACHE_DIR,

        `search_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}_${i}.jpg`
      );


    const success =
      await downloadImage(
        item.url,
        filePath
      );


    if (success) {

      files.push(
        filePath
      );

      titles.push(
        item.title ||
        query
      );
    }
  }


  if (
    !files.length
  ) {

    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 SEARCH ━━ ⌬\n\n` +

      `❌ تمكنت من العثور على النتائج،` +
      ` لكن تعذر تحميل الصور.`,
      event.threadID,
      event.messageID
    );
  }


  const attachments =
    files.map(
      file =>
        fs.createReadStream(
          file
        )
    );


  let body =
    `⌬ ━━ 𝗛𝗜𝗡𝗔 SEARCH ━━ ⌬\n\n` +

    `🔎 البحث المستنتج:\n` +

    `${query}\n\n`;


  if (
    keywords &&
    keywords.length
  ) {

    body +=
      `🏷️ كلمات مرتبطة:\n` +

      `${keywords
        .slice(0, 5)
        .join(" | ")}\n\n`;
  }


  body +=
    `🖼️ نتائج Pinterest: ${files.length}\n\n`;


  body +=
    `↪️ رد بـ "المزيد" للحصول على نتائج أخرى`;


  return new Promise(
    resolve => {

      api.sendMessage(
        {

          body,

          attachment:
            attachments

        },

        event.threadID,

        (error, info) => {

          // ------------------------------------------------
          // حذف الكاش
          // ------------------------------------------------

          setTimeout(
            async () => {

              for (
                const file
                of files
              ) {

                try {

                  if (
                    await fs.pathExists(
                      file
                    )
                  ) {

                    await fs.remove(
                      file
                    );
                  }

                } catch (_) {}
              }

            },

            30000
          );


          if (
            error ||
            !info?.messageID
          ) {

            console.error(
              "[HINA SEARCH] SEND ERROR:",
              error
            );

            resolve(
              null
            );

            return;
          }


          // ------------------------------------------------
          // جلسة المزيد
          // ------------------------------------------------

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
              info.messageID,

            author:
              String(author),

            query:
              query,

            keywords:
              keywords || [],

            imageURL:
              imageURL,

            nextIndex:
              startIndex +
              selected.length

          });


          resolve({

            messageID:
              info.messageID,

            nextIndex:
              startIndex +
              selected.length

          });

        },

        event.messageID

      );

    }
  );
}


// ==================================================
// الرد بـ المزيد
// ==================================================

module.exports.handleReply =
async function({
  api,
  event,
  handleReply
}) {

  const {
    body = "",
    senderID
  } = event;


  const text =
    String(body)
      .trim()
      .toLowerCase();


  const moreWords = [

    "المزيد",

    "المزيد صور",

    "المزيد من الصور",

    "صور اكثر",

    "صور أكثر",

    "اكثر",

    "أكثر",

    "5"

  ];


  if (
    !moreWords.includes(
      text
    )
  ) {

    return;
  }


  // ------------------------------------------------
  // صاحب البحث فقط
  // ------------------------------------------------

  if (
    handleReply.author &&
    String(
      handleReply.author
    ) !==
    String(senderID)
  ) {

    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 SEARCH ━━ ⌬\n\n` +

      `⛔ هذا البحث خاص بصاحبه.`,
      event.threadID,
      event.messageID
    );
  }


  const result =
    await sendResults({

      api,

      event,

      imageURL:
        handleReply.imageURL,

      query:
        handleReply.query,

      keywords:
        handleReply.keywords,

      startIndex:
        Number(
          handleReply.nextIndex ||
          0
        ),

      author:
        senderID

    });


  if (
    result
  ) {

    handleReply.nextIndex =
      result.nextIndex;
  }

};


// ==================================================
// الأمر الرئيسي
// ==================================================

module.exports.run =
async function({
  api,
  event,
  args
}) {

  const {
    threadID,
    messageID,
    senderID
  } = event;


  try {

    // ------------------------------------------------
    // يجب أن يكون الأمر ردًا على صورة
    // ------------------------------------------------

    const imageURL =
      getReplyImage(
        event
      );


    if (!imageURL) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 SEARCH ━━ ⌬\n\n` +

        `❌ يجب أن ترد على رسالة تحتوي على صورة.\n\n` +

        `📝 الاستخدام:\n` +

        `1 ─ أرسل أو ابحث عن صورة\n` +

        `2 ─ قم بالرد عليها\n` +

        `3 ─ اكتب:\n` +

        `.بحث\n\n` +

        `🔎 سأحاول التعرف على محتوى الصورة` +
        ` ثم البحث عن نتائج مشابهة في Pinterest.`,

        threadID,

        messageID
      );
    }


    // ------------------------------------------------
    // رسالة انتظار
    // ------------------------------------------------

    await api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 SEARCH ━━ ⌬\n\n` +

      `⏳ جارٍ تحليل الصورة...\n\n` +

      `🖼️ الصورة ✓\n` +

      `🔎 Google Lens ⏳\n` +

      `📌 Pinterest\n` +

      `🖼️ النتائج`,

      threadID
    );


    // ------------------------------------------------
    // Lens
    // ------------------------------------------------

    let lens;


    try {

      lens =
        await searchGoogleLens(
          imageURL
        );

    } catch (error) {

      console.error(
        "[HINA SEARCH] LENS ERROR:",
        error.message
      );


      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 SEARCH ━━ ⌬\n\n` +

        `❌ تعذر تحليل الصورة بواسطة Google Lens.\n\n` +

        `📝 ${error.message}\n\n` +

        `📌 تأكد أن الصورة المرفقة لها رابط يمكن الوصول إليه من الإنترنت.`,

        threadID,

        messageID
      );
    }


    // ------------------------------------------------
    // الكلمات
    // ------------------------------------------------

    let keywords =
      lens.keywords || [];


    // ------------------------------------------------
    // اختيار أفضل عبارة
    // ------------------------------------------------

    let query =
      keywords[0] ||
      "";


    // إذا لم نستخرج كلمة
    if (!query) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 SEARCH ━━ ⌬\n\n` +

        `⚠️ تم استلام الصورة، لكن لم أستطع استخراج وصف مناسب لها.\n\n` +

        `💡 جرّب صورة أوضح أو صورة يظهر فيها العنصر بشكل أكبر.`,

        threadID,

        messageID
      );
    }


    // ------------------------------------------------
    // Pinterest
    // ------------------------------------------------

    const result =
      await sendResults({

        api,

        event,

        imageURL,

        query,

        keywords,

        startIndex: 0,

        author:
          senderID

      });


    return result;

  } catch (error) {

    console.error(
      "[HINA SEARCH ERROR]",
      error
    );


    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 SEARCH ━━ ⌬\n\n` +

      `❌ حدث خطأ أثناء البحث.\n\n` +

      `📝 ${
        error?.message ||
        "خطأ غير معروف"
      }`,

      threadID,

      messageID
    );
  }
};