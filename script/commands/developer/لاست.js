const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "لاست",
  version: "5.0.0",
  credits: "أبو هريرة",
  hasPermssion: 2,
  description: "عرض المجموعات المعروفة للبوت والتحكم بها وتنظيف المحادثات القديمة",
  commandCategory: "developer",
  usages: "لاست",
  cooldowns: 5
};

const DEV_ID = "61578581225040";

const DATA_DIR = path.join(process.cwd(), "data");

const BANNED_FILE =
  path.join(DATA_DIR, "banned.json");

const LEFT_THREADS_FILE =
  path.join(DATA_DIR, "leftThreads.json");

fs.ensureDirSync(DATA_DIR);

// ======================================================
// JSON
// ======================================================

function readJSON(file, fallback = {}) {
  try {

    if (!fs.existsSync(file)) {
      return fallback;
    }

    const content =
      fs.readFileSync(file, "utf8").trim();

    if (!content) {
      return fallback;
    }

    return JSON.parse(content);

  } catch (error) {

    console.error(
      "LASt READ JSON ERROR:",
      error
    );

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

    console.error(
      "LASt WRITE JSON ERROR:",
      error
    );

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

  // ==================================================
  // global.data.allThreadID
  // ==================================================

  try {

    if (
      global.data &&
      Array.isArray(
        global.data.allThreadID
      )
    ) {

      for (
        const id of global.data.allThreadID
      ) {

        if (id) {
          ids.add(
            String(id)
          );
        }
      }
    }

  } catch (e) {}

  // ==================================================
  // global.data.threadData
  // ==================================================

  try {

    if (
      global.data &&
      global.data.threadData
    ) {

      const data =
        global.data.threadData;

      if (
        data instanceof Map
      ) {

        for (
          const id of data.keys()
        ) {

          if (id) {
            ids.add(
              String(id)
            );
          }
        }

      } else if (
        typeof data === "object"
      ) {

        for (
          const id of Object.keys(data)
        ) {

          if (id) {
            ids.add(
              String(id)
            );
          }
        }
      }
    }

  } catch (e) {}

  // ==================================================
  // Threads.database
  // ==================================================

  try {

    if (
      Threads &&
      Threads.database
    ) {

      const database =
        Threads.database;

      if (
        database instanceof Map
      ) {

        for (
          const id of database.keys()
        ) {

          if (id) {
            ids.add(
              String(id)
            );
          }
        }

      } else if (
        typeof database === "object"
      ) {

        for (
          const id of Object.keys(database)
        ) {

          if (id) {
            ids.add(
              String(id)
            );
          }
        }
      }
    }

  } catch (e) {}

  return [
    ...ids
  ];
}

// ======================================================
// قراءة المحادثات التي خرج منها البوت
// ======================================================

function getLeftThreads() {

  const data =
    readJSON(
      LEFT_THREADS_FILE,
      {}
    );

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {

    return {};
  }

  return data;
}

// ======================================================
// تسجيل محادثة قديمة
// ======================================================

function saveLeftThread(
  threadID,
  info = {}
) {

  const id =
    String(threadID);

  const data =
    getLeftThreads();

  data[id] = {

    threadID: id,

    name:
      info.threadName ||
      info.name ||
      info.title ||
      `مجموعة ${id}`,

    status:
      "unavailable",

    time:
      Date.now()
  };

  return writeJSON(
    LEFT_THREADS_FILE,
    data
  );
}

// ======================================================
// حذف ID من سجل المحادثات القديمة
// ======================================================

function removeLeftThread(
  threadID
) {

  const id =
    String(threadID);

  const data =
    getLeftThreads();

  if (
    Object.prototype.hasOwnProperty.call(
      data,
      id
    )
  ) {

    delete data[id];

    return writeJSON(
      LEFT_THREADS_FILE,
      data
    );
  }

  return true;
}

// ======================================================
// حالة الحظر
// ======================================================

function isBanned(threadID) {

  const id =
    String(threadID);

  const banned =
    readJSON(
      BANNED_FILE,
      {}
    );

  if (
    Object.prototype.hasOwnProperty.call(
      banned,
      id
    )
  ) {

    const value =
      banned[id];

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

  const id =
    String(threadID);

  const banned =
    readJSON(
      BANNED_FILE,
      {}
    );

  banned[id] = {

    banned: true,

    reason:
      "حظر بواسطة أمر لاست",

    time:
      Date.now()
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

  const id =
    String(threadID);

  const banned =
    readJSON(
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

      global.data.threadBanned.delete(
        id
      );
    }

  } catch (e) {}

  return true;
}

// ======================================================
// التحقق من المجموعة
// ======================================================

async function getRealThreadInfo(
  api,
  threadID
) {

  try {

    if (
      !api ||
      typeof api.getThreadInfo !==
        "function"
    ) {

      return null;
    }

    const info =
      await api.getThreadInfo(
        String(threadID)
      );

    if (
      !info ||
      typeof info !== "object"
    ) {

      return null;
    }

    return info;

  } catch (error) {

    return null;
  }
}

// ======================================================
// اسم المجموعة
// ======================================================

function getGroupName(
  info,
  id
) {

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

  if (!info) {
    return "?";
  }

  if (
    Array.isArray(
      info.participantIDs
    )
  ) {

    return info.participantIDs.length;
  }

  if (
    Array.isArray(
      info.participants
    )
  ) {

    return info.participants.length;
  }

  return "?";
}

// ======================================================
// إزالة ID من allThreadID
// ======================================================

function removeFromKnownThreads(
  threadID
) {

  const id =
    String(threadID);

  try {

    if (
      global.data &&
      Array.isArray(
        global.data.allThreadID
      )
    ) {

      global.data.allThreadID =
        global.data.allThreadID.filter(
          item =>
            String(item) !== id
        );
    }

  } catch (e) {}
}

// ======================================================
// خروج البوت
// ======================================================

async function leaveGroup(
  api,
  threadID
) {

  const id =
    String(threadID);

  const botID =
    api.getCurrentUserID();

  try {

    // ----------------------------------------------
    // رسالة الوداع
    // ----------------------------------------------

    await api.sendMessage(
      "المطور ابو هريرة يأمرني بالخروج\nاعتذر وداعا",
      id
    );

    // ----------------------------------------------
    // انتظار إرسال الرسالة
    // ----------------------------------------------

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          700
        )
    );

    // ----------------------------------------------
    // خروج البوت
    // ----------------------------------------------

    return await new Promise(
      resolve => {

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

      }
    );

  } catch (error) {

    console.error(
      "LASt LEAVE EXCEPTION:",
      error
    );

    return false;
  }
}

