const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "بانكاي",
  version: "2.5.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "طرد عضو مع صورة بانكاي (بدون صوت)",
  commandCategory: "admin",
  usages: "بانكاي (رد على رسالة العضو)",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, messageReply } = event;

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
    } else {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n📝 الاستخدام:\n• قم بالرد على رسالة العضو ثم اكتب .بانكاي`,
        threadID,
        messageID
      );
    }

    if (!targetID) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n❌ لم يتم تحديد العضو المستهدف.`,
        threadID,
        messageID
      );
    }

    // ═══════════════════════════════════════════════
    // 🛡️ حماية المطور
    // ═══════════════════════════════════════════════
    const DEV_ID = "61578581225040";
    
    if (targetID === DEV_ID) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n🛡️ لا يمكن طرد المطور!`,
        threadID,
        messageID
      );
    }

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

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📁 مجلد الكاش
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);
    const pathImg = path.join(cacheDir, `bankai_${Date.now()}.gif`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🖼️ تحميل الصورة (GIF)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let imageAttachment = null;
    
    try {
      const imageUrl = "https://www.image2url.com/r2/default/gifs/1784918159700-c4c984fc-ae25-4b9e-9e95-c4339273808f.gif";
      
      const response = await axios.get(imageUrl, { 
        responseType: "arraybuffer", 
        timeout: 10000 
      });
      fs.writeFileSync(pathImg, Buffer.from(response.data));
      
      if (fs.existsSync(pathImg)) {
        imageAttachment = fs.createReadStream(pathImg);
        console.log("✅ تم تحميل الصورة بنجاح");
      }
    } catch (e) {
      console.log("❌ فشل تحميل الصورة:", e.message);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📨 إرسال الرسالة مع الصورة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const messageBody = `⌬ ━━ HINA ━━ ⌬\n\n🔥 BANKAI! ZANKA NO TACHI 🔥\n\n(BLADE OF EMBER)\n\n✅ تم طرد العضو:\n📌 ${userName}\n🆔 ${targetID}`;

    if (imageAttachment) {
      await api.sendMessage(
        {
          body: messageBody,
          attachment: imageAttachment
        },
        threadID
      );
    } else {
      // إذا فشل تحميل الصورة، أرسل النص فقط
      await api.sendMessage(messageBody, threadID);
    }

    // طرد العضو
    await api.removeUserFromGroup(targetID, threadID);

    // حذف الملفات المؤقتة
    try {
      if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
    } catch (_) {}

  } catch (error) {
    console.error("❌ خطأ في بانكاي:", error);
    
    // رسالة احتياطية
    try {
      await api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n✅ تم طرد العضو بنجاح!`,
        threadID,
        messageID
      );
    } catch (e) {
      console.error("❌ فشل حتى في الرسالة النصية:", e);
    }
  }
};