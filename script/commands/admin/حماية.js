const fs = require("fs-extra");
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

function ensureData() {
  fs.ensureDirSync(DATA_DIR);

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeJsonSync(DATA_FILE, {}, { spaces: 2 });
  }
}

function loadData() {
  ensureData();

  try {
    return fs.readJsonSync(DATA_FILE);
  } catch (e) {
    console.error("Protection JSON Error:", e.message);
    return {};
  }
}

function saveData(data) {
  ensureData();
  fs.writeJsonSync(DATA_FILE, data, { spaces: 2 });
}

function defaultThread() {
  return {
    enabled: false,

    settings: {
      nicknames: false,
      addMember: false,
      groupName: false,
      groupImage: false,
      theme: false,
      emoji: false
    },

    original: {
      groupName: null,
      theme: null,
      emoji: null,
      groupImage: null,
      nicknames: {}
    }
  };
}

async function isAdmin(api, threadID, userID) {
  try {
    const info = await api.getThreadInfo(threadID);

    if (!info || !Array.isArray(info.adminIDs)) {
      return false;
    }

    return info.adminIDs.some(
      x => String(x.id) === String(userID)
    );
  } catch (e) {
    console.error("Protection admin check:", e.message);
    return false;
  }
}

function getThreadData(data, threadID) {
  if (!data[threadID]) {
    data[threadID] = defaultThread();
  }

  if (!data[threadID].settings) {
    data[threadID].settings = defaultThread().settings;
  }

  if (!data[threadID].original) {
    data[threadID].original = defaultThread().original;
  }

  return data[threadID];
}

module.exports.run = async function({ api, event }) {
  const {
    threadID,
    messageID,
    senderID
  } = event;

  if (!(await isAdmin(api, threadID, senderID))) {
    return api.sendMessage(
      "⌬ ━━ HINA PROTECTION ━━ ⌬\n\n❌ هذا الأمر مخصص لمشرفي المجموعة فقط.",
      threadID,
      messageID
    );
  }

  const data = loadData();
  const protection = getThreadData(data, threadID);

  /*
   * نحاول أخذ الحالة الحالية للمجموعة
   * حتى تكون هي الحالة التي ستتم حمايتها.
   */
  try {
    const info = await api.getThreadInfo(threadID);

    if (info) {
      if (info.threadName) {
        protection.original.groupName = info.threadName;
      }

      if (info.threadTheme) {
        protection.original.theme = info.threadTheme;
      }

      if (info.emoji) {
        protection.original.emoji = info.emoji;
      }

      if (Array.isArray(info.nicknames)) {
        for (const item of info.nicknames) {
          if (item && item.userID) {
            protection.original.nicknames[String(item.userID)] =
              item.nickname || "";
          }
        }
      }
    }
  } catch (e) {
    console.log(
      "تعذر حفظ الحالة الأصلية:",
      e.message
    );
  }

  saveData(data);

  const s = protection.settings;

  const menu =
`⌬ ━━ HINA PROTECTION ━━ ⌬

🛡️ نظام حماية المجموعة

الحماية العامة:
${protection.enabled ? "✅ مفعلة" : "❌ معطلة"}

━━━━━━━━━━━━━━━━━━

1 ┃ ${protection.enabled ? "🔴 إيقاف" : "🟢 تفعيل"} الحماية العامة

2 ┃ ${s.nicknames ? "🟢" : "🔴"} حماية الكنيات
3 ┃ ${s.addMember ? "🟢" : "🔴"} حماية إضافة الأعضاء
4 ┃ ${s.groupName ? "🟢" : "🔴"} حماية اسم المجموعة
5 ┃ ${s.groupImage ? "🟢" : "🔴"} حماية صورة المجموعة
6 ┃ ${s.theme ? "🟢" : "🔴"} حماية السمة
7 ┃ ${s.emoji ? "🟢" : "🔴"} حماية الإيموجي

━━━━━━━━━━━━━━━━━━

↩️ أرسل رقم الإعداد
❌ أرسل "خروج" للإلغاء`;

  return api.sendMessage(
    menu,
    threadID,
    (err, info) => {
      if (err || !info) return;

      if (!global.client.handleReply) {
        global.client.handleReply = [];
      }

      global.client.handleReply.push({
        name: "حماية",
        messageID: info.messageID,
        author: senderID,
        threadID
      });
    },
    messageID
  );
};

module.exports.handleReply = async function({
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

  if (
    String(senderID) !==
    String(handleReply.author)
  ) {
    return;
  }

  if (!(await isAdmin(api, threadID, senderID))) {
    return api.sendMessage(
      "❌ يجب أن تكون مشرفًا لتغيير إعدادات الحماية.",
      threadID,
      messageID
    );
  }

  const choice = String(body || "").trim();

  if (
    choice === "خروج" ||
    choice.toLowerCase() === "cancel"
  ) {
    return api.sendMessage(
      "✅ تم إلغاء إعداد الحماية.",
      threadID,
      messageID
    );
  }

  const number = Number(choice);

  if (!Number.isInteger(number) || number < 1 || number > 7) {
    return api.sendMessage(
      "❌ اختيار غير صحيح.\nأرسل رقمًا من 1 إلى 7.",
      threadID,
      messageID
    );
  }

  const data = loadData();
  const protection = getThreadData(data, threadID);

  /*
   * قبل التفعيل نحفظ الحالة الحالية.
   */
  try {
    const info = await api.getThreadInfo(threadID);

    if (info) {
      if (info.threadName) {
        protection.original.groupName =
          info.threadName;
      }

      if (info.threadTheme) {
        protection.original.theme =
          info.threadTheme;
      }

      if (info.emoji) {
        protection.original.emoji =
          info.emoji;
      }
    }
  } catch (e) {
    console.log(
      "Snapshot error:",
      e.message
    );
  }

  const settings = {
    2: ["nicknames", "حماية الكنيات"],
    3: ["addMember", "حماية إضافة الأعضاء"],
    4: ["groupName", "حماية اسم المجموعة"],
    5: ["groupImage", "حماية صورة المجموعة"],
    6: ["theme", "حماية السمة"],
    7: ["emoji", "حماية الإيموجي"]
  };

  if (number === 1) {
    protection.enabled =
      !protection.enabled;

    saveData(data);

    return api.sendMessage(
      `⌬ ━━ HINA PROTECTION ━━ ⌬

${protection.enabled
  ? "🟢 تم تفعيل الحماية العامة."
  : "🔴 تم إيقاف الحماية العامة."}

🛡️ الحماية الآن:
${protection.enabled ? "مفعلة" : "معطلة"}`,
      threadID,
      messageID
    );
  }

  const selected = settings[number];

  if (!selected) return;

  const [key, name] = selected;

  protection.settings[key] =
    !protection.settings[key];

  saveData(data);

  return api.sendMessage(
    `⌬ ━━ HINA PROTECTION ━━ ⌬

${protection.settings[key]
  ? "🟢 تم تفعيل"
  : "🔴 تم إيقاف"} ${name}

🛡️ الحماية العامة:
${protection.enabled ? "مفعلة" : "معطلة"}`,
    threadID,
    messageID
  );
};