// ======================================================
// حذف محادثة
// ======================================================

async function deleteThread(
  api,
  threadID
) {

  if (
    !api ||
    typeof api.deleteThread !==
      "function"
  ) {

    return {

      success: false,

      error:
        "api.deleteThread غير متوفرة في نسخة API الحالية"
    };
  }

  const id =
    String(threadID);

  try {

    /*
     * محاولة callback
     */

    const result =
      await new Promise(
        resolve => {

          let finished = false;

          const done =
            error => {

              if (finished) {
                return;
              }

              finished = true;

              resolve({
                callback: true,
                error
              });
            };

          try {

            const returned =
              api.deleteThread(
                id,
                done
              );

            /*
             * بعض النسخ تعيد Promise
             */

            if (
              returned &&
              typeof returned.then ===
                "function"
            ) {

              returned
                .then(() => {

                  if (!finished) {

                    finished = true;

                    resolve({
                      callback: true,
                      error: null
                    });
                  }

                })
                .catch(error => {

                  if (!finished) {

                    finished = true;

                    resolve({
                      callback: true,
                      error
                    });
                  }

                });
            }

          } catch (error) {

            if (!finished) {

              finished = true;

              resolve({
                callback: true,
                error
              });
            }
          }

          /*
           * حماية من API لا يستعمل callback
           */

          setTimeout(
            () => {

              if (!finished) {

                finished = true;

                resolve({
                  callback: false,
                  error: null
                });
              }

            },
            5000
          );

        }
      );

    if (!result.error) {

      return {
        success: true
      };
    }

    return {

      success: false,

      error:
        result.error?.message ||
        String(result.error)
    };

  } catch (error) {

    return {

      success: false,

      error:
        error?.message ||
        String(error)
    };
  }
}

