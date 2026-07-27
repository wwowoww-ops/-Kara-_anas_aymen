const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "صحى",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "تشغيل البوت في جميع المجموعات (للمطور فقط)",
  commandCategory: "developer",
  usages: "صحى",
  cooldowns: 10
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const configPath = "./config.json";
  const stopPath = "./data/stop.json";

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🔑 التحقق من المطور
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const config = JSON.parse(fs.readFileSync(configPath));
  const devID = config.KIRA_CONF?.dev || config.ADMINBOT?.[0];

  if (senderID !== devID) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n⛔ هذا الأمر للمطور الأساسي فقط!`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ☀️ تشغيل البوت في جميع المجموعات
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  try {
    // جلب جميع المجموعات
    const threadList = await api.getThreadList(500, null, ["INBOX"]);
    const groups = threadList.filter(t => t.isGroup === true);

    if (groups.length === 0) {
      return api.sendMessage(
        `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ لا توجد مجموعات متاحة.`,
        threadID,
        messageID
      );
    }

    // إزالة حالة الإيقاف لكل مجموعة
    let stopData = {};
    if (fs.existsSync(stopPath)) {
      stopData = JSON.parse(fs.readFileSync(stopPath));
    }

    let started = 0;
    for (const group of groups) {
      if (stopData[group.threadID]) {
        stopData[group.threadID].active = false;
        started++;
      }
    }

    fs.writeFileSync(stopPath, JSON.stringify(stopData, null, 2));

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💬 إرسال رسالة الصحوة إلى جميع المجموعات
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const wakeMessages = [
      `☀️ صباح الخير! البوت استيقظ 🌸\n\nأنا هنا لخدمتكم من جديد 💖`,
      `🌅 صح النوم... البوت رجع للعمل 💪\n\nاستعدوا للأوامر!`,
      `☀️ نهضت من النوم... مين يبي شيء؟ 😊\n\nأنا جاهز!`
    ];
    
    const randomMsg = wakeMessages[Math.floor(Math.random() * wakeMessages.length)];

    let sent = 0;
    for (const group of groups) {
      try {
        await api.sendMessage(
          `⌬ ━━ HINA ━━ ⌬\n\n${randomMsg}`,
          group.threadID
        );
        sent++;
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e) {
        console.log(`❌ فشل إرسال الرسالة إلى ${group.threadID}:`, e.message);
      }
    }

    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n☀️ تم تشغيل البوت في ${started} مجموعة!\n📨 تم إرسال رسالة الصحوة إلى ${sent} مجموعة.\n\n🔓 البوت يعمل الآن في جميع المجموعات.`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("❌ خطأ في صحى:", error);
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ حدث خطأ: ${error.message}`,
      threadID,
      messageID
    );
  }
};