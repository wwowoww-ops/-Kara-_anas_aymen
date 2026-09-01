module.exports.config = {
  name: "كنية",
  version: "4.1.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "تغيير كنية عضو عن طريق الرد على رسالته",
  commandCategory: "admin",
  usages: "كنية <الكنية> (رد على رسالة العضو)",
  cooldowns: 3
};

module.exports.run = async function ({
  api,
  event,
  args
}) {
  const {
    threadID,
    messageID,
    senderID,
    messageReply
  } = event;

  try {

    // ======================================================
    // المطور
    // ======================================================

    const DEVELOPER_ID =
      "61578581225040";

    // ======================================================
    // معلومات المجموعة
    // ======================================================

    const threadInfo =
      await api.getThreadInfo(
        threadID
      );

    if (!threadInfo) {
      return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
        "❌ تعذر الحصول على معلومات المجموعة.",
        threadID,
        messageID
      );
    }

    // ======================================================
    // التحقق من الأدمن
    // أو المطور
    // ======================================================

    const isDeveloper =
      String(senderID) ===
      DEVELOPER_ID;

    const isAdmin =
      Array.isArray(
        threadInfo.adminIDs
      ) &&
      threadInfo.adminIDs.some(
        admin =>
          String(admin.id) ===
          String(senderID)
      );

    if (
      !isAdmin &&
      !isDeveloper
    ) {
      return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
        "⛔ هذا الأمر للأدمن أو المطور فقط!",
        threadID,
        messageID
      );
    }

    // ======================================================
    // التأكد من وجود رد
    // ======================================================

    if (
      !messageReply ||
      !messageReply.senderID
    ) {
      return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
        "📝 الاستخدام:\n\n" +
        "قم بالرد على رسالة العضو ثم اكتب:\n\n" +
        "كنية <الكنية>",
        threadID,
        messageID
      );
    }

    // ======================================================
    // استخراج الكنية الجديدة
    // ======================================================

    const nickname =
      Array.isArray(args)
        ? args.join(" ").trim()
        : "";

    if (!nickname) {
      return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
        "❌ لم تحدد الكنية الجديدة.\n\n" +
        "📝 مثال:\n" +
        "كنية Ⓜ︎ - ●【 جــنــديـة - غـــيـمـــــة 】●",
        threadID,
        messageID
      );
    }

    // ======================================================
    // تحديد العضو المستهدف
    // ======================================================

    const targetID =
      String(
        messageReply.senderID
      );

    // ======================================================
    // منع تغيير كنية البوت
    // ======================================================

    const botID =
      String(
        api.getCurrentUserID()
      );

    if (
      targetID === botID
    ) {
      return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
        "😅 لا يمكن تغيير كنية البوت!",
        threadID,
        messageID
      );
    }

    // ======================================================
    // الحصول على الكنية القديمة
    // ======================================================

    const oldNickname =
      threadInfo.nicknames?.[targetID] ||
      "لا توجد كنية";

    // ======================================================
    // تغيير الكنية
    // ======================================================

    await api.changeNickname(
      nickname,
      threadID,
      targetID
    );

    // ======================================================
    // رسالة النجاح
    // ======================================================

    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
      "✅ تم تغيير الكنية بنجاح!\n\n" +
      `🏷️ الكنية القديمة:\n${oldNickname}\n\n` +
      `🏷️ الكنية الجديدة:\n${nickname}`,
      threadID,
      messageID
    );

  } catch (error) {

    console.error(
      "❌ [HINA NICKNAME ERROR]",
      error
    );

    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
      "❌ حدث خطأ أثناء تغيير الكنية.\n\n" +
      "تأكد أن البوت يملك صلاحية تغيير كنيات أعضاء المجموعة.",
      threadID,
      messageID
    );
  }
};