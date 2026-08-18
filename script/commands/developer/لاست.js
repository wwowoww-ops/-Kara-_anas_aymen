const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "لاست",
  version: "3.0.0",
  credits: "أبو هريرة",
  hasPermssion: 2,
  description: "عرض المجموعات المعروفة للبوت والتحكم بها",
  commandCategory: "developer",
  usages: "لاست",
  cooldowns: 5
};

const DEV_ID = "61578581225040";
const DATA_DIR = path.join(process.cwd(), "data");
const BANNED_FILE = path.join(DATA_DIR, "banned.json");
const RESTRICT_FILE = path.join(DATA_DIR, "restrict.json");

fs.ensureDirSync(DATA_DIR);

// ======================================================
// أدوات
// ======================================================

function isDeveloper(senderID) {
  return String(senderID) === DEV_ID;
}

function readJSON(file, fallback = {}) {
  try {
    if (!fs.existsSync(file)) return fallback;

    const data = fs.readFileSync(file, "utf8");

    if (!data.trim()) return fallback;

    return JSON.parse(data);
  } catch (e) {
    console.error(`LASt JSON ERROR: ${file}`, e);
    return fallback;
  }
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(
      file,
      JSON.stringify(data, null, 2),
      "utf8"
    );

    return true;
  } catch (e) {
    console.error(`LASt WRITE ERROR: ${file}`, e);
    return false;
  }
}

function getThreadIDs(Threads) {
  const ids = new Set();

  // ----------------------------------------------------
  // global.data.allThreadID
  // ----------------------------------------------------

  try {
    if (
      global.data &&
      Array.isArray(global.data.allThreadID)
    ) {
      for (const id of global.data.allThreadID) {
        if (id) ids.add(String(id));
      }
    }
  } catch (e) {}

  // ----------------------------------------------------
  // global.data.threadData
  // ----------------------------------------------------

  try {
    if (
      global.data &&
      global.data.threadData
    ) {
      const threadData = global.data.threadData;

      if (threadData instanceof Map) {
        for (const id of threadData.keys()) {
          if (id) ids.add(String(id));
        }
      } else if (
        typeof threadData === "object"
      ) {
        for (const id of Object.keys(threadData)) {
          if (id) ids.add(String(id));
        }
      }
    }
  } catch (e) {}

  // ----------------------------------------------------
  // Threads.database
  // ----------------------------------------------------

  try {
    if (
      Threads &&
      Threads.database
    ) {
      const database = Threads.database;

      if (database instanceof Map) {
        for (const id of database.keys()) {
          if (id) ids.add(String(id));
        }
      } else if (
        typeof database === "object"
      ) {
        for (const id of Object.keys(database)) {
          if (id) ids.add(String(id));
        }
      }
    }
  } catch (e) {}

  return [...ids];
}

// ======================================================
// جلب معلومات المجموعة
// ======================================================

async function getGroupInfo(api, Threads, threadID) {

  // أولًا Threads
  try {
    if (
      Threads &&
      typeof Threads.getInfo === "function"
    ) {
      const info =
        await Threads.getInfo(threadID);

      if (info) {
        return info;
      }
    }
  } catch (e) {}

  // ثانيًا Threads.getData
  try {
    if (
      Threads &&
      typeof Threads.getData === "function"
    ) {
      const result =
        await Threads.getData(threadID);

      if (result) {
        const data =
          result.data || result;

        if (
          data &&
          (
            data.threadName ||
            data.name ||
            data.participantIDs
          )
        ) {
          return data;
        }
      }
    }
  } catch (e) {}

  // أخيرًا API
  try {
    if (
      api &&
      typeof api.getThreadInfo === "function"
    ) {
      return await api.getThreadInfo(threadID);
    }
  } catch (e) {}

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
// هل المجموعة محظورة؟
// ======================================================

function isBanned(threadID) {

  const id = String(threadID);

  // banned.json
  const banned =
    readJSON(BANNED_FILE, {});

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
      typeof value === "object" &&
      value.banned !== false
    ) {
      return true;
    }
  }

  // global.data.threadBanned
  try {
    if (
      global.data &&
      global.data.threadBanned
    ) {
      if (
        typeof global.data.threadBanned.has ===
        "function" &&
        global.data.threadBanned.has(id)
      ) {
        return true;
      }

      if (
        typeof global.data.threadBanned.get ===
        "function" &&
        global.data.threadBanned.get(id)
      ) {
        return true;
      }
    }
  } catch (e) {}

  return false;
}

