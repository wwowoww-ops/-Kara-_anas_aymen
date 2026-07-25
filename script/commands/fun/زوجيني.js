const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "زوجيني",
  version: "2.3.2",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "زواج عشوائي أو من الشخص الذي ترد على رسالته مع نسبة توافق",
  commandCategory: "fun",
  usages: "زوجيني (أو بالرد على رسالة شخص)",
  cooldowns: 5
};

module.exports.run = async function({ api, event, Users }) {
  const { threadID, messageID, senderID, type, messageReply } = event;

  let id;
  let isReply = false;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // تحديد الضحية (بالرد أو عشوائي)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (type === "message_reply") {
    id = messageReply.senderID;
    isReply = true;
  } else {
    const threadInfo = await api.getThreadInfo(threadID);
    let participants = threadInfo.participantIDs;
    let listID = participants.filter(ID => ID !== senderID && ID !== api.getCurrentUserID());
    
    if (listID.length === 0) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ لا يوجد أعضاء كافيين في المجموعة للزواج!`,
        threadID,
        messageID
      );
    }
    id = listID[Math.floor(Math.random() * listID.length)];
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ❌ تم إلغاء حماية المطور ✅
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // منع الزواج من البوت فقط
  if (id === api.getCurrentUserID()) {
    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n😅 لا يمكن الزواج مني! أنا هنا لمساعدتك فقط.`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💾 حفظ الزواج
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const marriagePath = "./data/marriages.json";
  if (!fs.existsSync(marriagePath)) {
    fs.writeFileSync(marriagePath, JSON.stringify({}));
  }
  let marriages = JSON.parse(fs.readFileSync(marriagePath));

  // ✅ التأكد من وجود المفتاح
  if (!marriages[threadID]) {
    marriages[threadID] = [];
  }

  // التحقق من وجود زواج سابق
  const existingMarriage = marriages[threadID].find(
    m => m.user1 === senderID || m.user2 === senderID
  );

  // حساب عدد الزيجات (بأمان)
  const totalMarriages = marriages[threadID] ? marriages[threadID].length : 0;

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
      user2: id,
      date: marriageDate,
      timestamp: Date.now()
    });
    fs.writeFileSync(marriagePath, JSON.stringify(marriages, null, 2));
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📁 إعداد مجلد الكاش
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);

  const path1 = path.join(cacheDir, `avt_${senderID}.png`);
  const path2 = path.join(cacheDir, `avt_${id}.png`);

  try {
    // جلب الأسماء
    const [userData1, userData2] = await Promise.all([
      Users.getData(senderID),
      Users.getData(id)
    ]);

    const name1 = userData1.name;
    const name2 = userData2.name;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💖 حساب نسبة التوافق
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

    const lovePercent = getCompatibility(name1, name2);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 😊 رسائل حسب نسبة التوافق
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

    // جلب الصور
    const getAvt = async (uid, savePath) => {
      const imgRes = await axios.get(
        `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      );
      fs.writeFileSync(savePath, Buffer.from(imgRes.data));
    };

    await Promise.all([getAvt(senderID, path1), getAvt(id, path2)]);

    // رسائل مضحكة
    const funnyReplies = [
      `💍 ألف مبروك الزواج لـ ${name1} و ${name2}! 🎉`,
      `💕 تم الزواج! ${name1} و ${name2} أصبحا زوجين! 🥂`,
      `🌸 مبارك للعروسين ${name1} و ${name2}! 💐`,
      `💖 زواج سعيد لـ ${name1} و ${name2}! 🎊`
    ];
    const randomReply = funnyReplies[Math.floor(Math.random() * funnyReplies.length)];

    const msg = {
      body: `⌬ ━━ HINA FUN ━━ ⌬\n\n${isReply ? "🎉 تم القبول! أعلنتكما زوجاً وزوجة" : "💍 ألف مبروك! وجدت لك الشريك المناسب"}\n\n${randomReply}\n\n` +
            `📊 نسبة التوافق: ${lovePercent}%\n${loveMessage}\n\n` +
            `👤 ${name1} ❤️ ${name2}\n` +
            `📅 تاريخ الزواج: ${new Date().toLocaleString("ar")}\n` +
            `📊 عدد الزيجات في المجموعة: ${totalMarriages}`,
      mentions: [
        { tag: name1, id: senderID },
        { tag: name2, id: id }
      ],
      attachment: [fs.createReadStream(path1), fs.createReadStream(path2)]
    };

    return api.sendMessage(msg, threadID, () => {
      if (fs.existsSync(path1)) fs.unlinkSync(path1);
      if (fs.existsSync(path2)) fs.unlinkSync(path2);
    }, messageID);

  } catch (err) {
    console.error("❌ خطأ في زوجيني:", err);
    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ حدث خطأ أثناء الزواج:\n${err.message}`,
      threadID,
      messageID
    );
  }
};
