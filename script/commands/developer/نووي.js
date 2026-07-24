const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "نووي",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "طرد جميع أعضاء المجموعة (قنبلة نووية)",
  commandCategory: "developer",
  usages: "نووي",
  cooldowns: 30
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;
  
  try {
    // التحقق من أن البوت أدمن
    const threadInfo = await api.getThreadInfo(threadID);
    const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());
    
    if (!isBotAdmin) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n⚠️ يجب أن أكون أدمن في المجموعة لاستخدام هذا الأمر.`,
        threadID,
        messageID
      );
    }

    // جلب قائمة الأعضاء
    const members = threadInfo.participantIDs;
    const botID = api.getCurrentUserID();

    // استبعاد البوت نفسه
    const membersToKick = members.filter(id => id !== botID);

    if (membersToKick.length === 0) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n❌ لا يوجد أعضاء لطردهم.`,
        threadID,
        messageID
      );
    }

    // تأكيد الطرد
    const confirmMsg = await api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n☢️ تحذير: قنبلة نووية!\n\n` +
      `سيتم طرد ${membersToKick.length} عضو من المجموعة.\n` +
      `هل أنت متأكد؟\n\n` +
      `رد بـ "تأكيد" خلال 30 ثانية.`,
      threadID
    );

    // انتظار رد المستخدم
    const reply = await new Promise((resolve) => {
      const listener = (event) => {
        if (event.senderID === senderID && event.body === "تأكيد") {
          resolve(true);
        }
      };
      api.listenMqtt((err, event) => {
        if (event.body === "تأكيد" && event.senderID === senderID) {
          resolve(true);
        }
      });
      // مهلة 30 ثانية
      setTimeout(() => resolve(false), 30000);
    });

    if (!reply) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n✅ تم إلغاء القنبلة.`,
        threadID,
        messageID
      );
    }

    // إرسال رسالة البدء
    api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n☢️ بدء القنبلة النووية!\nجاري طرد ${membersToKick.length} عضو...`,
      threadID
    );

    let kicked = 0;
    let failed = 0;

    // طرد كل عضو (مع تأخير لتجنب الحظر)
    for (const id of membersToKick) {
      try {
        // حماية المطورين (لا يطردهم)
        const config = JSON.parse(fs.readFileSync("./config.json"));
        const devIDs = config.ADMINBOT || [];
        if (config.KIRA_CONF?.dev) devIDs.push(config.KIRA_CONF.dev);
        
        if (!devIDs.includes(id)) {
          await api.removeUserFromGroup(id, threadID);
          kicked++;
        } else {
          failed++;
        }
        // تأخير 500ms بين كل طرد
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        failed++;
      }
    }

    // التقرير النهائي
    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n☢️ انتهت القنبلة النووية!\n\n📊 التقرير:\n✅ تم طرد: ${kicked} عضو\n❌ فشل: ${failed} عضو\n🛡️ المطورون محميون.`,
      threadID
    );

  } catch (error) {
    console.error("نووي - خطأ:", error);
    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n❌ حدث خطأ: ${error.message}`,
      threadID,
      messageID
    );
  }
};