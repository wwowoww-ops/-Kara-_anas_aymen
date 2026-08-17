const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "زوجيني",
  version: "2.3.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "زواج عشوائي مع صور واسماء الطرفين ونسبة توافق",
  commandCategory: "fun",
  usages: "زوجيني",
  cooldowns: 5
};

module.exports.run = async function({ api, event, Users }) {
  const { threadID, messageID, senderID } = event;

  const tempDir = path.join(__dirname, "cache");

  try {
    // جلب أعضاء المجموعة
    const threadInfo = await api.getThreadInfo(threadID);
    const participants = threadInfo.participantIDs || [];

    // استبعاد البوت وصاحب الأمر
    const botID = api.getCurrentUserID();

    const members = participants.filter(
      id => id !== botID && id !== senderID
    );

    if (members.length === 0) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ لا يوجد أعضاء كافيين في المجموعة للزواج!`,
        threadID,
        messageID
      );
    }

    // اختيار شخص عشوائي
    const randomIndex = Math.floor(Math.random() * members.length);
    const partnerID = members[randomIndex];

    // جلب بيانات الأعضاء
    const [senderData, partnerData] = await Promise.all([
      api.getUserInfo(senderID),
      api.getUserInfo(partnerID)
    ]);

    const senderInfo = senderData[senderID];
    const partnerInfo = partnerData[partnerID];

    const senderName =
      senderInfo?.name ||
      (await Users.getData(senderID)).name ||
      "المستخدم";

    const partnerName =
      partnerInfo?.name ||
      (await Users.getData(partnerID)).name ||
      "العضو المختار";

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // حساب نسبة التوافق
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const getCompatibility = (name1, name2) => {
      let base = Math.floor(Math.random() * 41) + 30;

      const len1 = name1.length;
      const len2 = name2.length;

      const lenFactor =
        Math.min(len1, len2) / Math.max(len1, len2);

      const commonLetters = [
        ...new Set(name1.split(""))
      ].filter(c => name2.includes(c)).length;

      const letterFactor =
        commonLetters /
        Math.max([...new Set(name1 + name2)].length, 1);

      let finalPercent = Math.round(
        (base + lenFactor * 15 + letterFactor * 15) / 1.3
      );

      return Math.min(Math.max(finalPercent, 0), 100);
    };

    const lovePercent = getCompatibility(
      senderName,
      partnerName
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // رسالة حسب النسبة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // رد عشوائي
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const funnyReplies = [
      `💍 ألف مبروك الزواج لـ ${senderName} و ${partnerName}! 🎉`,
      `💕 تم الزواج! ${senderName} و ${partnerName} أصبحا زوجين! 🥂`,
      `🌸 مبارك للعروسين ${senderName} و ${partnerName}! 💐`,
      `💖 زواج سعيد لـ ${senderName} و ${partnerName}! 🎊`
    ];

    const randomReply =
      funnyReplies[
        Math.floor(Math.random() * funnyReplies.length)
      ];

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // إنشاء مجلد الكاش
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await fs.ensureDir(tempDir);

    const senderImagePath = path.join(
      tempDir,
      `زوجيني_${senderID}.jpg`
    );

    const partnerImagePath = path.join(
      tempDir,
      `زوجيني_${partnerID}.jpg`
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // روابط صور البروفايل
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const senderImage =
      senderInfo?.thumbSrc ||
      senderInfo?.profilePicture ||
      senderInfo?.profileUrl;

    const partnerImage =
      partnerInfo?.thumbSrc ||
      partnerInfo?.profilePicture ||
      partnerInfo?.profileUrl;

    // تحميل الصور
    const downloadImage = async (url, filePath) => {
      if (!url) return false;

      try {
        const response = await axios({
          method: "GET",
          url: url,
          responseType: "arraybuffer",
          timeout: 15000
        });

        await fs.writeFile(filePath, response.data);

        return true;
      } catch (err) {
        console.error("فشل تحميل الصورة:", err.message);
        return false;
      }
    };

    const [senderImageExists, partnerImageExists] =
      await Promise.all([
        downloadImage(senderImage, senderImagePath),
        downloadImage(partnerImage, partnerImagePath)
      ]);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // حفظ الزواج
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const marriagePath = "./data/marriages.json";

    await fs.ensureDir("./data");

    if (!fs.existsSync(marriagePath)) {
      fs.writeFileSync(
        marriagePath,
        JSON.stringify({})
      );
    }

    let marriages;

    try {
      marriages = JSON.parse(
        fs.readFileSync(marriagePath, "utf8")
      );
    } catch {
      marriages = {};
    }

    if (!marriages[threadID]) {
      marriages[threadID] = [];
    }

    const existingMarriage =
      marriages[threadID].find(
        m =>
          m.user1 === senderID ||
          m.user2 === senderID
      );

    if (!existingMarriage) {
      marriages[threadID].push({
        user1: senderID,
        user2: partnerID,
        date: new Date().toLocaleString("ar"),
        timestamp: Date.now()
      });

      fs.writeFileSync(
        marriagePath,
        JSON.stringify(marriages, null, 2)
      );
    }

    const totalMarriages =
      marriages[threadID].length;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // تجهيز الرسالة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const message =
      `⌬ ━━ HINA FUN ━━ ⌬\n\n` +
      `${randomReply}\n\n` +
      `👤 ${senderName}\n` +
      `❤️\n` +
      `💍 ${partnerName}\n\n` +
      `📊 نسبة التوافق: ${lovePercent}%\n` +
      `${loveMessage}\n\n` +
      `📅 تاريخ الزواج: ${new Date().toLocaleString("ar")}\n` +
      `📊 عدد الزيجات في المجموعة: ${totalMarriages}`;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // إرسال الصور
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const attachments = [];

    if (senderImageExists) {
      attachments.push(
        fs.createReadStream(senderImagePath)
      );
    }

    if (partnerImageExists) {
      attachments.push(
        fs.createReadStream(partnerImagePath)
      );
    }

    // إذا توفرت الصور
    if (attachments.length > 0) {
      api.sendMessage(
        {
          body: message,
          attachment: attachments
        },
        threadID,
        messageID
      );
    } else {
      // إذا فشل تحميل الصور، أرسل النتيجة بدون صور
      api.sendMessage(
        message,
        threadID,
        messageID
      );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // حذف الصور المؤقتة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    setTimeout(async () => {
      try {
        if (await fs.pathExists(senderImagePath)) {
          await fs.remove(senderImagePath);
        }

        if (await fs.pathExists(partnerImagePath)) {
          await fs.remove(partnerImagePath);
        }
      } catch (err) {
        console.error(
          "خطأ في حذف الصور المؤقتة:",
          err.message
        );
      }
    }, 30000);

  } catch (error) {
    console.error("❌ خطأ في زوجيني:", error);

    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n` +
      `❌ حدث خطأ أثناء الزواج:\n${error.message}`,
      threadID,
      messageID
    );
  }
};