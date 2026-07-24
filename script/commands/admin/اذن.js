module.exports.config = {
  name: "اذن",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "إعطاء أو إلغاء إذن الخروج لعضو (يلغي تتبع البوت)",
  commandCategory: "admin",
  usages: "اذن [@منشن] [مدة] أو اذن [@منشن] الغاء",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, mentions, senderID } = event;
  const fs = require("fs");
  const path = "./data/tracking.json";
  const permissionsPath = "./data/permissions.json";

  // التحقق من صلاحية الأدمن
  const threadInfo = await api.getThreadInfo(threadID);
  const isAdmin = threadInfo.adminIDs.some(admin => admin.id === senderID);
  if (!isAdmin) {
    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n⛔ هذا الأمر للأدمن فقط!`,
      threadID,
      messageID
    );
  }

  // التأكد من وجود الملفات
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({}));
  }
  if (!fs.existsSync(permissionsPath)) {
    fs.writeFileSync(permissionsPath, JSON.stringify({}));
  }

  let trackingData = JSON.parse(fs.readFileSync(path));
  let permissionsData = JSON.parse(fs.readFileSync(permissionsPath));

  // التأكد من وجود المجموعة
  if (!permissionsData[threadID]) {
    permissionsData[threadID] = {};
  }

  // تحديد المستهدف
  let targetID;
  if (Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
  } else {
    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n📝 الاستخدام:\n• اذن @منشن [عدد الدقائق]\n• اذن @منشن الغاء\n\nمثال: اذن @أحمد 10`,
      threadID,
      messageID
    );
  }

  // جلب اسم العضو
  let userName = "العضو";
  try {
    const userInfo = await api.getUserInfo(targetID);
    userName = userInfo[targetID]?.name || "العضو";
  } catch (e) {}

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // إلغاء الإذن
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (args[1] === "الغاء" || args[1] === "cancel") {
    if (permissionsData[threadID][targetID]) {
      delete permissionsData[threadID][targetID];
      fs.writeFileSync(permissionsPath, JSON.stringify(permissionsData, null, 2));
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n✅ تم إلغاء إذن الخروج للعضو:\n👤 ${userName}\n\n🔓 يمكنه الآن الخروج ولكن سيتم إعادته تلقائياً (إن كان التتبع مفعلاً).`,
        threadID,
        messageID
      );
    } else {
      return api.sendMessage(
        `⌬ ━━ HINA ━━ ⌬\n\n❌ هذا العضو ليس لديه إذن خروج.`,
        threadID,
        messageID
      );
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // منح الإذن (مع مدة)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const duration = parseInt(args[1]);
  if (!duration || duration <= 0) {
    return api.sendMessage(
      `⌬ ━━ HINA ━━ ⌬\n\n⚠️ الرجاء إدخال مدة صحيحة (بالدقائق).\nمثال: اذن @أحمد 10`,
      threadID,
      messageID
    );
  }

  // حساب وقت الانتهاء
  const expiryTime = Date.now() + (duration * 60 * 1000);

  // حفظ الإذن
  permissionsData[threadID][targetID] = {
    expiry: expiryTime,
    grantedBy: senderID,
    grantedAt: Date.now()
  };

  fs.writeFileSync(permissionsPath, JSON.stringify(permissionsData, null, 2));

  // تعطيل التتبع لهذا العضو مؤقتاً
  if (trackingData[threadID] && trackingData[threadID].active) {
    if (!trackingData[threadID].exemptMembers) {
      trackingData[threadID].exemptMembers = [];
    }
    if (!trackingData[threadID].exemptMembers.includes(targetID)) {
      trackingData[threadID].exemptMembers.push(targetID);
    }
    fs.writeFileSync(path, JSON.stringify(trackingData, null, 2));
  }

  return api.sendMessage(
    `⌬ ━━ HINA ━━ ⌬\n\n✅ تم منح إذن الخروج للعضو:\n👤 ${userName}\n\n⏱️ المدة: ${duration} دقيقة\n🕐 ينتهي في: ${new Date(expiryTime).toLocaleString("ar")}\n\n🔓 يمكنه الخروج خلال هذه المدة دون إعادته.`,
    threadID,
    messageID
  );
};