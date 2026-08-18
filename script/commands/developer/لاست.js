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

const DEV_ID = "61578581225040";

const DATA_DIR = path.join(process.cwd(), "data");
const BANNED_FILE = path.join(DATA_DIR, "banned.json");

fs.ensureDirSync(DATA_DIR);

// ======================================================
// JSON
// ======================================================

function readJSON(file, fallback = {}) {
  try {
    if (!fs.existsSync(file)) return fallback;

    const content = fs.readFileSync(file, "utf8").trim();

    if (!content) return fallback;

    return JSON.parse(content);
  } catch (error) {
    console.error("LASt READ JSON ERROR:", error);
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
  } catch (error) {
    console.error("LASt WRITE JSON ERROR:", error);
    return false;
  }
}

// ======================================================
// المطور
// ======================================================

function isDeveloper(senderID) {
  return String(senderID) === DEV_ID;
}

// ======================================================
// جمع كل IDs التي يعرفها البوت
// ======================================================

function collectThreadIDs(Threads) {

  const ids = new Set();

  // global.data.allThreadID
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

  // global.data.threadData
  try {
    if (
      global.data &&
      global.data.threadData
    ) {

      const data = global.data.threadData;

      if (data instanceof Map) {

        for (const id of data.keys()) {
          if (id) ids.add(String(id));
        }

      } else if (
        typeof data === "object"
      ) {

        for (const id of Object.keys(data)) {
          if (id) ids.add(String(id));
        }
      }
    }
  } catch (e) {}

  // Threads.database
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

  // Threads.getAll
  // بعض نسخ FCA/KIRA تحتوي على هذه الدالة
  try {
    if (
      Threads &&
      typeof Threads.getAll === "function"
    ) {

      // لا نستطيع انتظار async هنا،
      // لذلك سيتم التعامل معها في الدالة الرئيسية.
    }
  } catch (e) {}

  return [...ids];
}

// ======================================================
// التحقق من المجموعة
// ======================================================

async function getRealThreadInfo(api, threadID) {

  try {

    if (
      !api ||
      typeof api.getThreadInfo !== "function"
    ) {
      return null;
    }

    const info =
      await api.getThreadInfo(String(threadID));

    if (
      !info ||
      typeof info !== "object"
    ) {
      return null;
    }

    /*
     * إذا كانت FCA أعادت معلومات المجموعة بشكل صحيح
     * فهذا يعني أن البوت ما زال قادرًا على الوصول إليها.
     */

    return info;

  } catch (error) {

    // المجموعة لم تعد متاحة للبوت
    return null;
  }
}

// ======================================================
// اسم المجموعة
// ======================================================

