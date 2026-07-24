module.exports.config = {
  name: "تتبع",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "تفعيل أو إيقاف تتبع الأعضاء وإعادتهم عند الخروج",
  commandCategory: "admin",
  usages: "تتبع [تشغيل/إيقاف]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const fs = require("fs");
  const path = "./data/tracking.json";

  // التأكد من وجود ملف التتبع
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({}));
  }

  let data = JSON.parse(fs.readFileSync(path));

  // التأكد من وجود المجموعة في الملف
  if (!data[threadID]) {
    data[threadID] = {
      active: false,
      members: []
    };
  }

  // تشغيل أو إيقاف التتبع
  if (args[0] === "تشغيل" || args[0] === "on") {
    data[threadID].active = true;
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n✅ تم تفعيل تتبع الأعضاء!\n\nسيتم إعادة أي عضو يخرج من المجموعة تلقائياً.`,
      threadID,
      messageID
    );
  } 
  else if (args[0] === "إيقاف" || args[0] === "off") {
    data[threadID].active = false;
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n❌ تم إيقاف تتبع الأعضاء.\n\nلن يتم إعادة الأعضاء الذين يخرجون.`,
      threadID,
      messageID
    );
  } 
  else {
    const status = data[threadID].active ? "مفعل ✅" : "معطل ❌";
    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n📊 حالة التتبع: ${status}\n\n📝 الاستخدام:\n• تتبع تشغيل (لتفعيل)\n• تتبع إيقاف (لإلغاء)`,
      threadID,
      messageID
    );
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 معالج الخروج (حدث log:unsubscribe)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, logMessageData, logMessageType } = event;
  const fs = require("fs");
  const path = "./data/tracking.json";

  // التأكد من أن الحدث هو خروج عضو
  if (logMessageType !== "log:unsubscribe") return;

  const userID = logMessageData.leftParticipantFbId;
  if (!userID) return;

  // قراءة ملف التتبع
  if (!fs.existsSync(path)) return;
  let data = JSON.parse(fs.readFileSync(path));

  // التأكد من تفعيل التتبع في هذه المجموعة
  if (!data[threadID] || !data[threadID].active) return;

  // التأكد من أن البوت أدمن
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());
    
    if (!isBotAdmin) {
      console.log(`❌ البوت ليس أدمن في ${threadID}، لا يمكن إعادة الأعضاء.`);
      return;
    }

    // إعادة العضو إلى المجموعة
    await api.addUserToGroup(userID, threadID);
    console.log(`✅ تم إعادة العضو ${userID} إلى المجموعة ${threadID}`);

    // جلب اسم العضو
    try {
      const userInfo = await api.getUserInfo(userID);
      const userName = userInfo[userID]?.name || "حبيبي/حبيبتي";
      
      // ✅ رسالة مخصصة كيوت
      await api.sendMessage(
        `🥺 تعال يا ${userName} 💕\n\n` +
        `مامي قالت مين عطاك إذن تخرج؟! 😤💢\n` +
        `ما تطلعش غير بإذن مامي تاني مرة 🌸✨\n\n` +
        `🔄 تم إعادتك يا قمر 🌙💖`,
        threadID
      );
    } catch (e) {}

  } catch (error) {
    console.error(`❌ فشل إعادة العضو ${userID}:`, error);
  }
};