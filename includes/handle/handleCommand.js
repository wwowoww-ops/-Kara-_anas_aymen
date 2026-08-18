const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");

// ============================================================
// المسارات
// ============================================================

const DATA_DIR = path.join(process.cwd(), "data");

const BANNED_GROUPS_FILE =
  path.join(DATA_DIR, "banned.json");

const BANNED_USERS_FILE =
  path.join(DATA_DIR, "banned_users.json");


// ============================================================
// إنشاء مجلد data بدون حذف أي شيء داخله
// ============================================================

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}


// ============================================================
// منع تكرار تنفيذ الأمر
// ============================================================

const commandExecuted = new Set();


// ============================================================
// JSON آمن
// ============================================================

function readJSON(file) {

  try {

    if (!fs.existsSync(file)) {
      return {};
    }

    const content =
      fs.readFileSync(file, "utf8").trim();

    if (!content) {
      return {};
    }

    const data =
      JSON.parse(content);

    return data && typeof data === "object"
      ? data
      : {};

  } catch (error) {

    console.error(
      "JSON READ ERROR:",
      file,
      error.message
    );

    return {};
  }
}


// ============================================================
// مزامنة الحظر من الملفات إلى global.data
// ============================================================

function syncBanData() {

  // -------------------------------
  // حظر المجموعات
  // -------------------------------

  try {

    const bannedGroups =
      readJSON(BANNED_GROUPS_FILE);

    if (
      global.data &&
      global.data.threadBanned
    ) {

      if (
        typeof global.data.threadBanned.clear ===
        "function"
      ) {

        global.data.threadBanned.clear();

      }

      for (
        const id of Object.keys(bannedGroups)
      ) {

        const item =
          bannedGroups[id];

        if (
          item === true ||
          item?.banned === true
        ) {

          global.data.threadBanned.set(
            String(id),
            true
          );

        }
      }
    }

  } catch (error) {

    console.error(
      "SYNC GROUP BAN ERROR:",
      error.message
    );

  }


  // -------------------------------
  // حظر المستخدمين
  // -------------------------------

  try {

    const bannedUsers =
      readJSON(BANNED_USERS_FILE);

    if (
      global.data &&
      global.data.userBanned
    ) {

      if (
        typeof global.data.userBanned.clear ===
        "function"
      ) {

        global.data.userBanned.clear();

      }

      for (
        const id of Object.keys(bannedUsers)
      ) {

        const item =
          bannedUsers[id];

        if (
          item === true ||
          item?.banned === true
        ) {

          global.data.userBanned.set(
            String(id),
            true
          );

        }
      }
    }

  } catch (error) {

    console.error(
      "SYNC USER BAN ERROR:",
      error.message
    );

  }
}


// ============================================================
// تنظيف اسم الأمر
// ============================================================

function normalizeCommand(text) {

  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ـ/g, "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\s+/g, "");
}


// ============================================================
// Levenshtein
// ============================================================

function levenshtein(a, b) {

  a = String(a);
  b = String(b);

  const matrix =
    Array.from(
      { length: b.length + 1 },
      () =>
        Array(a.length + 1).fill(0)
    );

  for (
    let i = 0;
    i <= b.length;
    i++
  ) {

    matrix[i][0] = i;

  }

  for (
    let j = 0;
    j <= a.length;
    j++
  ) {

    matrix[0][j] = j;

  }

  for (
    let i = 1;
    i <= b.length;
    i++
  ) {

    for (
      let j = 1;
      j <= a.length;
      j++
    ) {

      if (
        b[i - 1] ===
        a[j - 1]
      ) {

        matrix[i][j] =
          matrix[i - 1][j - 1];

      } else {

        matrix[i][j] =
          Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + 1
          );

      }
    }
  }

  return matrix[b.length][a.length];
}


// ============================================================
// التشابه
// ============================================================

