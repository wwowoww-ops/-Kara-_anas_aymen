const fs = require("fs-extra");

module.exports.config = {
  name: "طلبات",
  version: "1.2.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "إدارة طلبات المجموعات (للمطور فقط)",
  commandCategory: "developer",
  usages: "طلبات",
  cooldowns: 5
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  
  // التحقق من المطور
  const config = JSON.parse(fs.readFileSync("./config.json"));
  const devID = config.KIRA_CONF?.dev || config.ADMINBOT?.[0];
  
  if (senderID != devID) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⛔ هذا الأمر للمطور الأساسي فقط!`,
      threadID,
      messageID
    );
  }

  const args = body.split(" ");
  const action = args[0].toLowerCase();
  const nums = args.slice(1).map(n => parseInt(n));

  if (!["قبول", "رفض", "اوافق", "ارفض"].includes(action) || nums.length === 0) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ استخدم: قبول [رقم] أو رفض [رقم]`,
      threadID,
      messageID
    );
  }

  let msg = `⌬ ━━ HINA ADMIN ━━ ⌬\n\n`;
  let accepted = 0;
  let rejected = 0;

  try {
    for (let num of nums) {
      let item = handleReply.listRequest[num - 1];
      if (!item) continue;

      if (action === "قبول" || action === "اوافق") {
        try {
          await api.sendMessage(
            `⌬ ━━ HINA ADMIN ━━ ⌬\n\n✅ تم قبول المجموعة بنجاح!\nشكراً لإضافتي.`,
            item.threadID
          );
          await api.removeUserFromGroup(api.getCurrentUserID(), item.threadID);
          msg += `✅ تم قبول: ${item.name}\n`;
          accepted++;
        } catch (e) {
          msg += `❌ فشل قبول: ${item.name}\n`;
        }
      } else {
        try {
          await api.deleteThread(item.threadID);
          msg += `❌ تم رفض: ${item.name}\n`;
          rejected++;
        } catch (e) {
          msg += `⚠️ فشل رفض: ${item.name}\n`;
        }
      }
    }

    try {
      await api.unsendMessage(handleReply.messageID);
    } catch (e) {}

    msg += `\n📊 التقرير:\n✅ مقبول: ${accepted}\n❌ مرفوض: ${rejected}`;
    return api.sendMessage(msg, threadID, messageID);

  } catch (error) {
    console.error("❌ خطأ في طلبات:", error);
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ حدث خطأ: ${error.message}`,
      threadID,
      messageID
    );
  }
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID, senderID } = event;

  // التحقق من المطور
  const config = JSON.parse(fs.readFileSync("./config.json"));
  const devID = config.KIRA_CONF?.dev || config.ADMINBOT?.[0];
  
  if (senderID != devID) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⛔ هذا الأمر للمطور الأساسي فقط!`,
      threadID,
      messageID
    );
  }

  try {
    // جلب طلبات المجموعات
    const spam = await api.getThreadList(50, null, ["OTHER"]) || [];
    const pending = await api.getThreadList(50, null, ["PENDING"]) || [];
    const all = [...spam, ...pending].filter(t => t.isGroup && t.isSubscribed);

    if (all.length === 0) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📭 لا توجد طلبات مجموعات حالياً.`,
        threadID,
        messageID
      );
    }

    let msg = `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📋 قائمة طلبات المجموعات (${all.length}):\n\n`;
    let listRequest = [];

    for (let i = 0; i < all.length; i++) {
      const t = all[i];
      msg += `${i + 1}. ${t.name || "مجموعة مجهولة"} (${t.participantIDs?.length || 0} عضو)\n`;
      listRequest.push({ 
        threadID: t.threadID, 
        name: t.name || "مجموعة مجهولة" 
      });
    }

    msg += `\n📝 رد بـ [قبول/رفض] + رقم المجموعة\nمثال: قبول 1 2 3`;

    return api.sendMessage(msg, threadID, (err, info) => {
      if (err) return console.log(err);
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID,
        listRequest: listRequest
      });
    }, messageID);

  } catch (error) {
    console.error("❌ خطأ في طلبات:", error);
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ حدث خطأ: ${error.message}`,
      threadID,
      messageID
    );
  }
};