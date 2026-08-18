const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "protection.json");

module.exports.config = {
  name: "حماية",
  version: "2.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "نظام حماية متكامل للمجموعة",
  commandCategory: "admin",
  usages: "حماية",
  cooldowns: 5
};

// ==================================================
// إنشاء ملف البيانات
// ==================================================

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify({}, null, 2),
        "utf8"
      );
    }
  } catch (error) {
    console.error(
      "❌ HINA PROTECTION DATA ERROR:",
      error
    );
  }
}

// ==================================================
// قراءة البيانات
// ==================================================

function readData() {
  ensureDataFile();

  try {
    const data = fs.readFileSync(
      DATA_FILE,
      "utf8"
    );

    if (!data.trim()) {
      return {};
    }

    return JSON.parse(data);
  } catch (error) {
    console.error(
      "❌ HINA PROTECTION READ ERROR:",
      error
    );

    return {};
  }
}

// ==================================================
// حفظ البيانات
// ==================================================

function saveData(data) {
  ensureDataFile();

  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(data, null, 2),
      "utf8"
    );

    return true;
  } catch (error) {
    console.error(
      "❌ HINA PROTECTION SAVE ERROR:",
      error
    );

    return false;
  }
}

// ==================================================
// إعداد مجموعة جديدة
// ==================================================

