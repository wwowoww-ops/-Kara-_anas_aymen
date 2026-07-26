const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "بانكاي",
  version: "2.3.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "طرد عضو مع صورة بانكاي وصوت (بالرد فقط)",
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
    const pathImg = path.join(cacheDir, `bankai_img_${Date.now()}.gif`);
    const pathAudio = path.join(cacheDir, `bankai_audio_${Date.now()}.mp3`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🖼️ تحميل الصورة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    try {
      const response = await axios.get(
        "https://www.image2url.com/r2/default/gifs/1784918159700-c4c984fc-ae25-4b9e-9e95-c4339273808f.gif",
        { responseType: "arraybuffer", timeout: 15000 }
      );
      fs.writeFileSync(pathImg, Buffer.from(response.data));
    } catch (e) {
      console.log("❌ فشل تحميل الصورة:", e.message);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔊 تحميل الصوت
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    try {
      const audioResponse = await axios.get(
        "https://files.catbox.moe/eq9fbl.mp3",
        { responseType: "arraybuffer", timeout: 15000 }
      );
      fs.writeFileSync(pathAudio, Buffer.from(audioResponse.data));
    } catch (e) {
      console.log("❌ فشل تحميل الصوت:", e.message);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 إعداد المرفقات
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const attachments = [];
    
    // ✅ التحقق من وجود الملفات قبل إضافتها
    if (fs.existsSync(pathImg)) {
      attachments.push(fs.createReadStream(pathImg));
    }
    if (fs.existsSync(pathAudio)) {
      attachments.push(fs.createReadStream(pathAudio));
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📨 إرسال الرسالة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    await api.sendMessage(
      {
        body: `⌬ ━━ HINA ━━ ⌬\n\n🔥 BANKAI! ZANKA NO TACHI 🔥\n\n(BLADE OF EMBER)\n\n✅ تم طرد العضو:\n📌 ${userName}\n🆔 ${targetID}`,
        attachment: attachments
      },
      threadID
    );

    // طرد العضو
    await api.removeUserFromGroup(targetID, threadID);

    // حذف الملفات المؤقتة
    try {
      if (fs.existsSync(pathImg)) fs.unlinkSync(pathImg);
      if (fs.existsSync(pathAudio)) fs.unlinkSync(pathAudio);
    } catch (_) {}

  } catch (error) {
    console.error("❌ خطأ في بانكاي:", error);
    
    // ✅ رسالة خطأ واضحة
    let errorMsg = error.message || "خطأ غير معروف";
    if (errorMsg.includes("Cannot convert undefined or null to object")) {
      errorMsg = "حدث خطأ في تحميل الملفات المؤقتة. حاول مرة أخرى.";
    }
    
    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n❌ حدث خطأ: ${errorMsg}`,
      threadID,
      messageID
    );
  }
};