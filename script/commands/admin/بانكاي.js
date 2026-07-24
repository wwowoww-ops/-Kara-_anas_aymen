const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "بانكاي",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "طرد عضو مع صورة بانكاي",
  commandCategory: "admin",
  usages: "بانكاي [@منشن] أو رد على رسالة",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, mentions, messageReply } = event;

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());

    if (!isAdmin) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n⛔ هذا الأمر للأدمن فقط!`,
        threadID,
        messageID
      );
    }

    if (!isBotAdmin) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n⚠️ يجب أن أكون أدمن في المجموعة لاستخدام هذا الأمر`,
        threadID,
        messageID
      );
    }

    let targetID;

    if (messageReply) {
      targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
    } else {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n📝 الاستخدام:\n• بانكاي @منشن\n• أو قم بالرد على رسالة العضو`,
        threadID,
        messageID
      );
    }

    // ═══════════════════════════════════════════════
    // 🛡️ حماية المطور (لا يمكن طرد المطور)
    // ═══════════════════════════════════════════════
    
    // قراءة config.json للحصول على قائمة المطورين
    let config;
    try {
      config = JSON.parse(fs.readFileSync("./config.json"));
    } catch (e) {
      try {
        config = JSON.parse(fs.readFileSync(process.cwd() + "/config.json"));
      } catch (e2) {
        try {
          config = JSON.parse(fs.readFileSync(__dirname + "/../../../config.json"));
        } catch (e3) {
          return api.sendMessage(
            `⌬ ━━ HINA ━━ ⌬\n\n❌ لم يتم العثور على ملف config.json`,
            threadID,
            messageID
          );
        }
      }
    }

    // جمع كل المطورين من config.json
    const devIDs = config.ADMINBOT || [];
    if (config.KIRA_CONF?.dev) {
      devIDs.push(config.KIRA_CONF.dev);
    }
    const uniqueDevIDs = [...new Set(devIDs)];

    // ✅ التحقق: هل المستهدف مطور؟
    if (uniqueDevIDs.includes(targetID)) {
      // جلب اسم المطور
      let devName = "المطور";
      try {
        const userInfo = await api.getUserInfo(targetID);
        devName = userInfo[targetID]?.name || "المطور";
      } catch (e) {}
      
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n🛡️ لا يمكن طرد المطور!\n\n👤 ${devName}\n🆔 ${targetID}\n\nهذا العضو محمي بواسطة نظام حماية المطورين.`,
        threadID,
        messageID
      );
    }

    // ✅ حماية البوت نفسه
    if (targetID === api.getCurrentUserID()) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n😅 لا يمكنني طرد نفسي!`,
        threadID,
        messageID
      );
    }

    // جلب اسم العضو
    let userName = "العضو";
    try {
      const userInfo = await api.getUserInfo(targetID);
      userName = userInfo[targetID]?.name || "العضو";
    } catch (e) {}

    // تحميل صورة بانكاي
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);
    const pathImg = path.join(cacheDir, "bankai.jpg");

    try {
      const response = await axios.get(
        "https://www.image2url.com/r2/default/gifs/1784918159700-c4c984fc-ae25-4b9e-9e95-c4339273808f.gif",
        { responseType: "arraybuffer", timeout: 15000 }
      );
      fs.writeFileSync(pathImg, Buffer.from(response.data));
    } catch (e) {
      console.log("❌ فشل تحميل الصورة:", e);
    }

    let imageAttachment = null;
    if (fs.existsSync(pathImg)) {
      imageAttachment = fs.createReadStream(pathImg);
    }

    // إرسال رسالة الطرد مع الصورة
    await api.sendMessage(
      {
        body: `⌬ ━━ HINA ━━ ⌬\n\n🔥 BANKAI! ZANKA NO TACHI 🔥\n\n(BLADE OF EMBER)\n\n✅ تم طرد العضو:\n📌 ${userName}\n🆔 ${targetID}`,
        attachment: imageAttachment
      },
      threadID
    );

    // طرد العضو
    await api.removeUserFromGroup(targetID, threadID);

    // حذف الصورة المؤقتة
    try {
      if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
    } catch (_) {}

  } catch (error) {
    console.error("بانكاي - خطأ:", error);
    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n❌ حدث خطأ: ${error.message}`,
      threadID,
      messageID
    );
  }
};