// ======================================================
// حظر
// ======================================================

async function banGroup(threadID) {

  const id = String(threadID);

  const banned =
    readJSON(BANNED_FILE, {});

  banned[id] = {
    banned: true,
    reason: "حظر بواسطة أمر لاست",
    time: Date.now()
  };

  writeJSON(
    BANNED_FILE,
    banned
  );

  // تحديث global
  try {
    if (
      global.data &&
      global.data.threadBanned
    ) {
      if (
        typeof global.data.threadBanned.set ===
        "function"
      ) {
        global.data.threadBanned.set(
          id,
          true
        );
      }
    }
  } catch (e) {}

  return true;
}

// ======================================================
// إلغاء الحظر
// ======================================================

async function unbanGroup(threadID) {

  const id = String(threadID);

  const banned =
    readJSON(BANNED_FILE, {});

  if (
    Object.prototype.hasOwnProperty.call(
      banned,
      id
    )
  ) {
    delete banned[id];
  }

  writeJSON(
    BANNED_FILE,
    banned
  );

  // تحديث global
  try {
    if (
      global.data &&
      global.data.threadBanned
    ) {
      if (
        typeof global.data.threadBanned.delete ===
        "function"
      ) {
        global.data.threadBanned.delete(id);
      }
    }
  } catch (e) {}

  return true;
}

// ======================================================
// خروج البوت
// ======================================================

async function leaveGroup(api, threadID) {

  const botID =
    api.getCurrentUserID();

  return new Promise(resolve => {

    try {

      api.removeUserFromGroup(
        botID,
        String(threadID),
        err => {

          if (err) {
            console.error(
              "LASt LEAVE ERROR:",
              err
            );

            resolve(false);
            return;
          }

          resolve(true);
        }
      );

    } catch (e) {

      console.error(
        "LASt LEAVE EXCEPTION:",
        e
      );

      resolve(false);
    }
  });
}

// ======================================================
// Reply
// ======================================================

