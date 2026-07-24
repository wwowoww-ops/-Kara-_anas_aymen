module.exports.config = {
  name: "تحذير",
  version: "2.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "إعطاء تحذير لعضو مع حفظ دائم والطرد بعد 3 تحذيرات",
  commandCategory: "admin",
  usages: "تحذير [@منشن] [السبب]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, mentions, messageReply } = event;
  const fs = require("fs");
  const path = "./warnings.json";

  let targetID;

  if (messageReply) {
    targetID = messageReply.senderID;
  } else if (Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
  } else {
    return api.sendMessage(
      "⚠️ الاستخدام:\nتحذير @منشن [السبب]\nأو الرد على رسالة العضو",
      threadID,
      messageID
    );
  }

  let reason = args.join(" ");
  if (reason.includes("@")) {
    reason = reason.replace(/@\S+/g, "").trim();
  }
  if (!reason) reason = "بدون سبب";

  // التحقق من صلاحية البوت كأدمن
  const threadInfo = await api.getThreadInfo(threadID);
  const botID = api.getCurrentUserID();
  const isAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);

  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({}));
  }

  let data = JSON.parse(fs.readFileSync(path));

  if (!data[threadID]) data[threadID] = {};
  if (!data[threadID][targetID]) {
    data[threadID][targetID] = [];
  }

  // إضافة التحذير الجديد
  data[threadID][targetID].push({
    reason: reason,
    time: new Date().toLocaleString("ar")
  });

  fs.writeFileSync(path, JSON.stringify(data, null, 2));

  let count = data[threadID][targetID].length;

  // إذا وصل إلى 3 تحذيرات → طرد
  if (count >= 3) {
    // حذف تحذيرات العضو بعد الطرد
    delete data[threadID][targetID];
    fs.writeFileSync(path, JSON.stringify(data, null, 2));

    // جلب اسم العضو
    let userName = "العضو";
    try {
      const userInfo = await api.getUserInfo(targetID);
      userName = userInfo[targetID]?.name || "العضو";
    } catch (e) {}

    // طرد العضو
    try {
      if (isAdmin) {
        await api.removeUserFromGroup(targetID, threadID);
        return api.sendMessage(
          `⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n🚫 تم طرد ${userName}\n\n📌 سبب الطرد: تجاوز 3 تحذيرات\n📋 آخر تحذير: ${reason}`,
          threadID,
          messageID
        );
      } else {
        return api.sendMessage(
          `⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n⚠️ ${userName} وصل إلى 3 تحذيرات!\n\n❌ لكني لست مشرفاً في المجموعة، لا يمكنني طرده.\n\n📌 آخر تحذير: ${reason}`,
          threadID,
          messageID
        );
      }
    } catch (error) {
      return api.sendMessage(
        `⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n⚠️ ${userName} وصل إلى 3 تحذيرات!\n\n❌ حدث خطأ أثناء محاولة الطرد: ${error.message}`,
        threadID,
        messageID
      );
    }
  }

  // إذا لم يصل إلى 3 تحذيرات
  return api.sendMessage(
    `⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n⚠️ تم إعطاء تحذير للعضو\n\n📌 السبب: ${reason}\n🔢 عدد التحذيرات: ${count}/3`,
    threadID,
    messageID
  );
};