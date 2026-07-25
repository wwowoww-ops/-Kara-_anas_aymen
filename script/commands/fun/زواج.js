const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports.config = {
  name: "زواج",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "زواج بمنشن، أيدي، أو رد (مع حفظ دائم وتاريخ)",
  commandCategory: "fun",
  usages: "زواج [@منشن/ID/رد]",
  cooldowns: 5,
  dependencies: {
    "axios": "",
    "fs-extra": "",
    "path": "",
    "jimp": ""
  }
};

module.exports.handleEvent = async function({ api, event }) {
  const { messageID, reaction, messageReply } = event;
  if (reaction === "👍" && messageReply?.senderID === api.getCurrentUserID()) {
    return api.unsendMessage(messageReply.messageID);
  }
};

async function circle(image) {
  const img = await jimp.read(image);
  img.circle();
  return await img.getBufferAsync("image/png");
}

module.exports.run = async function({ api, event, args, Users, Threads, Currencies, models }) {
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;
  const cacheDir = path.join(__dirname, "cache", "canvas");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📁 ملف حفظ الزيجات
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const marriagePath = "./data/marriages.json";
  if (!fs.existsSync(marriagePath)) {
    fs.writeFileSync(marriagePath, JSON.stringify({}));
  }
  let marriages = JSON.parse(fs.readFileSync(marriagePath));

  let targetID;
  let targetName = "شخص";

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // تحديد المستهدف
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
    targetName = mentions[targetID].replace("@", "");
  } else if (messageReply) {
    targetID = messageReply.senderID;
    try {
      const userInfo = await api.getUserInfo(targetID);
      targetName = userInfo[targetID]?.name || "الشخص";
    } catch (e) {}
  } else if (args[0] && !isNaN(args[0])) {
    targetID = args[0];
    try {
      const userInfo = await api.getUserInfo(targetID);
      targetName = userInfo[targetID]?.name || "الشخص";
    } catch (e) {}
  }

  if (!targetID) {
    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n📝 الاستخدام:\n• زواج @منشن\n• رد على رسالة العضو ثم زواج\n• زواج [معرف العضو]`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // منع الزواج من البوت أو المطور
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (targetID === api.getCurrentUserID()) {
    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n😅 لا يمكن الزواج مني! أنا هنا لمساعدتك فقط.`,
      threadID,
      messageID
    );
  }

  const config = JSON.parse(fs.readFileSync("./config.json"));
  const devID = config.KIRA_CONF?.dev || config.ADMINBOT?.[0];
  if (targetID === devID) {
    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n🛡️ لا يمكن الزواج من المطور!`,
      threadID,
      messageID
    );
  }

  if (targetID === senderID) {
    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n😅 لا يمكن الزواج من نفسك!`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔍 التحقق من الزواج السابق
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (!marriages[threadID]) {
    marriages[threadID] = [];
  }

  // التحقق إذا كان أحد الطرفين متزوجاً بالفعل
  const existingMarriage = marriages[threadID].find(
    m => m.user1 === senderID || m.user2 === senderID || m.user1 === targetID || m.user2 === targetID
  );

  if (existingMarriage) {
    // جلب اسم الشريك الآخر
    let partnerID = existingMarriage.user1 === senderID ? existingMarriage.user2 : existingMarriage.user1;
    if (partnerID === targetID) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n💕 أنتما متزوجان بالفعل! 💕\n📅 تاريخ الزواج: ${existingMarriage.date}`,
        threadID,
        messageID
      );
    }
    let partnerName = "شخص";
    try {
      const info = await api.getUserInfo(partnerID);
      partnerName = info[partnerID]?.name || "شخص";
    } catch (e) {}
    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n⛔ ${partnerName} متزوج بالفعل! لا يمكن الزواج منه/ها.`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💾 حفظ الزواج
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const marriageDate = new Date().toLocaleString("ar", {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  marriages[threadID].push({
    user1: senderID,
    user2: targetID,
    date: marriageDate,
    timestamp: Date.now()
  });

  fs.writeFileSync(marriagePath, JSON.stringify(marriages, null, 2));

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🖼️ إنشاء صورة الزواج
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const pathImg = path.join(cacheDir, `marry_${senderID}_${targetID}.png`);
  const avatarOnePath = path.join(cacheDir, `avt_${senderID}.png`);
  const avatarTwoPath = path.join(cacheDir, `avt_${targetID}.png`);
  const backgroundPath = path.join(cacheDir, "marry_bg.png");

  try {
    const senderName = await Users.getNameUser(senderID);

    if (!fs.existsSync(backgroundPath)) {
      const bgRes = await axios.get("https://i.ibb.co/9ZZCSzR/ba6abadae46b5bdaa29cf6a64d762874.jpg", { responseType: "arraybuffer" });
      fs.writeFileSync(backgroundPath, Buffer.from(bgRes.data, "utf-8"));
    }

    const getAvt = async (uid, savePath) => {
      const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const res = await axios.get(url, { responseType: "arraybuffer" });
      fs.writeFileSync(savePath, Buffer.from(res.data, "utf-8"));
      return savePath;
    };

    await Promise.all([getAvt(senderID, avatarOnePath), getAvt(targetID, avatarTwoPath)]);

    const baseImage = await jimp.read(backgroundPath);
    const circleOne = await jimp.read(await circle(avatarOnePath));
    const circleTwo = await jimp.read(await circle(avatarTwoPath));

    baseImage.composite(circleOne.resize(130, 130), 200, 70)
              .composite(circleTwo.resize(130, 130), 350, 150);

    const buffer = await baseImage.getBufferAsync("image/png");
    fs.writeFileSync(pathImg, buffer);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💬 رسالة الزواج
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const funnyReplies = [
      `💍 ألف مبروك الزواج لـ ${senderName} و ${targetName}! 🎉\n📅 تاريخ الزواج: ${marriageDate}`,
      `💕 تم الزواج! ${senderName} و ${targetName} أصبحا زوجين! 🥂\n📅 ${marriageDate}`,
      `🌸 مبارك للعروسين ${senderName} و ${targetName}! 💐\n📅 ${marriageDate}`,
      `💖 زواج سعيد لـ ${senderName} و ${targetName}! 🎊\n📅 ${marriageDate}`
    ];
    const randomReply = funnyReplies[Math.floor(Math.random() * funnyReplies.length)];

    return api.sendMessage({
      body: `⌬ ━━ HINA FUN ━━ ⌬\n\n${randomReply}`,
      attachment: fs.createReadStream(pathImg)
    }, threadID, () => {
      if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
      if (fs.existsSync(avatarOnePath)) fs.unlinkSync(avatarOnePath);
      if (fs.existsSync(avatarTwoPath)) fs.unlinkSync(avatarTwoPath);
    }, messageID);

  } catch (error) {
    console.error("❌ خطأ في زواج:", error);
    if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ حدث خطأ في إتمام مراسم الزواج!\n📝 ${error.message}`,
      threadID,
      messageID
    );
  }
};