module.exports.config = {
  name: "ضيفني",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "يعرض قائمة المجموعات التي لست فيها ويضيفك عند الاختيار",
  commandCategory: "admin",
  usages: "ضيفني [رقم]",
  cooldowns: 10
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const fs = require("fs");
  const path = "./config.json";

  // التحقق من أن المستخدم هو المطور الأساسي
  const config = JSON.parse(fs.readFileSync(path));
  const devID = config.KIRA_CONF?.dev || config.ADMINBOT?.[0];

  if (senderID !== devID) {
    return api.sendMessage(
      `⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n⛔ هذا الأمر للمطور الأساسي فقط!\nأنت لست مخولاً لاستخدامه.`,
      threadID,
      messageID
    );
  }

  // جلب قائمة المجموعات التي فيها البوت
  try {
    const threadList = await api.getThreadList(100, null, ["INBOX"]);
    
    // تصفية المجموعات (ليست محادثة فردية)
    const groups = threadList.filter(t => t.isGroup === true);
    
    // جلب معلومات المجموعات التي فيها البوت
    const botID = api.getCurrentUserID();
    const groupsWithBot = [];
    
    for (const group of groups) {
      try {
        const info = await api.getThreadInfo(group.threadID);
        const isBotInGroup = info.participantIDs.includes(botID);
        if (!isBotInGroup) {
          groupsWithBot.push({
            id: group.threadID,
            name: group.name || "بدون اسم",
            members: info.participantIDs.length || 0
          });
        }
      } catch (e) {
        // تجاهل المجموعات التي لا يمكن الوصول لها
      }
    }

    if (groupsWithBot.length === 0) {
      return api.sendMessage(
        `⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n✅ البوت موجود في جميع المجموعات!\nلا توجد مجموعات لست فيها.`,
        threadID,
        messageID
      );
    }

    // بناء الرسالة
    let msg = `⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n📋 قائمة المجموعات التي لست فيها:\n\n`;
    groupsWithBot.forEach((g, index) => {
      msg += `${index + 1}. ${g.name}\n`;
      msg += `   🆔 ${g.id}\n`;
      msg += `   👥 ${g.members} عضو\n\n`;
    });
    msg += `📝 أرسل: ضيفني [رقم] لإضافتك إلى المجموعة\n`;
    msg += `مثال: ضيفني 1`;

    // تخزين القائمة مؤقتاً للاستخدام لاحقاً
    global.tempGroupList = groupsWithBot;

    return api.sendMessage(msg, threadID, messageID);

  } catch (error) {
    console.error("ضيفني - خطأ:", error);
    return api.sendMessage(
      `⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n❌ حدث خطأ أثناء جلب القائمة:\n${error.message}`,
      threadID,
      messageID
    );
  }
};

// معالج الردود (عند اختيار رقم)
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  const fs = require("fs");
  const path = "./config.json";

  // التحقق من المطور
  const config = JSON.parse(fs.readFileSync(path));
  const devID = config.KIRA_CONF?.dev || config.ADMINBOT?.[0];

  if (senderID !== devID) {
    return api.sendMessage("⛔ هذا الأمر للمطور فقط!", threadID, messageID);
  }

  // التحقق من وجود القائمة
  if (!global.tempGroupList || global.tempGroupList.length === 0) {
    return api.sendMessage("⚠️ القائمة فارغة. استخدم الأمر مرة أخرى.", threadID, messageID);
  }

  // استخراج الرقم
  const choice = parseInt(body);
  if (isNaN(choice) || choice < 1 || choice > global.tempGroupList.length) {
    return api.sendMessage(
      `⚠️ رقم غير صحيح! اختر رقم من 1 إلى ${global.tempGroupList.length}`,
      threadID,
      messageID
    );
  }

  const selectedGroup = global.tempGroupList[choice - 1];
  const groupID = selectedGroup.id;

  try {
    // محاولة إضافة المستخدم إلى المجموعة
    await api.addUserToGroup(senderID, groupID);
    
    return api.sendMessage(
      `⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n✅ تم إضافتك إلى المجموعة:\n📌 ${selectedGroup.name}\n🆔 ${groupID}`,
      threadID,
      messageID
    );
  } catch (error) {
    console.error("ضيفني - خطأ إضافة:", error);
    return api.sendMessage(
      `⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n❌ فشل إضافتك إلى المجموعة:\n📌 ${selectedGroup.name}\n❌ ${error.message}`,
      threadID,
      messageID
    );
  }
};