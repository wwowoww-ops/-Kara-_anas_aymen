module.exports.config = {
  name: "اطردني",
  version: "2.1.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "مغادرة المجموعة عبر الطرد",
  commandCategory: "utility",
  usages: "اطردني",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const { threadID, senderID, messageID } = event;
  const header = `⌬ ━━━━━━━━━━━━ ⌬\n      🚪 مـغـادرة الـنـظـام\n⌬ ━━━━━━━━━━━━ ⌬`;
  
  // جلب أيدي المطور من الكونسل للحماية
  const config = JSON.parse(fs.readFileSync("./config.json"));
  const adminID = config.KIRA_CONF?.dev || config.ADMINBOT[0];

  try {
    // حماية المطور: البوت يرفض طردك
    if (senderID === adminID) {
      return api.sendMessage(
        `🥺 تعال يا أبو هريرة 💕\n\nمامي ما سمحتلك تخرج! 😤\nمين سمحلك تطلب الطرد؟ 🌸✨\n\n🛡️ أنت المطور، ما تطلعش غير بإذن مامي 💖`,
        threadID,
        (err, info) => {
          setTimeout(() => api.unsendMessage(info.messageID), 4000);
        },
        messageID
      );
    }

    const info = await api.getThreadInfo(threadID);
    const botID = api.getCurrentUserID();
    const isBotAdmin = info.adminIDs.some(e => e.id == botID);

    if (!isBotAdmin) {
      return api.sendMessage(
        `🥺 تعال يا قلبي 💕\n\nمامي ما تقدر تخرجك لأني مش أدمن! 😤\nخلي الأدمن يضيفني أولاً 🌸✨`,
        threadID,
        (err, info) => {
          setTimeout(() => api.unsendMessage(info.messageID), 4000);
        },
        messageID
      );
    }

    // جلب اسم العضو
    let userName = "حبيبي";
    try {
      const userInfo = await api.getUserInfo(senderID);
      userName = userInfo[senderID]?.name || "حبيبي";
    } catch (e) {}

    // إرسال رسالة الوداع من مامي
    await api.sendMessage(
      `🥺 تعال يا ${userName} 💕\n\nمامي بتسلم عليك وتقولك:\n"خلاص، أنت طلعت من المجموعة، بس افتكرني دايم 🌸"\n\n💔 مع السلامة، نلتقي قريباً إن شاء الله 💖`,
      threadID
    );
    
    // تنفيذ الطرد
    return api.removeUserFromGroup(senderID, threadID);

  } catch (err) {
    console.error("❌ خطأ في اطردني:", err);
    return api.sendMessage(
      `🥺 مامي آسفة 💕\n\nحدث خطأ أثناء محاولة طردك 😤\nجرب مرة أخرى 🌸✨`,
      threadID,
      messageID
    );
  }
};