// ======================================================
// تنظيف محادثة واحدة
// ======================================================

async function cleanThread(
  api,
  threadID
) {

  const id =
    String(threadID);

  /*
   * نتأكد أولًا أن المحادثة
   * لم تعد متاحة للبوت
   */

  const info =
    await getRealThreadInfo(
      api,
      id
    );

  if (info) {

    return {

      success: false,

      active: true,

      error:
        "البوت ما زال قادرًا على الوصول إلى هذه المجموعة"
    };
  }

  /*
   * المحادثة غير متاحة
   * لذلك نحاول حذفها
   */

  const result =
    await deleteThread(
      api,
      id
    );

  if (!result.success) {

    return {

      success: false,

      active: false,

      error:
        result.error
    };
  }

  /*
   * نجح الحذف
   */

  removeLeftThread(id);

  removeFromKnownThreads(id);

  return {

    success: true,

    active: false
  };
}

// ======================================================
// HANDLE REPLY
// ======================================================

module.exports.handleReply =
async function ({
  api,
  event,
  handleReply
}) {

  try {

    if (
      !isDeveloper(
        event.senderID
      )
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
      String(
        event.body || ""
      ).trim();

    if (!body) {
      return;
    }

    const args =
      body.split(/\s+/);

    const command =
      String(
        args[0] || ""
      ).toLowerCase();

    const number =
      parseInt(
        args[1],
        10
      );

    const header =
      "⌬ ━━━━━━━━━━━━ ⌬";

    // ==================================================
    // تنظيف الكل
    // ==================================================

    if (
      command === "تنظيف_الكل" ||
      command === "تنظيفالكل" ||
      command === "cleanall"
    ) {

      const leftThreads =
        getLeftThreads();

      const ids =
        Object.keys(
          leftThreads
        );

      if (!ids.length) {

        return api.sendMessage(
`${header}

✅ لا توجد محادثات قديمة لتنظيفها.`,
          event.threadID,
          event.messageID
        );
      }

      await api.sendMessage(
`${header}

⏳ جاري تنظيف المحادثات القديمة...

عدد المحادثات:
${ids.length}`,
        event.threadID,
        event.messageID
      );

      let success =
        0;

      let failed =
        0;

      for (
        const id of ids
      ) {

        const result =
          await cleanThread(
            api,
            id
          );

        if (
          result.success
        ) {

          success++;

        } else {

          failed++;
        }

        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              300
            )
        );
      }

      return api.sendMessage(
`${header}

✅ انتهى التنظيف.

🗑️ تم حذف:
${success}

❌ فشل:
${failed}`,
        event.threadID
      );
    }

    // ==================================================
    // التحقق من الرقم
    // ==================================================

    if (
      !Number.isInteger(number) ||
      number < 1
    ) {

      return api.sendMessage(
`${header}

⚠️ استخدم الأمر بهذا الشكل:

حظر 1
الغاء_حظر 1
خروج 1
تنظيف 1

أو:

تنظيف_الكل

⌬ ━━━━━━━━━━━━ ⌬`,
        event.threadID,
        event.messageID
      );
    }

    const groupid =
      handleReply.groupid || [];

    const groupStatus =
      handleReply.groupStatus || {};

    const idgr =
      groupid[number - 1];

    if (!idgr) {

      return api.sendMessage(
`${header}

❌ رقم المجموعة غير صحيح.

استخدم:
لاست`,
        event.threadID,
        event.messageID
      );
    }

    // ==================================================
    // حظر
    // ==================================================

    if (
      command === "حظر" ||
      command === "ban"
    ) {

      banGroup(
        idgr
      );

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

      unbanGroup(
        idgr
      );

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
       * تسجيل المجموعة قبل إزالتها
       */

      saveLeftThread(
        idgr,
        {
          threadName:
            groupStatus[idgr]?.name ||
            `مجموعة ${idgr}`
        }
      );

      /*
       * إزالة المجموعة من القائمة المعروفة
       */

      removeFromKnownThreads(
        idgr
      );

      return api.sendMessage(
`${header}

✅ تم الخروج من المجموعة.

⪼ ID:
${idgr}

🗑️ أصبحت المحادثة متاحة للتنظيف.

استخدم:
تنظيف ${number}`,
        event.threadID,
        event.messageID
      );
    }

    // ==================================================
    // تنظيف
    // ==================================================

    if (
      command === "تنظيف" ||
      command === "clean"
    ) {

      /*
       * إذا كانت المجموعة ما زالت متاحة
       * نمنع حذفها
       */

      const result =
        await cleanThread(
          api,
          idgr
        );

      if (
        result.active
      ) {

        return api.sendMessage(
`${header}

⚠️ لا يمكن تنظيف هذه المحادثة.

البوت ما زال قادرًا على الوصول إلى المجموعة.

⪼ ID:
${idgr}`,
          event.threadID,
          event.messageID
        );
      }

      if (
        !result.success
      ) {

        return api.sendMessage(
`${header}

❌ فشل تنظيف المحادثة.

⪼ ID:
${idgr}

الخطأ:
${result.error || "خطأ غير معروف"}

يمكنك المحاولة مرة أخرى.`,
          event.threadID,
          event.messageID
        );
      }

      return api.sendMessage(
`${header}

✅ تم تنظيف المحادثة بنجاح.

⪼ ID:
${idgr}

🗑️ تم حذفها من محادثات حساب البوت.`,
        event.threadID,
        event.messageID
      );
    }

    // ==================================================
    // أمر غير معروف
    // ==================================================

    return api.sendMessage(
`${header}

⚠️ أمر غير معروف.

الأوامر:

حظر 1
الغاء_حظر 1
خروج 1
تنظيف 1

أو:

تنظيف_الكل`,
      event.threadID,
      event.messageID
    );

  } catch (error) {

    console.error(
      "LASt HANDLE ERROR:",
      error
    );

    return api.sendMessage(
`${header}

❌ حدث خطأ أثناء تنفيذ الأمر.

${error.message}`,
      event.threadID
    );
  }
};

