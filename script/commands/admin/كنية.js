module.exports.config = {
  name: "كنية",
  version: "4.3.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "عرض أو تغيير كنية عضو عن طريق الرد على رسالته",
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
    // التحقق من الأدمن أو المطور
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
        "كنية\n" +
        "أو\n" +
        "كنية <الكنية>",
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
    // منع التعامل مع البوت
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
    // الحصول على الكنية الحالية
    // ======================================================

    const currentNickname =
      threadInfo.nicknames?.[targetID] ||
      "";

    // ======================================================
    // إذا لم يتم كتابة كنية
    // يعرض الكنية الحالية
    // ======================================================

    const nickname =
      Array.isArray(args)
        ? args.join(" ").trim()
        : "";

    if (!nickname) {

      return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
        "🏷️ الكنية الحالية:\n\n" +
        (
          currentNickname
            ? currentNickname
            : "لا توجد كنية"
        ),
        threadID,
        messageID
      );

    }

    // ======================================================
    // 🤖 تسجيل التغيير كـ تغيير صادر من البوت
    // ======================================================

    if (
      typeof global.HINA_MARK_BOT_CHANGE ===
      "function"
    ) {

      global.HINA_MARK_BOT_CHANGE(
        "nickname",
        String(threadID),
        String(targetID)
      );

    }

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
      `🏷️ الكنية القديمة:\n${
        currentNickname
          ? currentNickname
          : "لا توجد كنية"
      }\n\n` +
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