module.exports.handleReply = async function ({
  api,
  event,
  Threads,
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
      String(event.body || "")
        .trim();

    if (!body) return;

    const args =
      body.split(/\s+/);

    const command =
      String(args[0] || "")
        .toLowerCase();

    const number =
      parseInt(args[1], 10);

    if (
      !Number.isInteger(number) ||
      number < 1
    ) {

      return api.sendMessage(
`⌬ ━━━━━━━━━━━━ ⌬

⚠️ استخدم رقم المجموعة.

مثال:
حظر 1
الغاء_حظر 1
خروج 1

⌬ ━━━━━━━━━━━━ ⌬`,
        event.threadID,
        event.messageID
      );
    }

    const index =
      number - 1;

    const groupid =
      handleReply.groupid || [];

    const idgr =
      groupid[index];

    if (!idgr) {

      return api.sendMessage(
`⌬ ━━━━━━━━━━━━ ⌬

❌ رقم المجموعة غير صحيح.

استخدم:
لاست

⌬ ━━━━━━━━━━━━ ⌬`,
        event.threadID,
        event.messageID
      );
    }

    const header =
      `⌬ ━━━━━━━━━━━━ ⌬`;

    // ==================================================
    // حظر
    // ==================================================

    if (
      command === "حظر" ||
      command === "ban"
    ) {

      await banGroup(idgr);

      return api.sendMessage(
`${header}

✅ تم حظر المجموعة.

⪼ ID:
${idgr}

🔒 لن يتمكن البوت من استخدامها إذا كان نظام الحظر في البوت يعتمد على banned.json.`,
        event.threadID,
        event.messageID
      );
    }

    // ==================================================
    // إلغاء الحظر
    // ==================================================

    if (
      command === "الغاء_حظر" ||
      command === "الغاء" ||
      command === "unban"
    ) {

      await unbanGroup(idgr);

      return api.sendMessage(
`${header}

✅ تم إلغاء حظر المجموعة.

⪼ ID:
${idgr}`,
        event.threadID,
        event.messageID
      );
    }

    // ==================================================
    // خروج
    // ==================================================

    if (
      command === "خروج" ||
      command === "غادري" ||
      command === "leave"
    ) {

      const success =
        await leaveGroup(
          api,
          idgr
        );

      if (!success) {

        return api.sendMessage(
`${header}

❌ فشل خروج البوت من المجموعة.

⪼ ID:
${idgr}

قد لا يكون البوت مشرفًا في المجموعة.`,
          event.threadID,
          event.messageID
        );
      }

      return api.sendMessage(
`${header}

✅ تم خروج البوت من المجموعة.

⪼ ID:
${idgr}`,
        event.threadID,
        event.messageID
      );
    }

    return api.sendMessage(
`${header}

⚠️ أمر غير معروف.

الأوامر المتاحة:

حظر 1
الغاء_حظر 1
خروج 1`,
      event.threadID,
      event.messageID
    );

  } catch (error) {

    console.error(
      "LASt HANDLE ERROR:",
      error
    );

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
// RUN
// ======================================================

module.exports.run = async function ({
  api,
  event,
  Threads
}) {

  try {

    if (
      !isDeveloper(event.senderID)
    ) {
      return;
    }

    const header =
`⌬ ━━━━━━━━━━━━ ⌬
      ⚙️ قـائـمـة الـمـجـمـوعـات
⌬ ━━━━━━━━━━━━ ⌬`;

    // ==================================================
    // جمع IDs بدون getThreadList
    // ==================================================

    let threadIDs =
      getThreadIDs(Threads);

    // إزالة التكرار
    threadIDs =
      [...new Set(
        threadIDs.map(id => String(id))
      )];

    // ==================================================
    // إضافة المجموعات المحظورة
    // ==================================================

    const banned =
      readJSON(BANNED_FILE, {});

    for (const id of Object.keys(banned)) {

      if (
        !threadIDs.includes(String(id))
      ) {
        threadIDs.push(
          String(id)
        );
      }
    }

    // ==================================================
    // إذا لم يجد أي مجموعات
    // ==================================================

    if (!threadIDs.length) {

      return api.sendMessage(
`${header}

❌ لم أجد أي مجموعات مسجلة في بيانات البوت.

هذا الإصدار لا يستخدم:
getThreadList()

إذا كان البوت يعمل في مجموعات، أرسل أمر "لاست" مرة أخرى بعد دخول البوت إلى مجموعة أو بعد إعادة تشغيله.`,
        event.threadID
      );
    }

    // ==================================================
    // بناء القائمة
    // ==================================================

    const groups = [];

    for (
      let i = 0;
      i < threadIDs.length;
      i++
    ) {

      const id =
        threadIDs[i];

      const info =
        await getGroupInfo(
          api,
          Threads,
          id
        );

      const name =
        getGroupName(
          info,
          id
        );

      const members =
        getMemberCount(
          info
        );

      const bannedStatus =
        isBanned(id);

      groups.push({
        id,
        name,
        members,
        banned: bannedStatus
      });
    }

    // ==================================================
    // القائمة
    // ==================================================

    let msg =
`${header}

📊 المجموعات المعروفة للبوت: ${groups.length}

`;

    const groupid = [];

    for (
      let i = 0;
      i < groups.length;
      i++
    ) {

      const g =
        groups[i];

      groupid.push(
        g.id
      );

      const status =
        g.banned
          ? "🔒 محظورة"
          : "🟢 نشطة";

      msg +=
`${i + 1}. ${g.name}
⪼ الأعضاء: ${g.members}
⪼ الحالة: ${status}
⪼ ID: ${g.id}

`;
    }

    msg +=
`⌬ ━━━━━━━━━━━━ ⌬
💡 التحكم:

• حظر [رقم]
• الغاء_حظر [رقم]
• خروج [رقم]

مثال:
حظر 1
الغاء_حظر 1
خروج 1

⌬ ━━━━━━━━━━━━ ⌬`;

    // ==================================================
    // إرسال القائمة وتسجيل Reply
    // ==================================================

    return api.sendMessage(
      msg,
      event.threadID,
      (err, info) => {

        if (err) {

          console.error(
            "LASt SEND ERROR:",
            err
          );

          return;
        }

        if (
          !global.client.handleReply
        ) {
          global.client.handleReply = [];
        }

        global.client.handleReply.push({

          name: "لاست",

          messageID:
            info.messageID,

          author:
            String(event.senderID),

          groupid,

          type:
            "groupList"
        });

      },
      event.messageID
    );

  } catch (error) {

    console.error(
      "❌ LASt ERROR:",
      error
    );

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