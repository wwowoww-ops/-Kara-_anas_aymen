const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

// ============================================================
// منع تكرار تنفيذ الأوامر
// ============================================================

const commandExecuted = new Set();

// ============================================================
// مسارات الحظر الدائم
// ============================================================

const DATA_DIR = path.join(process.cwd(), "data");

const BANNED_GROUPS_FILE =
  path.join(DATA_DIR, "banned.json");

const BANNED_USERS_FILE =
  path.join(DATA_DIR, "banned_users.json");

fs.ensureDirSync(DATA_DIR);

// ============================================================
// قراءة JSON بأمان
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

    return JSON.parse(content);

  } catch (error) {

    console.error(
      "HINA JSON READ ERROR:",
      file,
      error.message
    );

    return {};
  }
}

// ============================================================
// التحقق من حظر المجموعة
// ============================================================

function isGroupBanned(threadID) {

  const data =
    readJSON(BANNED_GROUPS_FILE);

  const id =
    String(threadID);

  return !!(
    data[id] &&
    (
      data[id] === true ||
      data[id].banned === true
    )
  );
}

// ============================================================
// التحقق من حظر المستخدم
// ============================================================

function isUserBanned(senderID) {

  const data =
    readJSON(BANNED_USERS_FILE);

  const id =
    String(senderID);

  return !!(
    data[id] &&
    (
      data[id] === true ||
      data[id].banned === true
    )
  );
}

// ============================================================
// منع تكرار الأوامر
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
        Array(
          a.length + 1
        ).fill(0)
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
// حساب التشابه
// ============================================================

function similarityScore(
  input,
  command
) {

  input =
    normalizeCommand(input);

  command =
    normalizeCommand(command);

  if (
    !input ||
    !command
  ) {
    return 0;
  }

  if (
    input === command
  ) {
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

      bestScore =
        score;

      bestCommand =
        command;
    }
  }

  return {
    command: bestCommand,
    score: bestScore
  };
}

// ============================================================
// نظام المنشن
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

      converted[
        String(id)
      ] = name;
    }

    event.mentions =
      converted;
  }

  const normalized = {};

  for (
    const id of
    Object.keys(
      event.mentions
    )
  ) {

    if (!id) {
      continue;
    }

    normalized[
      String(id)
    ] =
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

  if (!event) {
    return null;
  }

  normalizeMentions(event);

  const ids =
    Object.keys(
      event.mentions || {}
    );

  if (!ids.length) {
    return null;
  }

  return String(ids[0]);
}

// ============================================================
// الحصول على المطور
// ============================================================

