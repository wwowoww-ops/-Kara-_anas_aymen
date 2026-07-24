module.exports.config = {
  name: "طرد",
  version: "1.2.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "طرد عضو مع حماية المطورين",
  commandCategory: "admin",
  usages: "[@منشن] أو رد على رسالة",
  cooldowns: 5
};

module.exports.run = async function({ api, event, Threads }) {
  const { threadID, messageID, mentions, messageReply, senderID } = event;

  const config = global.config.ADMINBOT || [];

  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    const isAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);

    if (!isAdmin) {
      return api.sendMessage(
        "⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n⚠️ يجب أن أكون مشرفاً في المجموعة لاستخدام هذا الأمر",
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
        "⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n📝 الاستخدام:\n• طرد @منشن\n• أو قم بالرد على رسالة العضو المراد طرده",
        threadID,
        messageID
      );
    }

    if (config.includes(targetID)) {
      return api.sendMessage(
        "⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n🚫 حماية المطور مفعلة! لا يمكنني طرد أحد مطوري البوت.",
        threadID,
        messageID
      );
    }

    if (targetID === botID) {
      return api.sendMessage(
        "⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n😅 لا يمكنني طرد نفسي!",
        threadID,
        messageID
      );
    }

    await api.removeUserFromGroup(targetID, threadID);

    return api.sendMessage(
      `⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n✅ تم طرد العضو بنجاح من المجموعة`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("طرد - خطأ:", error);
    return api.sendMessage(
      `⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n❌ حدث خطأ أثناء طرد العضو\n📝 ${error.message}`,
      threadID,
      messageID
    );
  }
};