function similarityScore(input, command) {

  input =
    normalizeCommand(input);

  command =
    normalizeCommand(command);

  if (!input || !command) {
    return 0;
  }

  if (input === command) {
    return 1;
  }

  if (
    command.startsWith(input) ||
    input.startsWith(command)
  ) {

    const shorter =
      Math.min(
        input.length,
        command.length
      );

    const longer =
      Math.max(
        input.length,
        command.length
      );

    return (
      0.75 +
      (shorter / longer) * 0.25
    );
  }

  const distance =
    levenshtein(
      input,
      command
    );

  const maxLength =
    Math.max(
      input.length,
      command.length
    );

  if (!maxLength) {
    return 0;
  }

  return (
    1 -
    distance / maxLength
  );
}


// ============================================================
// أقرب أمر
// ============================================================

function findClosestCommand(
  input,
  commands
) {

  let bestCommand = null;
  let bestScore = 0;

  for (
    const command of commands
  ) {

    const score =
      similarityScore(
        input,
        command
      );

    if (
      score > bestScore
    ) {

      bestScore = score;
      bestCommand = command;

    }
  }

  return {
    command: bestCommand,
    score: bestScore
  };
}


// ============================================================
// توحيد المنشنات
// ============================================================

function normalizeMentions(event) {

  if (!event) {
    return;
  }

  if (
    !event.mentions ||
    typeof event.mentions !== "object"
  ) {

    event.mentions = {};

  }

  if (
    event.mentions instanceof Map
  ) {

    const converted = {};

    for (
      const [id, name] of
      event.mentions.entries()
    ) {

      converted[String(id)] =
        name;

    }

    event.mentions =
      converted;
  }

  const normalized = {};

  for (
    const id of
    Object.keys(event.mentions)
  ) {

    if (!id) {
      continue;
    }

    normalized[String(id)] =
      event.mentions[id];

  }

  event.mentions =
    normalized;

  if (
    event.messageReply &&
    event.messageReply.senderID
  ) {

    event.messageReply.senderID =
      String(
        event.messageReply.senderID
      );

  }

  event.mentionIDs =
    Object.keys(
      event.mentions
    ).map(
      id => String(id)
    );
}


// ============================================================
// أول منشن
// ============================================================

function getFirstMention(event) {

  normalizeMentions(event);

  const ids =
    Object.keys(
      event?.mentions || {}
    );

  return ids.length
    ? String(ids[0])
    : null;
}


// ============================================================
// معرفة المطور
// ============================================================

function getDeveloperIDs() {

  const ids = [];

  try {

    if (
      Array.isArray(
        global.config?.ADMINBOT
      )
    ) {

      for (
        const id of
        global.config.ADMINBOT
      ) {

        if (id) {
          ids.push(
            String(id)
          );
        }

      }
    }

  } catch (e) {}


  try {

    const dev =
      global.config?.KIRA_CONF?.dev;

    if (dev) {

      ids.push(
        String(dev)
      );

    }

  } catch (e) {}

  return [
    ...new Set(ids)
  ];
}


function isDeveloper(senderID) {

  return getDeveloperIDs()
    .includes(
      String(senderID)
    );

}


// ============================================================
// التحقق من حظر المجموعة من الملف
// ============================================================

function isGroupBanned(threadID) {

  const data =
    readJSON(
      BANNED_GROUPS_FILE
    );

  const item =
    data[String(threadID)];

  return (
    item === true ||
    item?.banned === true
  );
}


// ============================================================
// التحقق من حظر المستخدم
// ============================================================

function isUserBanned(senderID) {

  const data =
    readJSON(
      BANNED_USERS_FILE
    );

  const item =
    data[String(senderID)];

  return (
    item === true ||
    item?.banned === true
  );
}


// ============================================================
// معالجة الأمر
// ============================================================

