const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "صور",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "البحث عن صور من Unsplash",
  commandCategory: "media",
  usages: "صور [كلمة البحث]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID } = event;
  const search = args.join(" ");

  if (!search) {
    return api.sendMessage(
      `⌬ ━━ HINA MEDIA ━━ ⌬\n\n📝 استخدم: صور [كلمة البحث]\nمثال: صور غروب شمس`,
      threadID,
      messageID
    );
  }

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔍 استخدام Unsplash API مع المفتاح الخاص بك
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const UNSPLASH_KEY = "BmiP3mpC4AMj8PhAD6LKrMx58IHSnQUpuKfqleiRucU";
    
    const response = await axios.get(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(search)}&per_page=10&client_id=${UNSPLASH_KEY}`,
      { timeout: 15000 }
    );

    const photos = response.data?.results || [];

    if (photos.length === 0) {
      return api.sendMessage(
        `⌬ ━━ HINA MEDIA ━━ ⌬\n\n❌ لا توجد نتائج للبحث: "${search}"`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💾 حفظ الصور
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const attachments = [];
    const maxImages = Math.min(photos.length, 5);

    for (let i = 0; i < maxImages; i++) {
      try {
        const imgUrl = photos[i].urls?.regular || photos[i].urls?.small;
        if (!imgUrl) continue;

        const imgPath = path.join(cacheDir, `image_${Date.now()}_${i}.jpg`);
        const imgResponse = await axios({
          method: 'get',
          url: imgUrl,
          responseType: 'stream',
          headers: {
            'User-Agent': 'Mozilla/5.0'
          }
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

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💬 إرسال الصور
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const msg = `⌬ ━━ HINA MEDIA ━━ ⌬\n\n📌 نتائج البحث: "${search}"\n📸 عدد الصور: ${attachments.length}\n\n💡 اكتب "المزيد" للحصول على صور إضافية`;

    global.client.handleReply.push({
      name: "صور",
      messageID: messageID,
      threadID: threadID,
      search: search,
      page: 1,
      photos: photos
    });

    return api.sendMessage({
      body: msg,
      attachment: attachments
    }, threadID, messageID);

  } catch (error) {
    console.error("❌ خطأ في صور:", error);
    return api.sendMessage(
      `⌬ ━━ HINA MEDIA ━━ ⌬\n\n❌ حدث خطأ أثناء البحث:\n${error.message}`,
      threadID,
      messageID
    );
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📥 معالج الردود (لجلب المزيد من الصور)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  const fs = require("fs-extra");
  const path = require("path");
  const axios = require("axios");

  if (body.toLowerCase() !== "المزيد" && body.toLowerCase() !== "more") return;

  const { search, page, photos } = handleReply;
  const cacheDir = path.join(__dirname, 'cache');

  const nextPage = page + 1;
  const startIndex = nextPage * 5;
  const endIndex = startIndex + 5;
  const nextPhotos = photos.slice(startIndex, endIndex);

  if (nextPhotos.length === 0) {
    return api.sendMessage(
      `⌬ ━━ HINA MEDIA ━━ ⌬\n\n❌ لا توجد صور إضافية للبحث: "${search}"`,
      threadID,
      messageID
    );
  }

  const attachments = [];
  for (let i = 0; i < nextPhotos.length; i++) {
    try {
      const imgUrl = nextPhotos[i].urls?.regular || nextPhotos[i].urls?.small;
      if (!imgUrl) continue;

      const imgPath = path.join(cacheDir, `image_${Date.now()}_${i}.jpg`);
      const imgResponse = await axios({
        method: 'get',
        url: imgUrl,
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

  global.client.handleReply.push({
    name: "صور",
    messageID: messageID,
    threadID: threadID,
    search: search,
    page: nextPage,
    photos: photos
  });

  return api.sendMessage({
    body: `⌬ ━━ HINA MEDIA ━━ ⌬\n\n📌 المزيد من نتائج: "${search}"\n📸 عدد الصور: ${attachments.length}\n\n💡 اكتب "المزيد" للحصول على صور إضافية`,
    attachment: attachments
  }, threadID, messageID);
};
