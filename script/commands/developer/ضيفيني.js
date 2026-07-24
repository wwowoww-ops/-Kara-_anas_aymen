module.exports.config = {
  name: "ضيفني",
  version: "2.0.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "يعرض قائمة المجموعات التي لست فيها ويضيفك عند الاختيار",
  commandCategory: "developer",
  usages: "ضيفني [رقم]",
  cooldowns: 10
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const fs = require("fs");
  const path = "./config.json";

  const config = JSON.parse(fs.readFileSync(path));
  const devID = config.KIRA_CONF?.dev || config.ADMINBOT?.[0];

  if (senderID !== devID) {
    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n⛔ هذا الأمر للمطور الأساسي فقط!`,
      threadID,
      messageID
    );
  }

  try {
    const threadList = await api.getThreadList(500, null, ["INBOX"]);
    const groups = threadList.filter(t => t.isGroup === true);
    
    if (groups.length === 0) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n❌ لا توجد مجموعات متاحة.`,
        threadID,
        messageID
      );
    }

    const botID = api.getCurrentUserID();
    const groupsWithoutBot = [];
    let processed = 0;

    for (const group of groups) {
      try {
        const info = await api.getThreadInfo(group.threadID);
        if (!info.participantIDs.includes(botID)) {
          groupsWithoutBot.push({
            id: group.threadID,
            name: group.name || "بدون اسم",
            members: info.participantIDs.length || 0
          });
        }
        processed++;
      } catch (e) {
        console.log(`❌ لا يمكن الوصول للمجموعة: ${group.threadID}`);
      }
    }

    console.log(`✅ تم فحص ${processed} مجموعة، البوت في ${processed - groupsWithoutBot.length} مجموعة`);

    if (groupsWithoutBot.length === 0) {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n✅ البوت موجود في جميع المجموعات!\n📊 تم فحص ${processed} مجموعة.`,
        threadID,
        messageID
      );
    }

    let msg = `⌬ ━━ HINA ━━ ⌬\n\n📋 قائمة المجموعات التي لست فيها:\n`;
    msg += `📊 تم فحص ${processed} مجموعة\n\n`;
    
    groupsWithoutBot.forEach((g, index) => {
      msg += `${index + 1}. ${g.name}\n`;
      msg += `   🆔 ${g.id}\n`;
      msg += `   👥 ${g.members} عضو\n\n`;
    });
    msg += `📝 أرسل: ضيفني [رقم] لإضافتك إلى المجموعة\n`;
    msg += `مثال: ضيفني 1`;

    global.tempGroupList = groupsWithoutBot;

    return api.sendMessage(msg, threadID, messageID);

  } catch (error) {
    console.error("ضيفني - خطأ:", error);
    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n❌ حدث خطأ أثناء جلب القائمة:\n${error.message}`,
      threadID,
      messageID
    );
  }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  const fs = require("fs");
  const path = "./config.json";

  const config = JSON.parse(fs.readFileSync(path));
  const devID = config.KIRA_CONF?.dev || config.ADMINBOT?.[0];

  if (senderID !== devID) {
    return api.sendMessage("⛔ هذا الأمر للمطور فقط!", threadID, messageID);
  }

  if (!global.tempGroupList || global.tempGroupList.length === 0) {
    return api.sendMessage("⚠️ القائمة فارغة. استخدم الأمر مرة أخرى.", threadID, messageID);
  }

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
    // ✅ هذا الكود يضيفك أنت فقط (المطور)
    await api.addUserToGroup(senderID, groupID);
    
    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n✅ تم إضافتك إلى المجموعة:\n📌 ${selectedGroup.name}\n🆔 ${groupID}`,
      threadID,
      messageID
    );
  } catch (error) {
    console.error("ضيفني - خطأ إضافة:", error);
    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n❌ فشل إضافتك إلى المجموعة:\n📌 ${selectedGroup.name}\n❌ ${error.message}`,
      threadID,
      messageID
    );
  }
};
