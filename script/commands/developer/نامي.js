const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "نامي",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "أبو هريرة",
  description: "إيقاف البوت في جميع المجموعات (للمطور فقط)",
  commandCategory: "developer",
  usages: "نامي [سبب النوم]",
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

  const reason = args.join(" ") || "وقت النوم 😴";

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💤 إيقاف البوت في جميع المجموعات
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

    // حفظ حالة الإيقاف لكل مجموعة
    let stopData = {};
    if (fs.existsSync(stopPath)) {
      stopData = JSON.parse(fs.readFileSync(stopPath));
    }

    let stopped = 0;
    for (const group of groups) {
      if (!stopData[group.threadID]) {
        stopData[group.threadID] = { active: false };
      }
      stopData[group.threadID].active = true;
      stopped++;
    }

    fs.writeFileSync(stopPath, JSON.stringify(stopData, null, 2));

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💬 إرسال رسالة النوم إلى جميع المجموعات
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const sleepMessages = [
      `💤 نامي نامي... حان وقت النوم يا جماعة 🌙\n\n${reason}`,
      `😴 البوت نااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااااa`,
      `🌙 وقت النوم... تصبحون على خير 💤\n\n${reason}`,
      `💤 البوت نام... صح النوم بعدين 🌙\n\n${reason}`
    ];
    
    const randomMsg = sleepMessages[Math.floor(Math.random() * sleepMessages.length)];

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
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n💤 تم إيقاف البوت في ${stopped} مجموعة!\n📨 تم إرسال رسالة النوم إلى ${sent} مجموعة.\n📝 السبب: ${reason}\n\n🔓 للتشغيل: .صحى`,
      threadID,
      messageID
    );

  } catch (error) {
    console.error("❌ خطأ في نامي:", error);
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ حدث خطأ: ${error.message}`,
      threadID,
      messageID
    );
  }
};