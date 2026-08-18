const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "لاست",
  version: "4.0.0",
  credits: "أبو هريرة",
  hasPermssion: 2,
  description: "عرض المجموعات المعروفة للبوت والتحكم بها",
  commandCategory: "developer",
  usages: "لاست",
  cooldowns: 5
};

// ======================================================
// إعدادات
// ======================================================

const DEV_ID = "61578581225040";

const DATA_DIR = path.join(process.cwd(), "data");
const BANNED_FILE = path.join(DATA_DIR, "banned.json");

fs.ensureDirSync(DATA_DIR);

// ======================================================
// التحقق من المطور
// ======================================================

function isDeveloper(senderID) {
  return String(senderID) === DEV_ID;
}

// ======================================================
// قراءة JSON بأمان
// ======================================================

function readJSON(file, fallback = {}) {
  try {
    if (!fs.existsSync(file)) return fallback;

    const content = fs.readFileSync(file, "utf8");

    if (!content.trim()) return fallback;

    return JSON.parse(content);
  } catch (error) {
    return fallback;
  }
}

// ======================================================
// كتابة JSON
// ======================================================

function writeJSON(file, data) {
  try {
    fs.writeFileSync(
      file,
      JSON.stringify(data, null, 2),
      "utf8"
    );

    return true;
  } catch (error) {
    return false;
  }
}

// ======================================================
// استخراج IDs التي يعرفها البوت
// بدون getThreadList
// وبدون Threads / MongoDB
// ======================================================

function getKnownThreadIDs() {
  const ids = new Set();

  try {
    if (
      global.data &&
      Array.isArray(global.data.allThreadID)
    ) {
      for (const id of global.data.allThreadID) {
        if (id) {
          ids.add(String(id));
        }
      }
    }
  } catch (e) {}

  // threadData
  try {
    if (
      global.data &&
      global.data.threadData
    ) {
      const data = global.data.threadData;

      if (data instanceof Map) {
        for (const id of data.keys()) {
          if (id) {
            ids.add(String(id));
          }
        }
      } else if (
        typeof data === "object"
      ) {
        for (const id of Object.keys(data)) {
          if (id) {
            ids.add(String(id));
          }
        }
      }
    }
  } catch (e) {}

  // threadBanned
  try {
    if (
      global.data &&
      global.data.threadBanned
    ) {
      if (
        typeof global.data.threadBanned.keys === "function"
      ) {
        for (const id of global.data.threadBanned.keys()) {
          if (id) {
            ids.add(String(id));
          }
        }
      }
    }
  } catch (e) {}

  // banned.json
  try {
    const banned = readJSON(BANNED_FILE, {});

    for (const id of Object.keys(banned)) {
      if (id) {
        ids.add(String(id));
      }
    }
  } catch (e) {}

  return [...ids];
}

// ======================================================
// جلب معلومات المجموعة مباشرة من FCA
// لا يستخدم Threads نهائيًا
// ======================================================

async function getGroupInfo(api, threadID) {
  try {
    if (
      !api ||
      typeof api.getThreadInfo !== "function"
    ) {
      return null;
    }

    const info = await api.getThreadInfo(
      String(threadID)
    );

    if (info) {
      return info;
    }
  } catch (error) {
    // نتجاهل المجموعة التي لا يمكن جلب معلوماتها
  }

  return null;
}

// ======================================================
// اسم المجموعة
// ======================================================

function getGroupName(info, threadID) {
  if (!info) {
    return `مجموعة ${threadID}`;
  }

  return (
    info.threadName ||
    info.name ||
    info.title ||
    `مجموعة ${threadID}`
  );
}

// ======================================================
// عدد الأعضاء
// ======================================================

function getMemberCount(info) {
  if (!info) return "?";

  if (
    Array.isArray(info.participantIDs)
  ) {
    return info.participantIDs.length;
  }

  if (
    Array.isArray(info.participants)
  ) {
    return info.participants.length;
  }

  return "?";
}

// ======================================================
// فحص الحظر
// ======================================================

function isBanned(threadID) {
  const id = String(threadID);

  // banned.json
  try {
    const banned = readJSON(
      BANNED_FILE,
      {}
    );

    if (
      Object.prototype.hasOwnProperty.call(
        banned,
        id
      )
    ) {
      const value = banned[id];

      if (
        value === true ||
        value === 1 ||
        value === "true"
      ) {
        return true;
      }

      if (
        value &&
        typeof value === "object"
      ) {
        if (value.banned !== false) {
          return true;
        }
      }
    }
  } catch (e) {}

  // global.data.threadBanned
  try {
    if (
      global.data &&
      global.data.threadBanned
    ) {
      const bannedMap =
        global.data.threadBanned;

      if (
        typeof bannedMap.has === "function" &&
        bannedMap.has(id)
      ) {
        return true;
      }

      if (
        typeof bannedMap.get === "function" &&
        bannedMap.get(id)
      ) {
        return true;
      }
    }
  } catch (e) {}

  return false;
}

