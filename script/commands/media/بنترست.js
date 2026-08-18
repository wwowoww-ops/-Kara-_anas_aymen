const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "بنترست",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "جلب 5 صور من Pinterest مع دعم المزيد بالرد",
  commandCategory: "Media",
  usages: "بنترست [كلمة البحث]",
  cooldowns: 5
};

// ==================================================
// البحث في Pinterest
// ==================================================

async function searchPinterest(query) {

  const url =
    "https://www.pinterest.com/search/pins/?q=" +
    encodeURIComponent(query);

  const response = await axios.get(url, {
    timeout: 30000,

    headers: {
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36",

      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",

      "Accept-Language":
        "ar,en-US;q=0.9,en;q=0.8",

      "Cache-Control":
        "no-cache",

      "Referer":
        "https://www.pinterest.com/"
    }
  });

  const html = response.data;

  if (!html || typeof html !== "string") {
    throw new Error("تعذر قراءة نتائج Pinterest");
  }

  const results = [];

  // ==================================================
  // استخراج روابط الصور
  // ==================================================

  const regex =
    /https?:\\?\/\\?\/i\.pinimg\.com\\?\/[^"'\\\s<>]+/gi;

  const matches =
    html.match(regex) || [];

  for (let imageURL of matches) {

    imageURL = imageURL
      .replace(/\\u002F/g, "/")
      .replace(/\\\//g, "/")
      .replace(/\\/g, "")
      .replace(/["']+$/, "");

    if (!imageURL.includes("i.pinimg.com")) {
      continue;
    }

    // ==================================================
    // محاولة الحصول على أعلى جودة
    // ==================================================

    imageURL = imageURL
      .replace("/75x75_RS/", "/originals/")
      .replace("/60x60/", "/originals/")
      .replace("/236x/", "/originals/")
      .replace("/474x/", "/originals/")
      .replace("/564x/", "/originals/")
      .replace("/736x/", "/originals/")
      .replace("/1200x/", "/originals/");

    if (!results.includes(imageURL)) {
      results.push(imageURL);
    }
  }

  return [...new Set(results)];
}


// ==================================================
// تحميل الصورة
// ==================================================

async function downloadImage(url, filePath) {

  try {

    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 30000,

      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36",

        "Referer":
          "https://www.pinterest.com/"
      },

      maxContentLength:
        20 * 1024 * 1024,

      maxBodyLength:
        20 * 1024 * 1024
    });

    if (!response.data) {
      return false;
    }

    await fs.writeFile(
      filePath,
      Buffer.from(response.data)
    );

    return true;

  } catch (error) {

    console.error(
      "Pinterest Download Error:",
      error.message
    );

    return false;
  }
}


// ==================================================
// إرسال 5 صور
// ==================================================

async function sendPinterestImages({
  api,
  threadID,
  messageID,
  query,
  startIndex,
  author
}) {

  const cacheDir = path.join(
    __dirname,
    "cache",
    "pinterest"
  );

  await fs.ensureDir(cacheDir);

  const files = [];

  try {

    // ==================================================
    // البحث
    // ==================================================

    const allImages =
      await searchPinterest(query);

    if (!allImages.length) {

      await api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 PINTEREST ━━ ⌬\n\n` +
        `❌ لم أجد صورًا لهذا البحث.\n\n` +
        `🔎 ${query}`,
        threadID,
        messageID
      );

      return null;
    }


    // ==================================================
    // اختيار 5 صور
    // ==================================================

    const urls =
      allImages.slice(
        startIndex,
        startIndex + 5
      );


    if (!urls.length) {

      await api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 PINTEREST ━━ ⌬\n\n` +
        `📭 لا توجد صور إضافية لهذا البحث.\n\n` +
        `🔎 ${query}`,
        threadID,
        messageID
      );

      return null;
    }


    // ==================================================
    // تحميل الصور
    // ==================================================

    for (
      let i = 0;
      i < urls.length;
      i++
    ) {

      const filePath =
        path.join(
          cacheDir,
          `pin_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}_${i}.jpg`
        );

      const success =
        await downloadImage(
          urls[i],
          filePath
        );

      if (success) {
        files.push(filePath);
      }
    }


    if (!files.length) {

      await api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 PINTEREST ━━ ⌬\n\n` +
        `❌ تعذر تحميل الصور من Pinterest.`,
        threadID,
        messageID
      );

      return null;
    }


    // ==================================================
    // تجهيز المرفقات
    // ==================================================

    const attachments =
      files.map(file =>
        fs.createReadStream(file)
      );


    const body =
      `⌬ ━━ 𝗛𝗜𝗡𝗔 PINTEREST ━━ ⌬\n\n` +
      `🔎 البحث: ${query}\n\n` +
      `🖼️ تم جلب ${files.length} صور\n\n` +
      `↪️ رد على هذه الرسالة بـ "المزيد" للحصول على صور أخرى`;


    // ==================================================
    // إرسال الرسالة
    // ==================================================

    return await new Promise((resolve) => {

      api.sendMessage(
        {
          body,
          attachment: attachments
        },

        threadID,

        (error, info) => {

          // ==================================================
          // حذف الملفات المؤقتة
          // ==================================================

          setTimeout(async () => {

            for (const file of files) {

              try {

                if (
                  await fs.pathExists(file)
                ) {
                  await fs.remove(file);
                }

              } catch {}
            }

          }, 30000);


          if (error || !info?.messageID) {

            console.error(
              "Pinterest Send Error:",
              error
            );

            resolve(null);
            return;
          }


          // ==================================================
          // حفظ جلسة الرد
          // ==================================================

          if (!global.client.handleReply) {
            global.client.handleReply = [];
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

            nextIndex:
              startIndex + urls.length
          });


          resolve({
            messageID:
              info.messageID,

            nextIndex:
              startIndex + urls.length
          });

        },

        messageID
      );

    });

  } catch (error) {

    console.error(
      "❌ Pinterest Error:",
      error
    );


    for (const file of files) {

      try {

        if (
          await fs.pathExists(file)
        ) {
          await fs.remove(file);
        }

      } catch {}
    }


    await api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 PINTEREST ━━ ⌬\n\n` +
      `❌ حدث خطأ أثناء البحث.\n\n` +
      `📝 ${error.message}`,
      threadID,
      messageID
    );

    return null;
  }
}


