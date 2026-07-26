const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "زوجيني",
  version: "2.2.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "زواج عشوائي من أحد أعضاء المجموعة مع نسبة توافق (المطور غير محمي)",
  commandCategory: "fun",
  usages: "زوجيني",
  cooldowns: 5
};

module.exports.run = async function({ api, event, Users }) {
  const { threadID, messageID, senderID } = event;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // جلب جميع أعضاء المجموعة
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    const participants = threadInfo.participantIDs || [];
    
    // استبعاد البوت نفسه
    const botID = api.getCurrentUserID();
    const members = participants.filter(id => id !== botID && id !== senderID);
    
    if (members.length === 0) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ لا يوجد أعضاء كافيين في المجموعة للزواج!`,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // اختيار شخص عشوائي
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const randomIndex = Math.floor(Math.random() * members.length);
    const partnerID = members[randomIndex];

    // جلب أسماء المستخدمين
    const [senderData, partnerData] = await Promise.all([
      Users.getData(senderID),
      Users.getData(partnerID)
    ]);

    const senderName = senderData.name;
    const partnerName = partnerData.name;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // حساب نسبة التوافق
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const getCompatibility = (name1, name2) => {
      let base = Math.floor(Math.random() * 41) + 30;
      
      const len1 = name1.length;
      const len2 = name2.length;
      const lenFactor = Math.min(len1, len2) / Math.max(len1, len2);
      
      const commonLetters = [...new Set(name1.split(''))].filter(c => name2.includes(c)).length;
      const letterFactor = commonLetters / Math.max([...new Set(name1 + name2)].length, 1);
      
      let finalPercent = Math.round((base + (lenFactor * 15) + (letterFactor * 15)) / 1.3);
      
      return Math.min(Math.max(finalPercent, 0), 100);
    };

    const lovePercent = getCompatibility(senderName, partnerName);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // رسالة حسب نسبة التوافق
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    let loveMessage = "";
    if (lovePercent >= 90) {
      loveMessage = "💖 توافق خيالي! أنتما مثاليان لبعضكما!";
    } else if (lovePercent >= 70) {
      loveMessage = "❤️ توافق رائع! علاقة قوية بإذن الله!";
    } else if (lovePercent >= 50) {
      loveMessage = "💕 توافق جيد! مع الوقت ستزداد المحبة!";
    } else if (lovePercent >= 30) {
      loveMessage = "💔 توافق متوسط... تحتاجون إلى عمل على العلاقة!";
    } else {
      loveMessage = "💔 توافق ضعيف... الله يعينكم على بعض! 😂";
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ردود مضحكة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const funnyReplies = [
      `💍 ألف مبروك الزواج لـ ${senderName} و ${partnerName}! 🎉`,
      `💕 تم الزواج! ${senderName} و ${partnerName} أصبحا زوجين! 🥂`,
      `🌸 مبارك للعروسين ${senderName} و ${partnerName}! 💐`,
      `💖 زواج سعيد لـ ${senderName} و ${partnerName}! 🎊`
    ];
    const randomReply = funnyReplies[Math.floor(Math.random() * funnyReplies.length)];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // حفظ الزواج في ملف (اختياري)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const marriagePath = "./data/marriages.json";
    if (!fs.existsSync(marriagePath)) {
      fs.writeFileSync(marriagePath, JSON.stringify({}));
    }
    let marriages = JSON.parse(fs.readFileSync(marriagePath));

    if (!marriages[threadID]) {
      marriages[threadID] = [];
    }

    // التحقق من وجود زواج سابق
    const existingMarriage = marriages[threadID].find(
      m => m.user1 === senderID || m.user2 === senderID
    );

    if (!existingMarriage) {
      const marriageDate = new Date().toLocaleString("ar", {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      marriages[threadID].push({
        user1: senderID,
        user2: partnerID,
        date: marriageDate,
        timestamp: Date.now()
      });
      fs.writeFileSync(marriagePath, JSON.stringify(marriages, null, 2));
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // إرسال النتيجة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const totalMarriages = marriages[threadID] ? marriages[threadID].length : 0;

    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n` +
      `${randomReply}\n\n` +
      `📊 نسبة التوافق: ${lovePercent}%\n${loveMessage}\n\n` +
      `👤 ${senderName} ❤️ ${partnerName}\n` +
      `📅 تاريخ الزواج: ${new Date().toLocaleString("ar")}\n` +
      `📊 عدد الزيجات في المجموعة: ${totalMarriages}`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("❌ خطأ في زوجيني:", error);
    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ حدث خطأ أثناء الزواج:\n${error.message}`,
      threadID,
      messageID
    );
  }
};