module.exports = function ({
  api,
  models,
  Users,
  Threads,
  Currencies
}) {

  // مزامنة ملفات الحظر عند تحميل المعالج
  syncBanData();


  return async function ({
    event
  }) {

    try {

      if (!event) {
        return;
      }

      normalizeMentions(event);


      const {
        allowInbox,
        PREFIX,
        ADMINBOT,
        DeveloperMode,
        YASSIN
      } = global.config;


      const {
        threadInfo,
        threadData,
        commandBanned
      } = global.data;


      const {
        commands
      } = global.client;


      let {
        body,
        senderID,
        threadID,
        messageID
      } = event;


      if (!body) {
        return;
      }


      senderID =
        String(senderID);

      threadID =
        String(threadID);


      // ======================================================
      // مزامنة الحظر قبل معالجة الرسالة
      // ======================================================

      syncBanData();


      // ======================================================
      // البادئة
      // ======================================================

      const currentThreadData =
        threadData.get(
          threadID
        ) || {};


      const prefix =
        Object.prototype.hasOwnProperty.call(
          currentThreadData,
          "PREFIX"
        )
          ? currentThreadData.PREFIX
          : PREFIX;


      const botID =
        String(
          api.getCurrentUserID()
        );


      const escapeRegex =
        str =>
          String(str).replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );


      const prefixRegex =
        new RegExp(
          `^(<@!?${botID}>|${escapeRegex(prefix)})\\s*`
        );


      const matchedPrefix =
        body.match(
          prefixRegex
        )?.[0];


      if (!matchedPrefix) {
        return;
      }


      const content =
        body
          .slice(
            matchedPrefix.length
          )
          .trim();


      if (!content) {
        return;
      }


      // ======================================================
      // استخراج الأمر
      // ======================================================

      const args =
        content.split(/\s+/);

      const commandNameRaw =
        args.shift();

      const commandName =
        normalizeCommand(
          commandNameRaw
        );


      // ======================================================
      // البحث عن الأمر
      // ======================================================

      let command = null;

      for (
        const [name, cmd] of
        commands.entries()
      ) {

        if (
          normalizeCommand(name) ===
          commandName
        ) {

          command = cmd;
          break;

        }
      }


      // ======================================================
      // الحظر قبل تشغيل الأمر
      //
      // مهم:
      // المطور يستطيع استعمال "حظر ازالة"
      // حتى لو كانت المجموعة محظورة.
      // ======================================================

      const developer =
        isDeveloper(senderID);


      if (!developer) {

        if (
          isGroupBanned(threadID)
        ) {

          return;

        }

        if (
          isUserBanned(senderID)
        ) {

          return;

        }

      }


      // ======================================================
      // إذا لم يوجد الأمر
      // ======================================================

      if (!command) {

        const allCommandNames =
          Array.from(
            commands.keys()
          );

        if (
          allCommandNames.length === 0
        ) {

          return;

        }

        const result =
          findClosestCommand(
            commandName,
            allCommandNames
          );

        if (
          result.command &&
          result.score >= 0.45
        ) {

          return api.sendMessage(

            `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬

❌ الأمر "${commandNameRaw}" غير موجود

💡 ربما تقصد:
"${result.command}"؟`,

            threadID,
            messageID

          );

        }

        return api.sendMessage(

          `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬

❌ الأمر "${commandNameRaw}" غير موجود.

💡 استخدم ${prefix}مساعدة لرؤية الأوامر.`,

          threadID,
          messageID

        );

      }


      // ======================================================
      // المنشن
      // ======================================================

      normalizeMentions(event);

      const firstMention =
        getFirstMention(event);


      if (
        DeveloperMode &&
        firstMention
      ) {

        console.log(
          "[HINA MENTION]",
          {
            senderID,
            mentionID: firstMention,
            allMentions:
              event.mentionIDs,
            command: commandName
          }
        );

      }


      // ======================================================
      // حظر الأوامر
      // ======================================================

      if (
        commandBanned &&
        !developer
      ) {

        const threadBannedCommands =
          commandBanned.get(
            threadID
          ) || [];

        const userBannedCommands =
          commandBanned.get(
            senderID
          ) || [];


        if (
          Array.isArray(
            threadBannedCommands
          ) &&
          threadBannedCommands.includes(
            command.config.name
          )
        ) {

          return api.sendMessage(

            `⌬ ━━ 𝗛𝗜𝗡𝗔 ADMIN ━━ ⌬

🚫 الأمر محظور في هذه المجموعة

الأمر:
${command.config.name}`,

            threadID,
            messageID

          );

        }


        if (
          Array.isArray(
            userBannedCommands
          ) &&
          userBannedCommands.includes(
            command.config.name
          )
        ) {

          return api.sendMessage(

            `⌬ ━━ 𝗛𝗜𝗡𝗔 ADMIN ━━ ⌬

⛔ أنت محظور من استخدام هذا الأمر`,

            threadID,
            messageID

          );

        }

      }


      // ======================================================
      // NSFW
      // ======================================================

      if (
        command.config.commandCategory &&
        command.config.commandCategory
          .toLowerCase() ===
          "nsfw" &&
        !global.data.threadAllowNSFW.includes(
          threadID
        ) &&
        !developer
      ) {

        return api.sendMessage(

          `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬

🔞 محتوى محظور في هذه المجموعة`,

          threadID,
          messageID

        );

      }


      // ======================================================
      // الصلاحيات
      // ======================================================

      let permssion = 0;


      let info =
        threadInfo.get(
          threadID
        );


      if (!info) {

        try {

          info =
            await Threads.getInfo(
              threadID
            );

          if (info) {

            threadInfo.set(
              threadID,
              info
            );

          }

        } catch (error) {

          console.error(
            "GET THREAD INFO ERROR:",
            error.message
          );

        }

      }


      const admins =
        info?.adminIDs || [];


      const isGroupAdmin =
        admins.some(
          admin =>
            String(admin.id) ===
            String(senderID)
        );


      if (developer) {

        permssion = 2;

      } else if (
        isGroupAdmin
      ) {

        permssion = 1;

      }


      if (
        Number(
          command.config.hasPermssion || 0
        ) >
        permssion
      ) {

        return api.sendMessage(

          `⌬ ━━ 𝗛𝗜𝗡𝗔 ADMIN ━━ ⌬

⚠️ ليس لديك صلاحية لتنفيذ هذا الأمر`,

          threadID,
          messageID

        );

      }


      // ======================================================
      // Cooldown
      // ======================================================

      if (
        !global.client.cooldowns.has(
          command.config.name
        )
      ) {

        global.client.cooldowns.set(
          command.config.name,
          new Map()
        );

      }


      const timestamps =
        global.client.cooldowns.get(
          command.config.name
        );


      const expirationTime =
        (
          Number(
            command.config.cooldowns
          ) || 1
        ) * 1000;


      if (
        timestamps.has(senderID) &&
        Date.now() <
          timestamps.get(senderID) +
          expirationTime
      ) {

        return api.setMessageReaction(
          "⏳",
          messageID,
          () => {},
          true
        );

      }


      // ======================================================
      // منع التكرار
      // ======================================================

      const commandKey =
        `${threadID}_${senderID}_${commandName}`;


      if (
        commandExecuted.has(
          commandKey
        )
      ) {

        return;

      }


      commandExecuted.add(
        commandKey
      );


      setTimeout(
        () => {

          commandExecuted.delete(
            commandKey
          );

        },
        1000
      );


      // ======================================================
      // بيانات الأمر
      // ======================================================

      const Obj = {

        api,

        event,

        args,

        models,

        Users,

        Threads,

        Currencies,

        permssion,

        mentionID:
          getFirstMention(event),

        mentionIDs:
          event.mentionIDs || [],

        getText: () => {}

      };


      // ======================================================
      // تشغيل الأمر
      // ======================================================

      await command.run(
        Obj
      );


      timestamps.set(
        senderID,
        Date.now()
      );


    } catch (error) {

      console.error(
        `[${moment().format("HH:mm:ss")}] COMMAND ERROR:`,
        error
      );


      try {

        return api.sendMessage(

          `⌬ ━━ 𝗛𝗜𝗡𝗔 DEVELOPER ━━ ⌬

❌ حدث خطأ أثناء تنفيذ الأمر

${error.message}`,

          event.threadID,
          event.messageID

        );

      } catch (e) {}

    }

  };
};