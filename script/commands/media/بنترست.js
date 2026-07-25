const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "بنترست",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "البحث عن صور من Pinterest",
  commandCategory: "media",
  usages: "بنترست [كلمة البحث]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const search = args.join(" ");

  if (!search) {
    return api.sendMessage(
      `⌬ ━━ HINA MEDIA ━━ ⌬\n\n📝 استخدم: بنترست [كلمة البحث]\nمثال: بنترست مناظر طبيعية`,
      threadID,
      messageID
    );
  }

  try {
    // البحث عن الصور
    const response = await axios.get(
      `https://api.pinterest.com/v1/search/pins/?q=${encodeURIComponent(search)}&limit=20`,
      {
        headers: {
          'Authorization': 'Bearer YOUR_PINTEREST_TOKEN' // اختياري
        }
      }
    );

    const pins = response.data?.data || [];
    if (pins.length === 0) {
      return api.sendMessage(
        `⌬ ━━ HINA MEDIA ━━ ⌬\n\n❌ لا توجد نتائج للبحث: "${search}"`,
        threadID,
        messageID
      );
    }

    // حفظ الصور في مجلد cache
    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // جلب 5 صور أولى
    const imageUrls = pins.slice(0, 5).map(pin => pin.image?.original?.url || pin.image?.large?.url);
    const validImages = imageUrls.filter(url => url);

    if (validImages.length === 0) {
      return api.sendMessage(
        `⌬ ━━ HINA MEDIA ━━ ⌬\n\n❌ لا توجد صور متاحة للتحميل.`,
        threadID,
        messageID
      );
    }

    // تحميل الصور
    const attachments = [];
    for (let i = 0; i < validImages.length; i++) {
      try {
        const imgPath = path.join(cacheDir, `pinterest_${Date.now()}_${i}.jpg`);
        const imgResponse = await axios({
          method: 'get',
          url: validImages[i],
          responseType: 'stream'
        });
        const writer = fs.createWriteStream(imgPath);
        imgResponse.data.pipe(writer);
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        attachments.push(fs.createReadStream(imgPath));
      } catch (e) {
        console.error(`❌ فشل تحميل الصورة ${i}:`, e);
      }
    }

    if (attachments.length === 0) {
      return api.sendMessage(
        `⌬ ━━ HINA MEDIA ━━ ⌬\n\n❌ فشل تحميل الصور. حاول مرة أخرى.`,
        threadID,
        messageID
      );
    }

    // إرسال الصور
    const msg = `⌬ ━━ HINA MEDIA ━━ ⌬\n\n📌 نتائج البحث: "${search}"\n📸 عدد الصور: ${attachments.length}\n\n💡 اكتب "المزيد" للحصول على صور إضافية`;

    // تخزين البيانات للرد
    global.client.handleReply.push({
      name: "بنترست",
      messageID: messageID,
      threadID: threadID,
      search: search,
      page: 1,
      pins: pins,
      validImages: validImages
    });

    return api.sendMessage({
      body: msg,
      attachment: attachments
    }, threadID, messageID);

  } catch (error) {
    console.error("❌ خطأ في بنترست:", error);
    return api.sendMessage(
      `⌬ ━━ HINA MEDIA ━━ ⌬\n\n❌ حدث خطأ أثناء البحث:\n${error.message}`,
      threadID,
      messageID
    );
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// معالج الردود (لجلب المزيد من الصور)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  const fs = require("fs-extra");
  const path = require("path");
  const axios = require("axios");

  // التحقق من أن الرد هو "المزيد" أو "more"
  if (body.toLowerCase() !== "المزيد" && body.toLowerCase() !== "more") return;

  const { search, page, pins, validImages } = handleReply;
  const cacheDir = path.join(__dirname, 'cache');

  // حساب الصفحة التالية
  const nextPage = page + 1;
  const startIndex = nextPage * 5;
  const endIndex = startIndex + 5;

  // جلب الصور التالية
  const nextImages = validImages.slice(startIndex, endIndex);

  if (nextImages.length === 0) {
    return api.sendMessage(
      `⌬ ━━ HINA MEDIA ━━ ⌬\n\n❌ لا توجد صور إضافية للبحث: "${search}"`,
      threadID,
      messageID
    );
  }

  // تحميل الصور
  const attachments = [];
  for (let i = 0; i < nextImages.length; i++) {
    try {
      const imgPath = path.join(cacheDir, `pinterest_${Date.now()}_${i}.jpg`);
      const imgResponse = await axios({
        method: 'get',
        url: nextImages[i],
        responseType: 'stream'
      });
      const writer = fs.createWriteStream(imgPath);
      imgResponse.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      attachments.push(fs.createReadStream(imgPath));
    } catch (e) {
      console.error(`❌ فشل تحميل الصورة ${i}:`, e);
    }
  }

  if (attachments.length === 0) {
    return api.sendMessage(
      `⌬ ━━ HINA MEDIA ━━ ⌬\n\n❌ فشل تحميل الصور الإضافية.`,
      threadID,
      messageID
    );
  }

  // تحديث البيانات
  global.client.handleReply.push({
    name: "بنترست",
    messageID: messageID,
    threadID: threadID,
    search: search,
    page: nextPage,
    pins: pins,
    validImages: validImages
  });

  const msg = `⌬ ━━ HINA MEDIA ━━ ⌬\n\n📌 المزيد من نتائج: "${search}"\n📸 عدد الصور: ${attachments.length}\n\n💡 اكتب "المزيد" للحصول على صور إضافية`;

  return api.sendMessage({
    body: msg,
    attachment: attachments
  }, threadID, messageID);
};