function getGroupName(info, id) {

  if (!info) {
    return `مجموعة ${id}`;
  }

  return (
    info.threadName ||
    info.name ||
    info.title ||
    `مجموعة ${id}`
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
// حالة الحظر
// ======================================================

function isBanned(threadID) {

  const id = String(threadID);

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

function banGroup(threadID) {

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

  try {

    if (
      global.data &&
      global.data.threadBanned &&
      typeof global.data.threadBanned.set ===
      "function"
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

  try {

    if (
      global.data &&
      global.data.threadBanned &&
      typeof global.data.threadBanned.delete ===
      "function"
    ) {

      global.data.threadBanned.delete(id);
    }

  } catch (e) {}

  return true;
}

// ======================================================
// خروج البوت
// ======================================================

async function leaveGroup(api, threadID) {

  const id = String(threadID);

  const botID =
    api.getCurrentUserID();

  try {

    /*
     * أولاً رسالة الوداع داخل المجموعة
     */

    await api.sendMessage(
      "المطور ابو هريرة يأمرني بالخروج\nاعتذر وداعا",
      id
    );

    /*
     * انتظار بسيط حتى يتم إرسال الرسالة
     */

    await new Promise(resolve =>
      setTimeout(resolve, 700)
    );

    /*
     * بعد ذلك يخرج البوت
     */

    return await new Promise(resolve => {

      api.removeUserFromGroup(
        botID,
        id,
        error => {

          if (error) {

            console.error(
              "LASt LEAVE ERROR:",
              error
            );

            resolve(false);
            return;
          }

          resolve(true);
        }
      );

    });

  } catch (error) {

    console.error(
      "LASt LEAVE EXCEPTION:",
      error
    );

    return false;
  }
}

// ======================================================
// HANDLE REPLY
// ======================================================

module.exports.handleReply = async function ({
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

    if (
      !Number.isInteger(number) ||
      number < 1
    ) {

      return api.sendMessage(
`⌬ ━━━━━━━━━━━━ ⌬

⚠️ استخدم الأمر بهذا الشكل:

حظر 1
الغاء_حظر 1
خروج 1

⌬ ━━━━━━━━━━━━ ⌬`,
        event.threadID,
        event.messageID
      );
    }

    const groupid =
      handleReply.groupid || [];

    const idgr =
      groupid[number - 1];

    if (!idgr) {

      return api.sendMessage(
`⌬ ━━━━━━━━━━━━ ⌬

❌ رقم المجموعة غير صحيح.

استخدم:
لاست

⌬ ━━━━━━━━━━━━ ⌃`,
        event.threadID,
        event.messageID
      );
    }

    const header =
      "⌬ ━━━━━━━━━━━━ ⌬";

    // ==================================================
    // حظر
    // ==================================================

    if (
      command === "حظر" ||
      command === "ban"
    ) {

      banGroup(idgr);

      return api.sendMessage(
`${header}

✅ تم حظر المجموعة.

⪼ ID:
${idgr}

🔒 تم حفظ الحظر.`,
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

      unbanGroup(idgr);

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

      /*
       * إرسال رسالة للمطور أولاً
       */

      await api.sendMessage(
        "⏳ جاري إرسال رسالة الوداع ثم الخروج...",
        event.threadID,
        event.messageID
      );

      const success =
        await leaveGroup(
          api,
          idgr
        );

      if (!success) {

        return api.sendMessage(
`${header}

❌ فشل خروج البوت.

⪼ ID:
${idgr}

قد لا يكون البوت مشرفًا أو أن المجموعة لم تعد متاحة.`,
          event.threadID,
          event.messageID
        );
      }

      /*
       * إزالة المجموعة القديمة من
       * global.data.allThreadID
       * حتى لا تظهر مجددًا في لاست.
       */

      try {

        if (
          global.data &&
          Array.isArray(global.data.allThreadID)
        ) {

          global.data.allThreadID =
            global.data.allThreadID.filter(
              id =>
                String(id) !==
                String(idgr)
            );
        }

      } catch (e) {}

      return api.sendMessage(
`${header}

✅ تم الخروج من المجموعة.

⪼ ID:
${idgr}`,
        event.threadID,
        event.messageID
      );
    }

    return api.sendMessage(
`${header}

⚠️ أمر غير معروف.

الأوامر:

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

    /*
     * جمع IDs من أكثر من مصدر
     */

    let threadIDs =
      collectThreadIDs(Threads);

    /*
     * محاولة الحصول على كل المجموعات
     * المسجلة في Threads.getAll إن كانت
     * النسخة الحالية تدعمها.
     */

    try {

      if (
        Threads &&
        typeof Threads.getAll ===
        "function"
      ) {

        const all =
          await Threads.getAll();

        if (Array.isArray(all)) {

          for (const item of all) {

            const id =
              item.threadID ||
              item.id ||
              item._id;

            if (id) {
              threadIDs.push(
                String(id)
              );
            }
          }
        }
      }

    } catch (e) {
      console.log(
        "LASt Threads.getAll skipped:",
        e.message
      );
    }

    /*
     * إزالة التكرار
     */

    threadIDs =
      [...new Set(
        threadIDs.map(id =>
          String(id)
        )
      )];

    /*
     * إضافة المجموعات المحظورة
     * فقط حتى يمكن التحكم بها.
     */

    const banned =
      readJSON(BANNED_FILE, {});

    for (
      const id of Object.keys(banned)
    ) {

      if (
        !threadIDs.includes(String(id))
      ) {

        threadIDs.push(
          String(id)
        );
      }
    }

    if (!threadIDs.length) {

      return api.sendMessage(
`${header}

❌ لا توجد مجموعات مسجلة في بيانات البوت.`,
        event.threadID
      );
    }

    /*
     * التحقق الحقيقي من كل مجموعة
     *
     * إذا getThreadInfo فشل:
     * لا نعرض المجموعة لأنها غالبًا
     * لم تعد متاحة للبوت.
     */

    const groups = [];

    for (
      const id of threadIDs
    ) {

      const info =
        await getRealThreadInfo(
          api,
          id
        );

      /*
       * إذا لم نستطع الوصول للمجموعة
       * وكانت غير محظورة، نتجاهلها.
       */

      if (!info) {

        if (!isBanned(id)) {
          continue;
        }

        /*
         * المجموعة محظورة:
         * نحتفظ بها حتى يستطيع المطور
         * إلغاء حظرها.
         */

        groups.push({
          id,
          name: `مجموعة ${id}`,
          members: "?",
          banned: true
        });

        continue;
      }

      const name =
        getGroupName(
          info,
          id
        );

      const members =
        getMemberCount(
          info
        );

      groups.push({
        id,
        name,
        members,
        banned: isBanned(id)
      });
    }

    if (!groups.length) {

      return api.sendMessage(
`${header}

❌ لم أجد مجموعات متاحة حاليًا.

المجموعات التي خرج منها البوت لن تظهر بعد الآن.`,
        event.threadID
      );
    }

    /*
     * إنشاء القائمة
     */

    let msg =
`${header}

📊 المجموعات المتاحة للبوت: ${groups.length}

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

    /*
     * إرسال القائمة
     */

    return api.sendMessage(
      msg,
      event.threadID,
      (error, info) => {

        if (error) {

          console.error(
            "LASt SEND ERROR:",
            error
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
      "LASt ERROR:",
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