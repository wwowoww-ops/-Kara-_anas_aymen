const axios = require('axios');
const FormData = require('form-data');
const fs = require("fs");

module.exports.config = {
  name: "ارفع",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "رفع الصور والفيديوهات على Catbox",
  commandCategory: "utility",
  usages: "رد على ملف بـ .ارفع",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, type, messageReply } = event;

  if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments.length === 0) {
    return api.sendMessage(
      `⌬ ━━ HINA UTILITY ━━ ⌬\n\n⚠️ رد على (صورة أو فيديو) لرفعها.`,
      threadID,
      messageID
    );
  }

  try {
    const waitingMsg = await api.sendMessage(
      `⌬ ━━ HINA UTILITY ━━ ⌬\n\n⏳ جاري الرفع... قد يستغرق الأمر ثوانٍ حسب حجم الملف.`,
      threadID
    );

    const attachment = messageReply.attachments[0];
    const fileUrl = attachment.url;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📥 جلب الملف كـ Buffer
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const res = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(res.data);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📝 تحديد اسم الملف مع امتداده الصحيح
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const ext = attachment.type === "photo" ? "jpg" : 
                attachment.type === "video" ? "mp4" : 
                attachment.type === "audio" ? "mp3" : "bin";
    const filename = `file.${ext}`;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📤 إعداد فورم البيانات
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', buffer, { filename });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📨 إرسال الطلب
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const uploadRes = await axios.post('https://catbox.moe/user/api.php', formData, {
      headers: formData.getHeaders()
    });

    api.unsendMessage(waitingMsg.messageID);

    return api.sendMessage(
      `⌬ ━━ HINA UTILITY ━━ ⌬\n\n✅ تم الرفع بنجاح!\n\n🔗 الرابط المباشر:\n${uploadRes.data}`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("❌ خطأ في ارفع:", error);
    return api.sendMessage(
      `⌬ ━━ HINA UTILITY ━━ ⌬\n\n❌ فشل الرفع.\n📝 السبب: ${error.message}\n💡 حاول مرة أخرى مع ملف أصغر.`,
      threadID,
      messageID
    );
  }
};