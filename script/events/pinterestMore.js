const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "pinterestMore",
  version: "2.0.0",
  credits: "أبو هريرة",
  description: "جلب 5 صور إضافية من Pinterest عند الرد بالمزيد",
  eventType: ["message"]
};

// ==================================================
// تخزين جلسات البحث
// ==================================================

if (!global.pinterestSearches) {
  global.pinterestSearches = new Map();
}

// ==================================================
// تحميل صورة
// ==================================================

async function downloadImage(url, filePath) {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 30000,

      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36",
        "Referer": "https://www.pinterest.com/"
      },

      maxContentLength: 20 * 1024 * 1024,
      maxBodyLength: 20 * 1024 * 1024
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
      "Pinterest Download:",
      error.message
    );

    return false;
  }
}

// ==================================================
// البحث في Pinterest
// ==================================================

async function searchPinterest(query, startIndex = 0) {

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
        "no-cache"
    }
  });

  const html = response.data;

  if (
    !html ||
    typeof html !== "string"
  ) {
    throw new Error(
      "تعذر قراءة نتائج Pinterest"
    );
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

    if (
      !imageURL.includes(
        "i.pinimg.com"
      )
    ) {
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

    // ==================================================
    // منع التكرار
    // ==================================================

    if (
      !results.includes(imageURL)
    ) {
      results.push(imageURL);
    }
  }

  const unique =
    [...new Set(results)];

  return unique.slice(
    startIndex,
    startIndex + 5
  );
}

// ==================================================
// تنظيف ملفات قديمة
// ==================================================

async function cleanFiles(files) {

  for (const file of files) {

    try {

      if (
        await fs.pathExists(file)
      ) {
        await fs.remove(file);
      }

    } catch (error) {}
  }
}

// ==================================================
// الحدث
// ==================================================