// ======================================================
// RUN
// ======================================================

module.exports.run =
async function ({
  api,
  event,
  Threads
}) {

  try {

    if (
      !isDeveloper(
        event.senderID
      )
    ) {

      return;
    }

    const header =
`⌬ ━━━━━━━━━━━━ ⌬
      ⚙️ قـائـمـة الـمـجـمـوعـات
⌬ ━━━━━━━━━━━━ ⌬`;

    // ==================================================
    // جمع IDs
    // ==================================================

    let threadIDs =
      collectThreadIDs(
        Threads
      );

    // ==================================================
    // Threads.getAll
    // ==================================================

    try {

      if (
        Threads &&
        typeof Threads.getAll ===
          "function"
      ) {

        const all =
          await Threads.getAll();

        if (
          Array.isArray(all)
        ) {

          for (
            const item of all
          ) {

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

    // ==================================================
    // إضافة المحادثات المسجلة قديمًا
    // ==================================================

    const leftThreads =
      getLeftThreads();

    for (
      const id of Object.keys(
        leftThreads
      )
    ) {

      threadIDs.push(
        String(id)
      );
    }

    // ==================================================
    // إضافة المحظورة
    // ==================================================

    const banned =
      readJSON(
        BANNED_FILE,
        {}
      );

    for (
      const id of Object.keys(
        banned
      )
    ) {

      threadIDs.push(
        String(id)
      );
    }

    // ==================================================
    // إزالة التكرار
    // ==================================================

    threadIDs =
      [
        ...new Set(
          threadIDs.map(
            id => String(id)
          )
        )
      ];

    if (!threadIDs.length) {

      return api.sendMessage(
`${header}

❌ لا توجد مجموعات مسجلة في بيانات البوت.`,
        event.threadID
      );
    }

    // ==================================================
    // فحص المجموعات
    // ==================================================

    const groups = [];

    for (
      const id of threadIDs
    ) {

      const info =
        await getRealThreadInfo(
          api,
          id
        );

      // ==================================================
      // المجموعة غير متاحة
      // ==================================================

      if (!info) {

        /*
         * نحفظها حتى تبقى ظاهرة
         * ويمكن تنظيفها يدويًا
         */

        saveLeftThread(
          id,
          leftThreads[id] || {}
        );

        const oldData =
          leftThreads[id] || {};

        groups.push({

          id,

          name:
            oldData.name ||
            `مجموعة ${id}`,

          members:
            "غير متاح",

          banned:
            isBanned(id),

          unavailable:
            true
        });

        continue;
      }

      // ==================================================
      // المجموعة متاحة
      // ==================================================

      const name =
        getGroupName(
          info,
          id
        );

      const members =
        getMemberCount(
          info
        );

      /*
       * إذا عادت المجموعة وأصبحت متاحة
       * نحذفها من سجل المحادثات القديمة
       */

      removeLeftThread(
        id
      );

      groups.push({

        id,

        name,

        members,

        banned:
          isBanned(id),

        unavailable:
          false
      });
    }

    // ==================================================
    // لا توجد نتائج
    // ==================================================

    if (!groups.length) {

      return api.sendMessage(
`${header}

❌ لم أجد أي مجموعات.`,
        event.threadID
      );
    }

    // ==================================================
    // إنشاء القائمة
    // ==================================================

    let msg =
`${header}

📊 المجموعات المعروفة:
${groups.length}

`;

    const groupid = [];

    const groupStatus = {};

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

      groupStatus[
        g.id
      ] = {
        name:
          g.name,
        unavailable:
          g.unavailable
      };

      let status;

      if (
        g.unavailable
      ) {

        status =
          "⚠️ غير متاحة";

      } else if (
        g.banned
      ) {

        status =
          "🔒 محظورة";

      } else {

        status =
          "🟢 نشطة";
      }

      msg +=
`${i + 1}. ${g.name}
⪼ الأعضاء: ${g.members}
⪼ الحالة: ${status}
⪼ ID: ${g.id}`;

      if (
        g.unavailable
      ) {

        msg +=
`
⪼ يمكن تنظيفها: نعم`;
      }

      msg +=
`

`;
    }

    // ==================================================
    // التحكم
    // ==================================================

    msg +=
`⌬ ━━━━━━━━━━━━ ⌬
💡 التحكم:

• حظر [رقم]
• الغاء_حظر [رقم]
• خروج [رقم]
• تنظيف [رقم]
• تنظيف_الكل

مثال:

حظر 1
الغاء_حظر 1
خروج 1
تنظيف 2

تنظيف_الكل

⌬ ━━━━━━━━━━━━ ⌬`;

    // ==================================================
    // إرسال القائمة
    // ==================================================

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

          global.client.handleReply =
            [];
        }

        global.client.handleReply.push({

          name:
            "لاست",

          messageID:
            info.messageID,

          author:
            String(
              event.senderID
            ),

          groupid,

          groupStatus,

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