// ======================================================
// حظر المجموعة
// ======================================================

function banGroup(threadID) {
  const id = String(threadID);

  const banned = readJSON(
    BANNED_FILE,
    {}
  );

  banned[id] = {
    banned: true,
    reason: "حظر بواسطة أمر لاست",
    time: Date.now()
  };

  const saved = writeJSON(
    BANNED_FILE,
    banned
  );

  if (!saved) {
    return false;
  }

  // تحديث الذاكرة
  try {
    if (
      global.data &&
      global.data.threadBanned &&
      typeof global.data.threadBanned.set === "function"
    ) {
      global.data.threadBanned.set(
        id,
        true
      );
    }
  } catch (e) {}

  return true;
}

// ======================================================
// إلغاء الحظر
// ======================================================

function unbanGroup(threadID) {
  const id = String(threadID);

  const banned = readJSON(
    BANNED_FILE,
    {}
  );

  if (
    Object.prototype.hasOwnProperty.call(
      banned,
      id
    )
  ) {
    delete banned[id];
  }

  const saved = writeJSON(
    BANNED_FILE,
    banned
  );

  if (!saved) {
    return false;
  }

  // تحديث الذاكرة
  try {
    if (
      global.data &&
      global.data.threadBanned &&
      typeof global.data.threadBanned.delete === "function"
    ) {
      global.data.threadBanned.delete(id);
    }
  } catch (e) {}

  return true;
}

// ======================================================
// إخراج البوت من المجموعة
// متوافق مع FCA القديمة والجديدة
// ======================================================

async function leaveGroup(api, threadID) {
  try {
    const botID =
      typeof api.getCurrentUserID === "function"
        ? api.getCurrentUserID()
        : null;

    if (!botID) {
      return false;
    }

    const groupID = String(threadID);

    return await new Promise(resolve => {
      let finished = false;

      const done = result => {
        if (finished) return;

        finished = true;
        resolve(result);
      };

      try {
        const result =
          api.removeUserFromGroup(
            botID,
            groupID,
            error => {
              done(!error);
            }
          );

        // بعض نسخ FCA قد تعيد Promise
        if (
          result &&
          typeof result.then === "function"
        ) {
          result
            .then(() => done(true))
            .catch(() => done(false));
        }
      } catch (error) {
        done(false);
      }
    });
  } catch (error) {
    return false;
  }
}

// ======================================================
// معالجة الرد
// ======================================================

module.exports.handleReply = async function({
  api,
  event,
  handleReply
}) {
  try {
    if (
      !isDeveloper(event.senderID)
    ) {
      return;
    }

    if (
      !handleReply ||
      handleReply.name !== "لاست" ||
      handleReply.type !== "groupList"
    ) {
      return;
    }

    const body =
      String(event.body || "").trim();

    if (!body) return;

    const args =
      body.split(/\s+/);

    const command =
      String(args[0] || "").toLowerCase();

    const number =
      parseInt(args[1], 10);

    const groupid =
      Array.isArray(handleReply.groupid)
        ? handleReply.groupid
        : [];

    // ----------------------------------------------
    // التحقق من الرقم
    // ----------------------------------------------

    if (
      !Number.isInteger(number) ||
      number < 1
    ) {
      return api.sendMessage(
`⌬ ━━━━━━━━━━━━ ⌬

⚠️ صيغة الأمر غير صحيحة.

استخدم:

حظر 1
الغاء_حظر 1
خروج 1

⌬ ━━━━━━━━━━━━ ⌬`,
        event.threadID,
        event.messageID
      );
    }

    const index = number - 1;
    const groupID = groupid[index];

    if (!groupID) {
      return api.sendMessage(
`⌬ ━━━━━━━━━━━━ ⌬

❌ رقم المجموعة غير موجود.

أرسل:
لاست

لإظهار القائمة من جديد.

⌬ ━━━━━━━━━━━━ ⌬`,
        event.threadID,
        event.messageID
      );
    }

    const header =
      `⌬ ━━━━━━━━━━━━ ⌬`;

    // ----------------------------------------------
    // حظر
    // ----------------------------------------------

    if (
      command === "حظر" ||
      command === "ban"
    ) {
      const success =
        banGroup(groupID);

      if (!success) {
        return api.sendMessage(
`${header}

❌ فشل حفظ الحظر.

⪼ ID:
${groupID}`,
          event.threadID,
          event.messageID
        );
      }

      return api.sendMessage(
`${header}

🔒 تم حظر المجموعة بنجاح.

⪼ ID:
${groupID}

لن يتمكن نظام البوت من استخدام المجموعة إذا كان يعتمد على banned.json.`,
        event.threadID,
        event.messageID
      );
    }

    // ----------------------------------------------
    // إلغاء الحظر
    // ----------------------------------------------

    if (
      command === "الغاء_حظر" ||
      command === "الغاء" ||
      command === "unban"
    ) {
      const success =
        unbanGroup(groupID);

      if (!success) {
        return api.sendMessage(
`${header}

❌ فشل حفظ إلغاء الحظر.

⪼ ID:
${groupID}`,
          event.threadID,
          event.messageID
        );
      }

      return api.sendMessage(
`${header}

🔓 تم إلغاء حظر المجموعة.

⪼ ID:
${groupID}`,
        event.threadID,
        event.messageID
      );
    }

    // ----------------------------------------------
    // خروج
    // ----------------------------------------------

    if (
      command === "خروج" ||
      command === "غادري" ||
      command === "leave"
    ) {
      const success =
        await leaveGroup(
          api,
          groupID
        );

      if (!success) {
        return api.sendMessage(
`${header}

❌ فشل خروج البوت من المجموعة.

⪼ ID:
${groupID}

قد تكون المجموعة غير متاحة أو نسخة FCA لا تسمح بالخروج بهذه الطريقة.`,
          event.threadID,
          event.messageID
        );
      }

      return api.sendMessage(
`${header}

✅ تم خروج البوت من المجموعة.

⪼ ID:
${groupID}`,
        event.threadID,
        event.messageID
      );
    }

    // ----------------------------------------------
    // أمر غير معروف
    // ----------------------------------------------

    return api.sendMessage(
`${header}

⚠️ الأمر غير معروف.

الأوامر المتاحة:

حظر 1
الغاء_حظر 1
خروج 1`,
      event.threadID,
      event.messageID
    );

  } catch (error) {
    return api.sendMessage(
`⌬ ━━━━━━━━━━━━ ⌬

❌ حدث خطأ أثناء تنفيذ الأمر.

${error.message}

⌬ ━━━━━━━━━━━━ ⌬`,
      event.threadID
    );
  }
};