module.exports.run = async function ({
  api,
  event
}) {

  try {

    const {
      body,
      threadID,
      senderID,
      messageReply,
      type
    } = event;

    // ==================================================
    // يجب أن تكون رسالة نصية
    // ==================================================

    if (
      !body ||
      !threadID ||
      !senderID
    ) {
      return;
    }

    // ==================================================
    // تنظيف الرسالة
    // ==================================================

    const text =
      String(body)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    // ==================================================
    // الكلمات التي تطلب المزيد
    // ==================================================

    const moreWords = [
      "المزيد",
      "المزيد صور",
      "المزيد من الصور",
      "صور المزيد",
      "more",
      "more photos",
      "5"
    ];

    if (
      !moreWords.includes(text)
    ) {
      return;
    }

    // ==================================================
    // يجب أن يكون ردًا على رسالة
    // ==================================================

    if (
      !messageReply ||
      !messageReply.messageID
    ) {
      return;
    }

    // ==================================================
    // التأكد أن الرسالة الأصلية من البوت
    // ==================================================

    const botID =
      String(
        api.getCurrentUserID()
      );

    if (
      String(
        messageReply.senderID
      ) !== botID
    ) {
      return;
    }

    // ==================================================
    // البحث عن جلسة Pinterest
    // ==================================================

    const oldMessageID =
      String(
        messageReply.messageID
      );

    const searchData =
      global.pinterestSearches.get(
        oldMessageID
      );

    if (!searchData) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 PINTEREST ━━ ⌬\n\n` +
        `⚠️ لم أجد جلسة البحث لهذه الرسالة.\n\n` +
        `استخدم الأمر من جديد:\n` +
        `${searchData?.prefix || ""}بنترست [كلمة البحث]`,
        threadID
      );
    }

    // ==================================================
    // السماح فقط لصاحب البحث
    // ==================================================

    if (
      searchData.senderID &&
      String(searchData.senderID) !==
      String(senderID)
    ) {
      return;
    }

    // ==================================================
    // انتهاء الجلسة بعد 15 دقيقة
    // ==================================================

    const sessionAge =
      Date.now() -
      searchData.createdAt;

    if (
      sessionAge >
      15 * 60 * 1000
    ) {

      global.pinterestSearches.delete(
        oldMessageID
      );

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 PINTEREST ━━ ⌬\n\n` +
        `⌛ انتهت جلسة البحث.\n\n` +
        `استخدم الأمر من جديد للبحث عن الصور.`,
        threadID
      );
    }

    // ==================================================
    // منع طلبات المزيد المتكررة بسرعة
    // ==================================================

    if (
      searchData.loading
    ) {
      return;
    }

    searchData.loading = true;

    // ==================================================
    // مجلد الكاش
    // ==================================================

    const cacheDir =
      path.join(
        __dirname,
        "..",
        "commands",
        "cache",
        "pinterest"
      );

    await fs.ensureDir(
      cacheDir
    );

    // ==================================================
    // جلب 5 صور جديدة
    // ==================================================

    const startIndex =
      Number(
        searchData.nextIndex || 0
      );

    const urls =
      await searchPinterest(
        searchData.query,
        startIndex
      );

    if (
      !urls.length
    ) {

      searchData.loading = false;

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 PINTEREST ━━ ⌬\n\n` +
        `❌ لا توجد صور إضافية لهذا البحث.\n\n` +
        `🔎 البحث: ${searchData.query}`,
        threadID
      );
    }

    // ==================================================
    // تحميل الصور
    // ==================================================

    const files = [];

    for (
      let i = 0;
      i < urls.length;
      i++
    ) {

      const filePath =
        path.join(
          cacheDir,
          `pinterest_more_${Date.now()}_${i}.jpg`
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

    // ==================================================
    // التحقق من الصور
    // ==================================================

    if (
      !files.length
    ) {

      searchData.loading = false;

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 PINTEREST ━━ ⌬\n\n` +
        `❌ تعذر تحميل الصور من Pinterest.\n\n` +
        `حاول كتابة "المزيد" مرة أخرى.`,
        threadID
      );
    }

    // ==================================================
    // تحديث الجلسة
    // ==================================================

    searchData.nextIndex =
      startIndex + urls.length;

    searchData.createdAt =
      Date.now();

    searchData.loading =
      false;

    // ==================================================
    // تجهيز المرفقات
    // ==================================================

    const attachments =
      files.map(file =>
        fs.createReadStream(file)
      );

    const message =
      `⌬ ━━ 𝗛𝗜𝗡𝗔 PINTEREST ━━ ⌬\n\n` +
      `🔎 البحث: ${searchData.query}\n\n` +
      `🖼️ تم جلب ${files.length} صور إضافية\n\n` +
      `↪️ رد بـ "المزيد" للحصول على 5 صور أخرى`;

    // ==================================================
    // إرسال الصور
    // ==================================================

    api.sendMessage(
      {
        body: message,
        attachment: attachments
      },

      threadID,

      (error, info) => {

        // ==================================================
        // حذف الملفات بعد الإرسال
        // ==================================================

        setTimeout(
          () => {
            cleanFiles(files);
          },
          30000
        );

        // ==================================================
        // إنشاء جلسة للرسالة الجديدة
        // ==================================================

        if (
          !error &&
          info &&
          info.messageID
        ) {

          global.pinterestSearches.set(
            String(info.messageID),
            {
              query:
                searchData.query,

              nextIndex:
                searchData.nextIndex,

              senderID:
                searchData.senderID,

              createdAt:
                Date.now(),

              loading:
                false
            }
          );
        }
      }
    );

  } catch (error) {

    console.error(
      "❌ Pinterest More Error:",
      error
    );

    return api.sendMessage(
      `⌬ ━━ 𝗛𝗜𝗡𝗔 PINTEREST ━━ ⌬\n\n` +
      `❌ حدث خطأ أثناء جلب الصور الإضافية.\n\n` +
      `📝 ${error.message}`,
      event.threadID,
      event.messageID
    );
  }
};