function getAdminIDs() {

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

// ============================================================
// هل المستخدم مطور؟
 // ============================================================

function isDeveloper(senderID) {

  const admins =
    getAdminIDs();

  return admins.includes(
    String(senderID)
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

  return async function ({
    event
  }) {

    try {

      if (!event) {
        return;
      }

      normalizeMentions(event);

      const dateNow =
        Date.now();

      const time =
        moment
          .tz(
            "Africa/Casablanca"
          )
          .format(
            "HH:mm:ss DD/MM/YYYY"
          );

      const config =
        global.config || {};

      const data =
        global.data || {};

      const client =
        global.client || {};

      const {
        PREFIX = ".",
        ADMINBOT = [],
        DeveloperMode = false
      } = config;

      const {
        threadData,
        threadInfo,
        commandBanned
      } = data;

      const {
        commands
      } = client;

      if (!commands) {
        return;
      }

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

      const adminIDs =
        ADMINBOT.map(
          id => String(id)
        );

      const developer =
        isDeveloper(
          senderID
        );

      // ======================================================
      // نظام كف
      // ======================================================

      const stopPath =
        path.join(
          process.cwd(),
          "data",
          "stop.json"
        );

      if (
        fs.existsSync(stopPath)
      ) {

        try {

          const stopData =
            readJSON(stopPath);

          if (
            stopData[threadID] &&
            stopData[threadID].active
          ) {

            const check =
              body
                .trim()
                .split(/\s+/)[0]
                .toLowerCase();

            if (
              normalizeCommand(check) !==
              normalizeCommand("كف")
            ) {

              return;
            }
          }

        } catch (e) {

          console.error(
            "STOP SYSTEM ERROR:",
            e.message
          );
        }
      }

      // ======================================================
      // نظام التقييد
      // ======================================================

      const restrictPath =
        path.join(
          process.cwd(),
          "data",
          "restrict.json"
        );

      if (
        fs.existsSync(
          restrictPath
        )
      ) {

        try {

          const restrictData =
            readJSON(
              restrictPath
            );

          if (
            restrictData[threadID] &&
            restrictData[threadID].active
          ) {

            return;
          }

        } catch (e) {

          console.error(
            "RESTRICT SYSTEM ERROR:",
            e.message
          );
        }
      }

      // ======================================================
      // البادئة
      // ======================================================

      let prefix =
        PREFIX;

      try {

        const savedThreadData =
          threadData?.get(
            threadID
          ) || {};

        if (
          Object.prototype.hasOwnProperty.call(
            savedThreadData,
            "PREFIX"
          )
        ) {

          prefix =
            savedThreadData.PREFIX;
        }

      } catch (e) {}

      if (
        !prefix
      ) {
        prefix = ".";
      }

      // ======================================================
      // اكتشاف البادئة أو منشن البوت
      // ======================================================

      let botID = "";

      try {

        botID =
          String(
            api.getCurrentUserID()
          );

      } catch (e) {}

      const escapeRegex =
        str =>
          String(str).replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );

      let prefixRegex;

      if (botID) {

        prefixRegex =
          new RegExp(
            `^(<@!?${botID}>|${escapeRegex(prefix)})\\s*`
          );

      } else {

        prefixRegex =
          new RegExp(
            `^${escapeRegex(prefix)}\\s*`
          );
      }

      const matchedPrefix =
        body.match(
          prefixRegex
        )?.[0] || null;

      if (!matchedPrefix) {
        return;
      }

      // ======================================================
      // محتوى الأمر
      // ======================================================

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
        String(
          commandNameRaw
        ).toLowerCase();

      // ======================================================
      // البحث عن الأمر
      // ======================================================

      let command =
        commands.get(
          commandName
        );

      // ======================================================
      // 🔒 الحظر الدائم
      // ======================================================
      //
      // مهم:
      // أمر "حظر" نفسه يجب أن يعمل للمطور
      // حتى بعد حظر المجموعة.
      //
      // لذلك نفحص الحظر بعد معرفة الأمر.
      // ======================================================

      const bannedGroup =
        isGroupBanned(
          threadID
        );

      const bannedUser =
        isUserBanned(
          senderID
        );

      // ======================================================
      // إذا كانت المجموعة محظورة
      // ======================================================

      if (
        bannedGroup &&
        !developer
      ) {

        return;
      }

      // ======================================================
      // إذا كان المستخدم محظورًا
      // ======================================================

      if (
        bannedUser &&
        !developer
      ) {

        return;
      }

      // ======================================================
      // الحظر القديم الموجود في global.data
      // ======================================================

      try {

        if (
          data.threadBanned &&
          typeof data.threadBanned.has ===
          "function" &&
          data.threadBanned.has(
            threadID
          ) &&
          !developer
        ) {

          return;
        }

      } catch (e) {}

      try {

        if (
          data.userBanned &&
          typeof data.userBanned.has ===
          "function" &&
          data.userBanned.has(
            senderID
          ) &&
          !developer
        ) {

          return;
        }

      } catch (e) {}

      // ======================================================
      // اقتراح أمر
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

        const closestMatch =
          result.command;

        const score =
          result.score;

        if (
          closestMatch &&
          score >= 0.45
        ) {

          const replies = [

            `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬\n\n` +
            `❌ الأمر "${commandName}" غير موجود\n\n` +
            `💡 ربما تقصد: "${closestMatch}"؟`,

            `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬\n\n` +
            `⚠️ لم أجد الأمر "${commandName}"\n\n` +
            `🔍 هل تقصد: "${closestMatch}"؟`,

            `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬\n\n` +
            `🚫 الأمر "${commandName}" غير صحيح\n\n` +
            `✨ ربما تقصد: "${closestMatch}"؟`

          ];

          return api.sendMessage(
            replies[
              Math.floor(
                Math.random() *
                replies.length
              )
            ],
            threadID,
            messageID
          );
        }

        return api.sendMessage(
          `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬\n\n` +
          `❌ الأمر "${commandName}" غير موجود.\n\n` +
          `💡 استخدم ${prefix}مساعدة لرؤية جميع الأوامر.`,
          threadID,
          messageID
        );
      }

      // ======================================================
      // المنشن
      // ======================================================

      normalizeMentions(event);

      const firstMention =
        getFirstMention(
          event
        );

      if (
        DeveloperMode &&
        firstMention
      ) {

        console.log(
          "\n📌 HINA MENTION"
        );

        console.log(
          `Sender: ${senderID}`
        );

        console.log(
          `Mention: ${firstMention}`
        );

        console.log(
          "All Mentions:",
          event.mentionIDs
        );

        console.log(
          `Command: ${commandName}\n`
        );
      }

      // ======================================================
      // حظر الأوامر
      // ======================================================

      try {

        if (
          commandBanned &&
          typeof commandBanned.get ===
          "function" &&
          !developer
        ) {

          const banThreads =
            commandBanned.get(
              threadID
            ) || [];

          const banUsers =
            commandBanned.get(
              senderID
            ) || [];

          if (
            Array.isArray(
              banThreads
            ) &&
            banThreads.includes(
              command.config.name
            )
          ) {

            return api.sendMessage(
              `⌬ ━━ 𝗛𝗜𝗡𝗔 ADMIN ━━ ⌬\n\n` +
              `🚫 الأمر محظور في هذه المجموعة\n` +
              `الأمر: ${command.config.name}`,
              threadID,
              messageID
            );
          }

          if (
            Array.isArray(
              banUsers
            ) &&
            banUsers.includes(
              command.config.name
            )
          ) {

            return api.sendMessage(
              `⌬ ━━ 𝗛𝗜𝗡𝗔 ADMIN ━━ ⌬\n\n` +
              `⛔ أنت محظور من استخدام هذا الأمر`,
              threadID,
              messageID
            );
          }
        }

      } catch (e) {

        console.error(
          "COMMAND BAN ERROR:",
          e.message
        );
      }

      // ======================================================
      // NSFW
      // ======================================================

      try {

        if (
          command.config.commandCategory &&
          String(
            command.config.commandCategory
          ).toLowerCase() ===
          "nsfw" &&
          !(
            data.threadAllowNSFW &&
            data.threadAllowNSFW.includes(
              threadID
            )
          ) &&
          !developer
        ) {

          return api.sendMessage(
            `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬\n\n` +
            `🔞 محتوى محظور في هذه المجموعة`,
            threadID,
            messageID
          );
        }

      } catch (e) {}

      // ======================================================
      // الصلاحيات
      // ======================================================

      let permssion = 0;

      let threadInfoData =
        null;

      try {

        threadInfoData =
          threadInfo?.get(
            threadID
          );

      } catch (e) {}

      if (
        !threadInfoData
      ) {

        try {

          if (
            Threads &&
            typeof Threads.getInfo ===
            "function"
          ) {

            threadInfoData =
              await Threads.getInfo(
                threadID
              );
          }

        } catch (e) {

          console.error(
            "THREAD INFO ERROR:",
            e.message
          );
        }
      }

      const adminList =
        threadInfoData?.adminIDs ||
        [];

      const isThreadAdmin =
        adminList.some(
          admin =>
            String(
              admin.id
            ) ===
            String(senderID)
        );

      if (
        developer
      ) {

        permssion = 2;

      } else if (
        isThreadAdmin
      ) {

        permssion = 1;
      }

      // ======================================================
      // صلاحية الأمر
      // ======================================================

      const requiredPermission =
        Number(
          command.config.hasPermssion ||
          0
        );

      if (
        requiredPermission >
        permssion
      ) {

        return api.sendMessage(
          `⌬ ━━ 𝗛𝗜𝗡𝗔 ADMIN ━━ ⌬\n\n` +
          `⚠️ ليس لديك صلاحية لتنفيذ هذا الأمر`,
          threadID,
          messageID
        );
      }

      // ======================================================
      // Cooldown
      // ======================================================

      if (
        !client.cooldowns.has(
          command.config.name
        )
      ) {

        client.cooldowns.set(
          command.config.name,
          new Map()
        );
      }

      const timestamps =
        client.cooldowns.get(
          command.config.name
        );

      const expirationTime =
        Number(
          command.config.cooldowns ||
          1
        ) * 1000;

      if (
        timestamps.has(
          senderID
        ) &&
        dateNow <
        timestamps.get(
          senderID
        ) +
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
      // تنفيذ الأمر
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
      // Object الأمر
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
          getFirstMention(
            event
          ),

        mentionIDs:
          event.mentionIDs ||
          [],

        getText:
          global.getText ||
          (() => {})

      };

      // ======================================================
      // تشغيل الأمر
      // ======================================================

      await command.run(
        Obj
      );

      timestamps.set(
        senderID,
        dateNow
      );

      return;

    } catch (e) {

      console.error(
        `[${time}] COMMAND ERROR:`,
        e
      );

      try {

        return api.sendMessage(
          `⌬ ━━ 𝗛𝗜𝗡𝗔 DEVELOPER ━━ ⌬\n\n` +
          `❌ حدث خطأ أثناء تنفيذ الأمر\n\n` +
          `${e.message}`,
          event.threadID,
          event.messageID
        );

      } catch (sendError) {

        console.error(
          "SEND ERROR:",
          sendError
        );
      }
    }
  };
};