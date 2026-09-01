module.exports.config = {
  name: "كنية",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "تغيير كنية عضو عن طريق الرد على رسالته",
  commandCategory: "إدارة",
  usages: "كنية <الكنية>",
  cooldowns: 3
};

module.exports.run = async ({
  api,
  event,
  args
}) => {
  const {
    threadID,
    messageID,
    senderID,
    messageReply
  } = event;

  try {

    // ======================================================
    // معلومات المجموعة والتحقق من الأدمن
    // ======================================================

    const threadInfo =
      await api.getThreadInfo(
        threadID
      );

    if (
      !threadInfo
    ) {
      return api.sendMessage(
        "❌ تعذر الحصول على معلومات المجموعة.",
        threadID,
        messageID
      );
    }

    const adminIDs =
      Array.isArray(
        threadInfo.adminIDs
      )
        ? threadInfo.adminIDs.map(
            id => String(id)
          )
        : [];

    if (
      !adminIDs.includes(
        String(senderID)
      )
    ) {
      return api.sendMessage(
        "❌ هذا الأمر مخصص لأدمن المجموعة فقط.",
        threadID,
        messageID
      );
    }

    // ======================================================
    // التأكد من وجود رد على عضو
    // ======================================================

    if (
      !messageReply ||
      !messageReply.senderID
    ) {
      return api.sendMessage(
        "❌ يجب أن ترد على رسالة العضو أولًا.\n\n" +
        "مثال:\n" +
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
        "❌ اكتب الكنية التي تريد وضعها.\n\n" +
        "مثال:\n" +
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
        "❌ لا يمكن تغيير كنية البوت.",
        threadID,
        messageID
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
    // الحصول على اسم العضو
    // ======================================================

    let name =
      "العضو";

    try {
      const userInfo =
        await api.getUserInfo(
          targetID
        );

      name =
        userInfo?.[targetID]?.name ||
        userInfo?.[targetID]?.firstName ||
        "العضو";
    } catch (e) {
      console.error(
        "[NICKNAME USER INFO ERROR]",
        e
      );
    }

    return api.sendMessage(
      "⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬\n\n" +
      "✅ تم تغيير الكنية بنجاح.\n\n" +
      `👤 العضو: ${name}\n` +
      `🏷️ الكنية الجديدة: ${nickname}`,
      threadID,
      messageID
    );

  } catch (error) {

    console.error(
      "[NICKNAME ERROR]",
      error
    );

    return api.sendMessage(
      "❌ تعذر تغيير الكنية.\n\n" +
      "تأكد أن البوت يملك صلاحية تغيير كنيات أعضاء المجموعة.",
      threadID,
      messageID
    );
  }
};