// ==================================================
// الرد على رسالة Pinterest
// ==================================================

module.exports.handleReply = async function ({
  api,
  event,
  handleReply
}) {

  const {
    threadID,
    messageID,
    senderID,
    body = ""
  } = event;


  // ==================================================
  // التحقق من كلمة المزيد
  // ==================================================

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


  if (!moreWords.includes(text)) {
    return;
  }


  // ==================================================
  // التحقق من صاحب البحث
  // ==================================================

  if (
    handleReply.author &&
    String(handleReply.author) !==
      String(senderID)
  ) {

    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 PINTEREST ━━ ⌬\n\n` +
      `⛔ هذا البحث خاص بصاحبه.`,
      threadID,
      messageID
    );
  }


  // ==================================================
  // إرسال 5 صور إضافية
  // ==================================================

  const result =
    await sendPinterestImages({
      api,

      threadID,

      messageID,

      query:
        handleReply.query,

      startIndex:
        Number(
          handleReply.nextIndex || 0
        ),

      author:
        senderID
    });


  // ==================================================
  // تحديث جلسة الرد
  // ==================================================

  if (result) {

    handleReply.nextIndex =
      result.nextIndex;
  }

};


// ==================================================
// الأمر الأساسي
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


  // ==================================================
  // قراءة args من handleCommand
  // ==================================================

  const searchArgs =
    Array.isArray(args)
      ? args
      : [];


  const query =
    searchArgs
      .join(" ")
      .trim();


  // ==================================================
  // لا يوجد بحث
  // ==================================================

  if (!query) {

    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 PINTEREST ━━ ⌬\n\n` +
      `اكتب كلمة البحث بعد الأمر.\n\n` +
      `مثال:\n` +
      `بنترست ناروتو`,
      threadID,
      messageID
    );
  }


  // ==================================================
  // جلب أول 5 صور
  // ==================================================

  await sendPinterestImages({

    api,

    threadID,

    messageID,

    query,

    startIndex: 0,

    author: senderID

  });

};