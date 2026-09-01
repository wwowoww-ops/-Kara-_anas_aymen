module.exports.config = {
  name: "كنية",
  version: "4.0.0",
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
    // التحقق من أدمن المجموعة
    // نفس النظام المستخدم في أمر بانكاي
    // ======================================================

    const isAdmin =
      threadInfo.adminIDs.some(
        admin =>
          String(admin.id) ===
          String(senderID)
      );

    if (!isAdmin) {
      return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
        "⛔ هذا الأمر للأدمن فقط!",
        threadID,
        messageID
      );
    }

    // ======================================================
    // التأكد من الرد على عضو
    // ======================================================

    if (
      !messageReply ||
      !messageReply.senderID
    ) {
      return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
        "📝 الاستخدام:\n\n" +
        "قم بالرد على رسالة العضو ثم اكتب:\n\n" +
        "كنية Ⓜ︎ - ●【 جــنــديـة - غـــيـمـــــة 】●",
        threadID,
        messageID
      );
    }

    // ======================================================
    // استخراج الكنية
    // ======================================================

    const nickname =
      Array.isArray(args)
        ? args.join(" ").trim()
        : "";

    if (!nickname) {
      return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
        "❌ لم تحدد الكنية.\n\n" +
        "📝 مثال:\n" +
        "كنية Ⓜ︎ - ●【 جــنــديـة - غـــيـمـــــة 】●",
        threadID,
        messageID
      );
    }

    // ======================================================
    // العضو المستهدف
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
    // الحصول على اسم العضو
    // ======================================================

    let userName =
      "العضو";

    try {
      const userInfo =
        await api.getUserInfo(
          targetID
        );

      if (
        userInfo &&
        userInfo[targetID]
      ) {
        userName =
          userInfo[targetID].name ||
          userInfo[targetID].firstName ||
          "العضو";
      }

    } catch (e) {
      console.error(
        "[HINA NICKNAME USER INFO ERROR]",
        e
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
      `👤 العضو: ${userName}\n` +
      `🏷️ الكنية: ${nickname}`,
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