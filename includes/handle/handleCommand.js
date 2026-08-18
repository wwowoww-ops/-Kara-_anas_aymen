const fs = require("fs");
const moment = require("moment-timezone");


// ============================================================
// منع تكرار تنفيذ الأوامر
// ============================================================

const commandExecuted = new Set();


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

  const matrix = Array.from(
    { length: b.length + 1 },
    () => Array(a.length + 1).fill(0)
  );

  for (let i = 0; i <= b.length; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {

    for (let j = 1; j <= a.length; j++) {

      if (b[i - 1] === a[j - 1]) {

        matrix[i][j] =
          matrix[i - 1][j - 1];

      } else {

        matrix[i][j] = Math.min(
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

function similarityScore(input, command) {

  input = normalizeCommand(input);
  command = normalizeCommand(command);

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

  if (maxLength === 0) {
    return 0;
  }

  return (
    1 -
    distance / maxLength
  );
}


// ============================================================
// إيجاد أقرب أمر
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

    if (score > bestScore) {

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
// 🔥 نظام المنشن المركزي
// ============================================================

function normalizeMentions(event) {

  if (!event) {
    return;
  }


  // ----------------------------------------------------------
  // إنشاء mentions إذا لم تكن موجودة
  // ----------------------------------------------------------

  if (
    !event.mentions ||
    typeof event.mentions !== "object"
  ) {

    event.mentions = {};

  }


  // ----------------------------------------------------------
  // تحويل Map إلى Object إذا كانت موجودة
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // توحيد IDs
  // ----------------------------------------------------------

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


  // ----------------------------------------------------------
  // دعم الرد
  // ----------------------------------------------------------

  if (
    event.type === "message_reply" &&
    event.messageReply &&
    event.messageReply.senderID
  ) {

    event.messageReply.senderID =
      String(
        event.messageReply.senderID
      );

  }


  // ----------------------------------------------------------
  // إذا كان هناك منشن فعلي
  // نضع قائمة IDs مساعدة
  // ----------------------------------------------------------

  event.mentionIDs =
    Object.keys(
      event.mentions
    ).map(id =>
      String(id)
    );
}


// ============================================================
// الحصول على أول منشن
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

  if (ids.length > 0) {
    return String(ids[0]);
  }

  return null;
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

    const dateNow =
      Date.now();

    const time =
      moment
        .tz("Africa/Casablanca")
        .format(
          "HH:mm:ss DD/MM/YYYY"
        );


    // ========================================================
    // حماية event + المنشن
    // ========================================================

    normalizeMentions(event);


    const {
      allowInbox,
      PREFIX,
      ADMINBOT,
      DeveloperMode,
      adminOnly,
      YASSIN
    } = global.config;


    const {
      userBanned,
      threadBanned,
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


    // ========================================================
    // نظام كف
    // ========================================================

    const stopPath =
      "./data/stop.json";


    if (
      fs.existsSync(stopPath)
    ) {

      try {

        const stopData =
          JSON.parse(
            fs.readFileSync(
              stopPath,
              "utf8"
            )
          );


        if (
          stopData[threadID] &&
          stopData[threadID].active
        ) {

          const commandNameCheck =
            body
              .slice(PREFIX.length)
              .trim()
              .split(/ +/)[0]
              .toLowerCase();


          if (
            commandNameCheck !==
            "كف"
          ) {

            return;

          }
        }

      } catch (error) {

        console.error(
          "STOP SYSTEM ERROR:",
          error
        );

      }
    }


    // ========================================================
    // نظام التقييد
    // ========================================================

    const restrictPath =
      "./data/restrict.json";


    if (
      fs.existsSync(
        restrictPath
      )
    ) {

      try {

        const restrictData =
          JSON.parse(
            fs.readFileSync(
              restrictPath,
              "utf8"
            )
          );


        if (
          restrictData[threadID] &&
          restrictData[threadID].active
        ) {

          return;

        }

      } catch (error) {

        console.error(
          "RESTRICT SYSTEM ERROR:",
          error
        );

      }
    }


    // ========================================================
    // البادئة
    // ========================================================

    const threadSetting =
      threadData.get(
        threadID
      ) || {};


    const prefix =
      Object.prototype.hasOwnProperty.call(
        threadSetting,
        "PREFIX"
      )
        ? threadSetting.PREFIX
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
      )?.[0] || null;


    if (!matchedPrefix) {
      return;
    }


    // ========================================================
    // محتوى الأمر
    // ========================================================

    const content =
      body
        .slice(
          matchedPrefix.length
        )
        .trim();


    if (!content) {
      return;
    }


    // ========================================================
    // arguments
    // ========================================================

    const args =
      content
        .split(/\s+/);


    const commandNameRaw =
      args.shift();


    const commandName =
      String(
        commandNameRaw
      ).toLowerCase();


    let command =
      commands.get(
        commandName
      );


    // ========================================================
    // الحظر
    // ========================================================

    if (
      threadBanned.has(
        threadID
      ) &&
      !ADMINBOT.includes(
        senderID
      )
    ) {

      return;

    }


    if (
      userBanned.has(
        senderID
      ) &&
      !ADMINBOT.includes(
        senderID
      )
    ) {

      return;

    }


    if (
      YASSIN === "true" &&
      !ADMINBOT.includes(
        senderID
      )
    ) {

      return;

    }


    // ========================================================
    // اقتراح الأمر
    // ========================================================

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


    // ========================================================
    // 🔥 تأكيد المنشن قبل تشغيل الأمر
    // ========================================================

    normalizeMentions(event);


    const firstMention =
      getFirstMention(event);


    if (
      DeveloperMode &&
      firstMention
    ) {

      console.log(
        `\n📌 HINA MENTION`
      );

      console.log(
        `   Sender: ${senderID}`
      );

      console.log(
        `   Mention: ${firstMention}`
      );

      console.log(
        `   All Mentions:`,
        event.mentionIDs
      );

      console.log(
        `   Command: ${commandName}\n`
      );
    }


    // ========================================================
    // حظر الأمر
    // ========================================================

    if (
      commandBanned.get(
        threadID
      ) ||
      commandBanned.get(
        senderID
      )
    ) {

      if (
        !ADMINBOT.includes(
          senderID
        )
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
    }


    // ========================================================
    // NSFW
    // ========================================================

    if (
      command.config.commandCategory &&
      command.config.commandCategory.toLowerCase() ===
        "nsfw" &&
      !global.data.threadAllowNSFW.includes(
        threadID
      ) &&
      !ADMINBOT.includes(
        senderID
      )
    ) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬\n\n` +
        `🔞 محتوى محظور في هذه المجموعة`,
        threadID,
        messageID
      );
    }


    // ========================================================
    // الصلاحيات
    // ========================================================

    let permssion = 0;


    const threadInfoo2 =
      threadInfo.get(
        threadID
      ) ||
      await Threads.getInfo(
        threadID
      );


    const find =
      threadInfoo2.adminIDs.find(
        el =>
          String(el.id) ===
          String(senderID)
      );


    if (
      ADMINBOT.includes(
        senderID
      )
    ) {

      permssion = 2;

    } else if (find) {

      permssion = 1;

    }


    if (
      command.config.hasPermssion >
      permssion
    ) {

      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 ADMIN ━━ ⌬\n\n` +
        `⚠️ ليس لديك صلاحية لتنفيذ هذا الأمر`,
        threadID,
        messageID
      );
    }


    // ========================================================
    // Cooldown
    // ========================================================

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


    // ========================================================
    // تنفيذ الأمر
    // ========================================================

    try {

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
      // 🔥 Object الخاص بالأمر
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

        // ID أول منشن متاح للأوامر التي تريد استخدامه
        mentionID:
          getFirstMention(event),

        // جميع المنشنات
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
        dateNow
      );


      return;

    } catch (e) {

      console.error(
        `[${time}] COMMAND ERROR:`,
        e
      );


      return api.sendMessage(
        `⌬ ━━ 𝗛𝗜𝗡𝗔 DEVELOPER ━━ ⌬\n\n` +
        `❌ حدث خطأ أثناء تنفيذ الأمر\n\n` +
        `${e.message}`,
        threadID,
        messageID
      );
    }
  };
};