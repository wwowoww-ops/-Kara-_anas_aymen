const fs = require("fs-extra");
const axios = require("axios");

module.exports.config = {
  name: "ضيفي",
  version: "3.0.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "إضافة مستخدم عبر الرابط أو الرد (مع الإضافة القسرية)",
  commandCategory: "developer",
  usages: "ضيفي [رابط الحساب] أو بالرد على رسالة بها رابط",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, type, messageReply } = event;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔑 التحقق من المطور
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (!global.config.ADMINBOT.includes(senderID)) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⛔ هذا الأمر للمطور فقط!`,
      threadID,
      messageID
    );
  }

  let input = args[0];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📥 استخراج الرابط من الرد
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (type === "message_reply" && messageReply.body) {
    const regex = /(https?:\/\/[^\s]+)/g;
    const found = messageReply.body.match(regex);
    if (found) input = found[0];
    else if (!isNaN(messageReply.senderID)) input = messageReply.senderID;
  }

  if (!input) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📝 الاستخدام:\n• ضيفي [رابط الحساب]\n• أو رد على رسالة العضو`,
      threadID,
      messageID
    );
  }

  api.setMessageReaction("⏳", messageID, () => {}, true);

  try {
    let idToAdd;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔍 استخراج الـ ID من الرابط
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (input.includes("facebook.com") || input.includes("fb.com")) {
      try {
        const res = await axios.get(`https://share-v2.onrender.com/findid?url=${encodeURIComponent(input)}`);
        idToAdd = res.data.id;
      } catch (e) {
        try {
          const resAlt = await axios.get(`https://id.traodoisub.com/api.php?link=${encodeURIComponent(input)}`);
          idToAdd = resAlt.data.id;
        } catch (e2) {
          // محاولة استخراج ID من الرابط مباشرة
          const match = input.match(/id=(\d+)/);
          if (match) idToAdd = match[1];
        }
      }
    } else {
      idToAdd = input;
    }

    if (!idToAdd || isNaN(idToAdd)) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ تعذر استخراج ID الحساب من هذا الرابط.`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📊 جلب معلومات المجموعة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const threadInfo = await api.getThreadInfo(threadID);
    const participantIDs = threadInfo.participantIDs;

    if (participantIDs.includes(idToAdd)) {
      api.setMessageReaction("⚠️", messageID, () => {}, true);
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ هذا المستخدم موجود بالفعل في المجموعة!`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💪 الإضافة القسرية (محاولات متعددة)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let added = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!added && attempts < maxAttempts) {
      attempts++;
      try {
        await api.addUserToGroup(idToAdd, threadID);
        added = true;
        break;
      } catch (e) {
        console.log(`⚠️ محاولة ${attempts} فشلت:`, e.message);
        // انتظار قبل المحاولة مرة أخرى
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (added) {
      api.setMessageReaction("✅", messageID, () => {}, true);
      
      // جلب اسم المستخدم
      let userName = "المستخدم";
      try {
        const userInfo = await api.getUserInfo(idToAdd);
        userName = userInfo[idToAdd]?.name || "المستخدم";
      } catch (e) {}

      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n✅ تمت إضافة ${userName} بنجاح إلى المجموعة!\n🆔 ${idToAdd}`,
        threadID,
        messageID
      );
    } else {
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      // 🔄 محاولة بديلة: إرسال رابط دعوة
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      try {
        const inviteLink = await api.createGroupLink(threadID);
        await api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⚠️ تعذر إضافة المستخدم تلقائياً.\n\n🔗 رابط دعوة للمجموعة:\n${inviteLink}\n\n📤 أرسل الرابط للشخص ليتمكن من الانضمام.`,
          threadID,
          messageID
        );
        api.setMessageReaction("🔗", messageID, () => {}, true);
      } catch (e2) {
        api.setMessageReaction("❌", messageID, () => {}, true);
        return api.sendMessage(
          `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ فشل إضافة المستخدم.\n\n💡 الأسباب المحتملة:\n• الحساب مغلق (Private).\n• البوت محظور من إضافة هذا الشخص.\n• الشخص قام بإلغاء خاصية الإضافة للمجموعات.\n• المجموعة بحاجة إلى موافقة المشرفين.`,
          threadID,
          messageID
        );
      }
    }

  } catch (err) {
    console.error("❌ خطأ في ضيفي:", err);
    api.setMessageReaction("❌", messageID, () => {}, true);
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ حدث خطأ: ${err.message}`,
      threadID,
      messageID
    );
  }
};