// ======================================================
// تشغيل الأمر
// ======================================================

module.exports.run = async function({
  api,
  event
}) {
  try {
    // ----------------------------------------------
    // المطور فقط
    // ----------------------------------------------

    if (
      !isDeveloper(event.senderID)
    ) {
      return;
    }

    const header =
`⌬ ━━━━━━━━━━━━ ⌬
      ⚙️ قـائـمـة الـمـجـمـوعـات
⌬ ━━━━━━━━━━━━ ⌬`;

    // ----------------------------------------------
    // جلب المجموعات من ذاكرة البوت فقط
    // ----------------------------------------------

    let threadIDs =
      getKnownThreadIDs();

    threadIDs = [
      ...new Set(
        threadIDs.map(id => String(id))
      )
    ];

    // ----------------------------------------------
    // لا توجد مجموعات
    // ----------------------------------------------

    if (
      threadIDs.length === 0
    ) {
      return api.sendMessage(
`${header}

❌ لم أجد أي مجموعة مسجلة في ذاكرة البوت.

هذا الإصدار لا يستخدم:
getThreadList
Threads
MongoDB

إذا كان البوت داخل مجموعات، تأكد أن نظام البوت يضيف الـ threadID إلى:
global.data.allThreadID`,
        event.threadID
      );
    }

    // ----------------------------------------------
    // جلب معلومات المجموعات
    // ----------------------------------------------

    const groups = [];

    for (
      const threadID of threadIDs
    ) {
      const info =
        await getGroupInfo(
          api,
          threadID
        );

      groups.push({
        id: threadID,
        name: getGroupName(
          info,
          threadID
        ),
        members: getMemberCount(
          info
        ),
        banned: isBanned(
          threadID
        )
      });
    }

    // ----------------------------------------------
    // بناء القائمة
    // ----------------------------------------------

    let msg =
`${header}

📊 المجموعات المعروفة: ${groups.length}

`;

    const groupid = [];

    groups.forEach((group, index) => {
      groupid.push(group.id);

      const status =
        group.banned
          ? "🔒 محظورة"
          : "🟢 نشطة";

      msg +=
`${index + 1}. ${group.name}
⪼ الأعضاء: ${group.members}
⪼ الحالة: ${status}
⪼ ID: ${group.id}

`;
    });

    msg +=
`⌬ ━━━━━━━━━━━━ ⌬

💡 التحكم بالمجموعات:

• حظر 1
• الغاء_حظر 1
• خروج 1

مثال:

حظر 1
الغاء_حظر 1
خروج 1

⌬ ━━━━━━━━━━━━ ⌬`;

    // ----------------------------------------------
    // إرسال القائمة
    // ----------------------------------------------

    return api.sendMessage(
      msg,
      event.threadID,
      (error, info) => {
        if (error || !info) {
          return;
        }

        if (
          !global.client.handleReply
        ) {
          global.client.handleReply = [];
        }

        global.client.handleReply.push({
          name: "لاست",
          messageID: info.messageID,
          author: String(event.senderID),
          groupid,
          type: "groupList"
        });
      },
      event.messageID
    );

  } catch (error) {
    return api.sendMessage(
`⌬ ━━━━━━━━━━━━ ⌬

❌ فشل جلب المجموعات.

الخطأ:
${error.message}

⌬ ━━━━━━━━━━━━ ⌬`,
      event.threadID
    );
  }
};