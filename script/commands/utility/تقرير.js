const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "تقرير",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "إرسال تقرير أو اقتراح إلى مجموعة الاقتراحات",
  commandCategory: "fun",
  usages: "تقرير [نص التقرير]",
  cooldowns: 10
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const report = args.join(" ");

  if (!report) {
    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n📝 الاستخدام:\nتقرير [نص التقرير]\nمثال: تقرير أمر التحذير لا يعمل`,
      threadID,
      messageID
    );
  }

  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔍 البحث عن مجموعة "اقتراحات هينا"
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const threadList = await api.getThreadList(200, null, ["INBOX"]);
    let targetGroup = null;

    // البحث عن مجموعة باسم "اقتراحات هينا"
    for (const thread of threadList) {
      if (thread.isGroup && thread.name && thread.name.includes("اقتراحات هينا")) {
        targetGroup = thread;
        break;
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📌 إذا لم يتم العثور على المجموعة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (!targetGroup) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ لم يتم العثور على مجموعة "اقتراحات هينا".\n\n📌 يرجى إنشاء مجموعة باسم "اقتراحات هينا" وإضافة البوت إليها.`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📊 جلب معلومات المرسل
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let senderName = "عضو";
    try {
      const userInfo = await api.getUserInfo(senderID);
      senderName = userInfo[senderID]?.name || "عضو";
    } catch (e) {}

    // جلب معلومات المجموعة الحالية
    let groupName = "مجموعة غير معروفة";
    try {
      const threadInfo = await api.getThreadInfo(threadID);
      groupName = threadInfo.name || "مجموعة غير معروفة";
    } catch (e) {}

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📨 إرسال التقرير إلى مجموعة الاقتراحات
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const reportMessage = 
      `⌬ ━━ HINA REPORTS ━━ ⌬\n\n` +
      `📋 تقرير جديد!\n\n` +
      `👤 المرسل: ${senderName}\n` +
      `🆔 المعرف: ${senderID}\n` +
      `📌 المجموعة: ${groupName}\n` +
      `🆔 معرف المجموعة: ${threadID}\n\n` +
      `📝 التقرير:\n${report}\n\n` +
      `🕐 الوقت: ${new Date().toLocaleString("ar")}`;

    await api.sendMessage(reportMessage, targetGroup.threadID);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ✅ تأكيد إرسال التقرير للمستخدم
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n✅ تم إرسال تقريرك بنجاح!\n\n📝 التقرير: ${report}\n\n💡 شكراً لمساعدتك في تحسين البوت!`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("❌ خطأ في تقرير:", error);
    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ حدث خطأ أثناء إرسال التقرير:\n${error.message}`,
      threadID,
      messageID
    );
  }
};