function createDefaultSettings() {
  return {
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

function getThreadSettings(data, threadID) {
  if (!data[threadID]) {
    data[threadID] =
      createDefaultSettings();
  }

  if (!data[threadID].settings) {
    data[threadID].settings = {};
  }

  const defaults =
    createDefaultSettings().settings;

  for (const key of Object.keys(defaults)) {
    if (
      typeof data[threadID].settings[key] !==
      "boolean"
    ) {
      data[threadID].settings[key] =
        defaults[key];
    }
  }

  if (
    typeof data[threadID].enabled !==
    "boolean"
  ) {
    data[threadID].enabled = false;
  }

  return data[threadID];
}

// ==================================================
// التحقق من أدمن المجموعة
// ==================================================

async function isGroupAdmin(api, threadID, senderID) {
  try {
    const threadInfo =
      await api.getThreadInfo(threadID);

    if (
      !threadInfo ||
      !Array.isArray(threadInfo.adminIDs)
    ) {
      return false;
    }

    return threadInfo.adminIDs.some(
      admin =>
        String(admin.id) ===
        String(senderID)
    );

  } catch (error) {
    console.error(
      "❌ HINA ADMIN CHECK ERROR:",
      error
    );

    return false;
  }
}

// ==================================================
// القائمة
// ==================================================

function createMenu(settings) {
  const status =
    settings.enabled
      ? "✅ مـفـعـل"
      : "❌ مـعـطـل";

  const getStatus = key =>
    settings.settings[key]
      ? "✅"
      : "❌";

  return `
⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬

🛡️ نـظـام حـمـايـة الـمـجـمـوعـة

📋 اخـتـار رقـم الإعـداد:

1 ≻ 🔒 الحماية الكلية ${status}
2 ≻ 🏷️ حماية الكنيات ${getStatus("nicknames")}
3 ≻ ➕ حماية إضافة الأعضاء ${getStatus("addMember")}
4 ≻ 📛 حماية اسم المجموعة ${getStatus("groupName")}
5 ≻ 🖼️ حماية صورة المجموعة ${getStatus("groupImage")}
6 ≻ 🎨 حماية السمة ${getStatus("theme")}
7 ≻ 😊 حماية الإيموجي ${getStatus("emoji")}

━━━━━━━━━━━━━━━━━━

📝 أرسل رقمًا من 1 إلى 7
❌ للإلغاء أرسل: خروج

⌬ ━━━━━━━━━━━━ ⌬
`;
}

// ==================================================
// RUN
// ==================================================

module.exports.run = async function({
  api,
  event
}) {

  const {
    threadID,
    messageID,
    senderID
  } = event;

  try {

    // التحقق من الأدمن
    const admin =
      await isGroupAdmin(
        api,
        threadID,
        senderID
      );

    if (!admin) {
      return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 ADMIN ━━ ⌬

🥺 مـامـي مـا سـمـحـتـلـك تـغـيـر شـي يـا قـلـبـي

⛔ هـذا الأمـر لـلأدمـن فـقـط

⌬ ━━━━━━━━━━━━ ⌬`,
        threadID,
        messageID
      );
    }

    const data =
      readData();

    const settings =
      getThreadSettings(
        data,
        threadID
      );

    saveData(data);

    const menu =
      createMenu(settings);

    // إرسال القائمة أولًا
    return api.sendMessage(
      menu,
      threadID,
      (err, info) => {

        if (err) {
          console.error(
            "❌ HINA PROTECTION MENU ERROR:",
            err
          );
          return;
        }

        if (!info || !info.messageID) {
          return;
        }

        // تسجيل الرد على رسالة القائمة
        if (!global.client.handleReply) {
          global.client.handleReply = [];
        }

        global.client.handleReply.push({
          name:
            module.exports.config.name,

          messageID:
            info.messageID,

          author:
            String(senderID),

          threadID:
            String(threadID),

          type: "protection_menu"
        });

      },
      messageID
    );

  } catch (error) {

    console.error(
      "❌ HINA PROTECTION ERROR:",
      error
    );

    return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 ADMIN ━━ ⌬

❌ حـدث خـطـأ أثـنـاء تـشـغـيـل نـظـام الـحـمـايـة

📌 ${error.message}

⌬ ━━━━━━━━━━━━ ⌬`,
      threadID,
      messageID
    );
  }
};

// ==================================================
// HANDLE REPLY
// ==================================================

module.exports.handleReply =
async function({
  api,
  event,
  handleReply
}) {

  const {
    threadID,
    messageID,
    senderID,
    body
  } = event;

  // ==================================================
  // التحقق من صاحب القائمة
  // ==================================================

  if (
    String(handleReply.author) !==
    String(senderID)
  ) {
    return;
  }

  // ==================================================
  // التحقق من نفس المجموعة
  // ==================================================

  if (
    String(handleReply.threadID) !==
    String(threadID)
  ) {
    return;
  }

  // ==================================================
  // التحقق من الأدمن
  // ==================================================

  const admin =
    await isGroupAdmin(
      api,
      threadID,
      senderID
    );

  if (!admin) {
    return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 ADMIN ━━ ⌬

⛔ لم تعد تملك صلاحية أدمن المجموعة.

⌬ ━━━━━━━━━━━━ ⌬`,
      threadID,
      messageID
    );
  }

  if (
    !body ||
    !body.trim()
  ) {
    return;
  }

  const choice =
    body.trim();

  // ==================================================
  // خروج
  // ==================================================

  if (
    choice === "خروج" ||
    choice.toLowerCase() === "cancel"
  ) {

    return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬

❌ تم إلغاء إعدادات الحماية.

⌬ ━━━━━━━━━━━━ ⌬`,
      threadID,
      messageID
    );
  }

  // ==================================================
  // التحقق من الرقم
  // ==================================================

  if (!/^[1-7]$/.test(choice)) {

    return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬

⚠️ رقم غير صحيح.

📌 اختر رقمًا من 1 إلى 7
❌ أو أرسل: خروج

⌬ ━━━━━━━━━━━━ ⌬`,
      threadID,
      messageID
    );
  }

  const data =
    readData();

  const settings =
    getThreadSettings(
      data,
      threadID
    );

  // ==================================================
  // الخيارات
  // ==================================================

  const options = {
    "2": {
      key: "nicknames",
      name: "حماية الكنيات"
    },

    "3": {
      key: "addMember",
      name: "حماية إضافة الأعضاء"
    },

    "4": {
      key: "groupName",
      name: "حماية اسم المجموعة"
    },

    "5": {
      key: "groupImage",
      name: "حماية صورة المجموعة"
    },

    "6": {
      key: "theme",
      name: "حماية السمة"
    },

    "7": {
      key: "emoji",
      name: "حماية الإيموجي"
    }
  };

  // ==================================================
  // الحماية الكلية
  // ==================================================

  if (choice === "1") {

    settings.enabled =
      !settings.enabled;

    const saved =
      saveData(data);

    if (!saved) {
      return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬

❌ تعذر حفظ إعداد الحماية.

⌬ ━━━━━━━━━━━━ ⌬`,
        threadID,
        messageID
      );
    }

    try {
      api.setMessageReaction(
        settings.enabled
          ? "✅"
          : "❌",
        messageID,
        () => {},
        true
      );
    } catch (e) {}

    return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬

🛡️ الحماية الكلية:
${settings.enabled ? "✅ تم تفعيلها" : "❌ تم إيقافها"}

📌 المجموعة:
${threadID}

⌬ ━━━━━━━━━━━━ ⌬`,
      threadID,
      messageID
    );
  }

  // ==================================================
  // إعداد فرعي
  // ==================================================

  const selected =
    options[choice];

  if (!selected) {
    return;
  }

  const key =
    selected.key;

  settings.settings[key] =
    !settings.settings[key];

  const saved =
    saveData(data);

  if (!saved) {
    return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬

❌ تعذر حفظ إعداد الحماية.

⌬ ━━━━━━━━━━━━ ⌬`,
      threadID,
      messageID
    );
  }

  try {
    api.setMessageReaction(
      settings.settings[key]
        ? "✅"
        : "❌",
      messageID,
      () => {},
      true
    );
  } catch (e) {}

  return api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬

🛡️ ${selected.name}

${settings.settings[key]
  ? "✅ تم التفعيل"
  : "❌ تم الإيقاف"}

⌬ ━━━━━━━━━━━━ ⌬`,
    threadID,
    messageID
  );
};