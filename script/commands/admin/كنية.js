module.exports.config = {
  name: "كنية",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "تغيير كنية عضو (الرد على رسالته)",
  commandCategory: "admin",
  usages: "كنية [الكنية الجديدة] (رد على رسالة العضو)",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, messageReply } = event;

  // التحقق من صلاحية الأدمن
  const threadInfo = await api.getThreadInfo(threadID);
  const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
  if (!isAdmin) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⛔ هذا الأمر للأدمن فقط!`,
      threadID,
      messageID
    );
  }

  // التحقق من أن البوت أدمن
  const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());
  if (!isBotAdmin) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ يجب أن أكون أدمن في المجموعة لتغيير الكنى.`,
      threadID,
      messageID
    );
  }

  // التحقق من وجود رد على رسالة
  if (!messageReply) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📝 الاستخدام:\n• قم بالرد على رسالة العضو\n• اكتب: كنية [الكنية الجديدة]\n\nمثال: كنية أبو محمد`,
      threadID,
      messageID
    );
  }

  // جلب معرف العضو من الرسالة التي تم الرد عليها
  const targetID = messageReply.senderID;

  // التحقق من أن المستهدف ليس البوت نفسه
  if (targetID === api.getCurrentUserID()) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n😅 لا يمكنني تغيير كنية نفسي!`,
      threadID,
      messageID
    );
  }

  // جلب الكنية الجديدة
  const newNickname = args.join(" ");
  if (!newNickname) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📝 اكتب الكنية الجديدة بعد الأمر.\nمثال: كنية أبو محمد`,
      threadID,
      messageID
    );
  }

  // جلب اسم العضو القديم
  let oldName = "العضو";
  try {
    const userInfo = await api.getUserInfo(targetID);
    oldName = userInfo[targetID]?.name || "العضو";
  } catch (e) {}

  try {
    // تغيير الكنية
    await api.changeNickname(newNickname, threadID, targetID);

    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n✅ تم تغيير كنية العضو بنجاح!\n\n👤 العضو: ${oldName}\n🏷️ الكنية الجديدة: ${newNickname}`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("خطأ في تغيير الكنية:", error);
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ فشل تغيير الكنية:\n${error.message}`,
      threadID,
      messageID
    );
  }
};