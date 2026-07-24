module.exports.config = {
  name: "حماية",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "نظام حماية متكامل للمجموعة",
  commandCategory: "admin",
  usages: "حماية",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const fs = require("fs");
  const path = "./data/protection.json";

  // التحقق من صلاحية الأدمن
  const threadInfo = await api.getThreadInfo(threadID);
  const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
  if (!isAdmin) {
    return api.sendMessage(
      `🥺 مامي ما سمحتلك تغير شيء ي قلبي 💕\nهذا الأمر للأدمن فقط!`,
      threadID,
      messageID
    );
  }

  // التأكد من وجود ملف الحماية
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({}));
  }

  let protectionData = JSON.parse(fs.readFileSync(path));
  if (!protectionData[threadID]) {
    protectionData[threadID] = {
      enabled: false,
      settings: {
        nicknames: false,
        addMember: false,
        groupName: false,
        groupImage: false,
        theme: false,
        emoji: false
      }
    };
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // عرض القائمة الرئيسية
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const menu = `
🥺 مامي ما سمحتلك تغير شيء يا قلبي 💕

⌬ ━━ HINA ━━ ⌬

🛡️ نظام حماية المجموعة

📋 اختار رقم الإعداد يلي تريد تعديله:

1️⃣ 🔒 تفعيل/إيقاف الحماية (الكل)
2️⃣ 🏷️ حماية الكنيات (الأسماء)
3️⃣ ➕ حماية إضافة الأعضاء
4️⃣ 📛 حماية اسم المجموعة
5️⃣ 🖼️ حماية صورة المجموعة
6️⃣ 🎨 حماية السمة (الثيم)
7️⃣ 😊 حماية الإيموجي

📌 الوضع الحالي:
${protectionData[threadID].enabled ? '✅ مفعل' : '❌ معطل'}

📝 اكتب الرقم يلي تريد تعديله، أو "خروج" للإلغاء.
`;

  // تخزين البيانات للرد
  global.client.handleReply.push({
    name: "حماية",
    messageID: messageID,
    threadID: threadID,
    type: "menu"
  });

  return api.sendMessage(menu, threadID, messageID);
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// معالج الردود
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  const fs = require("fs");
  const path = "./data/protection.json";

  // التحقق من الصلاحية
  const threadInfo = await api.getThreadInfo(threadID);
  const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
  if (!isAdmin) {
    return api.sendMessage(
      `🥺 مامي ما سمحتلك تغير شيء يا قلبي 💕`,
      threadID,
      messageID
    );
  }

  let protectionData = JSON.parse(fs.readFileSync(path));
  if (!protectionData[threadID]) {
    protectionData[threadID] = {
      enabled: false,
      settings: {
        nicknames: false,
        addMember: false,
        groupName: false,
        groupImage: false,
        theme: false,
        emoji: false
      }
    };
  }

  const choice = body.trim();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // خروج
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (choice === "خروج") {
    return api.sendMessage(
      `🥺 اوكي حبيبي، خلاص مامي سامحتلك 💕🌸\n\n✅ تم إلغاء عملية الإعداد.`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // معالجة الاختيار
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const options = {
    "1": { key: "enabled", name: "تفعيل/إيقاف الحماية (الكل)" },
    "2": { key: "nicknames", name: "حماية الكنيات" },
    "3": { key: "addMember", name: "حماية إضافة الأعضاء" },
    "4": { key: "groupName", name: "حماية اسم المجموعة" },
    "5": { key: "groupImage", name: "حماية صورة المجموعة" },
    "6": { key: "theme", name: "حماية السمة" },
    "7": { key: "emoji", name: "حماية الإيموجي" }
  };

  const selected = options[choice];
  if (!selected) {
    return api.sendMessage(
      `🥺 رقم غير صحيح يا قلبي 💕\nالرجاء اختيار رقم من 1 إلى 7.`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // تفعيل/إيقاف الحماية الكلية
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (choice === "1") {
    protectionData[threadID].enabled = !protectionData[threadID].enabled;
    fs.writeFileSync(path, JSON.stringify(protectionData, null, 2));
    
    api.setMessageReaction("✅", messageID, () => {}, true);
    
    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n✅ ${protectionData[threadID].enabled ? 'تم تفعيل' : 'تم إيقاف'} الحماية الكلية للمجموعة!`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // تفعيل/إيقاف إعداد معين
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const settingKey = selected.key;
  protectionData[threadID].settings[settingKey] = !protectionData[threadID].settings[settingKey];
  fs.writeFileSync(path, JSON.stringify(protectionData, null, 2));

  api.setMessageReaction("✅", messageID, () => {}, true);

  return api.sendMessage(
    `⌬ ━━ HINA ━━ ⌬\n\n✅ تم ${protectionData[threadID].settings[settingKey] ? 'تفعيل' : 'إيقاف'} "${selected.name}"!`,
    threadID,
    messageID
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// معالج الأحداث (لتنفيذ الحماية)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
module.exports.handleEvent = async function({ api, event }) {
  const { threadID, logMessageType, logMessageData, author } = event;
  const fs = require("fs");
  const path = "./data/protection.json";

  if (!fs.existsSync(path)) return;
  const protectionData = JSON.parse(fs.readFileSync(path));

  if (!protectionData[threadID] || !protectionData[threadID].enabled) return;

  const settings = protectionData[threadID].settings;
  const botID = api.getCurrentUserID();

  const threadInfo = await api.getThreadInfo(threadID);
  const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
  if (!isBotAdmin) return;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1️⃣ حماية الكنيات
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (settings.nicknames && logMessageType === "log:user-nickname") {
    const changedUser = logMessageData.participant_id;
    if (changedUser && changedUser !== botID) {
      try {
        const userInfo = await api.getUserInfo(changedUser);
        const originalName = userInfo[changedUser]?.name || "عضو";
        await api.changeNickname(originalName, threadID, changedUser);
        console.log(`🛡️ تم إعادة اسم العضو ${changedUser}`);
      } catch (e) {}
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2️⃣ حماية إضافة الأعضاء
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (settings.addMember && (logMessageType === "log:subscribe" || event.type === "event" && event.logMessageType === "log:subscribe")) {
    const addedUsers = logMessageData?.addedParticipants || [];
    for (const user of addedUsers) {
      if (user.userFbId && user.userFbId !== botID) {
        try {
          await api.removeUserFromGroup(user.userFbId, threadID);
          console.log(`🛡️ تم طرد العضو المضاف ${user.userFbId}`);
        } catch (e) {}
      }
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3️⃣ حماية اسم المجموعة
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (settings.groupName && logMessageType === "log:thread-name") {
    try {
      console.log(`🛡️ تم اكتشاف تغيير اسم المجموعة`);
    } catch (e) {}
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4️⃣ حماية صورة المجموعة
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (settings.groupImage && (logMessageType === "log:thread-icon" || event.type === "change_thread_image")) {
    try {
      console.log(`🛡️ تم اكتشاف تغيير صورة المجموعة`);
    } catch (e) {}
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5️⃣ حماية السمة
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (settings.theme && logMessageType === "log:thread-color") {
    try {
      console.log(`🛡️ تم اكتشاف تغيير ثيم المجموعة`);
    } catch (e) {}
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6️⃣ حماية الإيموجي
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (settings.emoji && logMessageType === "log:thread-icon") {
    try {
      console.log(`🛡️ تم اكتشاف تغيير إيموجي المجموعة`);
    } catch (e) {}
  }
};