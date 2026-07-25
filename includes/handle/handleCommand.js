const fs = require("fs");
const path = require("path");
const stringSimilarity = require("string-similarity");
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const logger = require("../../utils/log.js");
const moment = require("moment-timezone");

module.exports = function ({ api, models, Users, Threads, Currencies }) {
  return async function ({ event }) {
    const dateNow = Date.now();
    const time = moment.tz("Africa/Casablanca").format("HH:mm:ss DD/MM/YYYY");
    const { allowInbox, PREFIX, ADMINBOT, DeveloperMode, adminOnly, YASSIN } = global.config;

    const { userBanned, threadBanned, threadInfo, threadData, commandBanned } = global.data;
    const { commands, cooldowns } = global.client;

    var { body, senderID, threadID, messageID } = event;

    if (!body) return; 

    senderID = String(senderID);
    threadID = String(threadID);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔴 نظام الإيقاف (كف) - للأدمن فقط
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const stopPath = "./data/stop.json";
    if (fs.existsSync(stopPath)) {
      const stopData = JSON.parse(fs.readFileSync(stopPath));
      if (stopData[threadID] && stopData[threadID].active) {
        // إذا كانت المجموعة موقوفة، لا يستجيب البوت
        return;
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔒 نظام التقييد (إيقاف البوت في مجموعة)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const restrictPath = "./data/restrict.json";
    if (fs.existsSync(restrictPath)) {
      const restrictData = JSON.parse(fs.readFileSync(restrictPath));
      if (restrictData[threadID] && restrictData[threadID].active) {
        // إذا كانت المجموعة مقيدة، لا يستجيب البوت
        return;
      }
    }

    const threadSetting = threadData.get(threadID) || {};
    const prefix = threadSetting.hasOwnProperty("PREFIX") ? threadSetting.PREFIX : PREFIX;
    
    const botID = api.getCurrentUserID();
    const prefixRegex = new RegExp(`^(<@!?${botID}>|${escapeRegex(prefix)})\\s*`);

    const [matchedPrefix] = body.match(prefixRegex) || [null];
    if (!matchedPrefix) return;
    
    const args = body.slice(matchedPrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    var command = commands.get(commandName);
    
    if (threadBanned.has(threadID) && !ADMINBOT.includes(senderID)) return;
    if (userBanned.has(senderID) && !ADMINBOT.includes(senderID)) return;
    if (YASSIN === "true" && !ADMINBOT.includes(senderID)) return;

    if (!command) {
      var allCommandName = Array.from(commands.keys());
      const checker = stringSimilarity.findBestMatch(commandName, allCommandName);

      if (checker.bestMatch.rating >= 0.8) {
        command = commands.get(checker.bestMatch.target);
      } else if (matchedPrefix) {

        const closestMatch = checker.bestMatch.target;
        const funnyReplies = [
          `⌬ ━━ HINA UTILITY ━━ ⌬\n\n❌ خطأ: "${commandName}" غير مسجل\n💡 هل تقصد: '${closestMatch}'؟`,
          `⌬ ━━ HINA UTILITY ━━ ⌬\n\n⚠️ الأمر غير موجود\n🔍 جرب: '${closestMatch}'`,
          `⌬ ━━ HINA UTILITY ━━ ⌬\n\n🚫 أمر خاطئ\n✨ ربما تقصد: '${closestMatch}'`,
        ];

        return api.sendMessage(
          funnyReplies[Math.floor(Math.random() * funnyReplies.length)],
          threadID,
          messageID
        );
      }
    }

    if (!command) return;

    if (commandBanned.get(threadID) || commandBanned.get(senderID)) {
      if (!ADMINBOT.includes(senderID)) {
        const banThreads = commandBanned.get(threadID) || [];
        const banUsers = commandBanned.get(senderID) || [];
        if (banThreads.includes(command.config.name)) {
          return api.sendMessage(`⌬ ━━ HINA ADMIN ━━ ⌬\n\n🚫 الأمر محظور في هذه المجموعة\nالأمر: ${command.config.name}`, threadID, messageID);
        } else if (banUsers.includes(command.config.name)) {
          return api.sendMessage(`⌬ ━━ HINA ADMIN ━━ ⌬\n\n⛔ أنت محظور من استخدام هذا الأمر`, threadID, messageID);
        }
      }
    }

    if (command.config.commandCategory.toLowerCase() == "nsfw" && !global.data.threadAllowNSFW.includes(threadID) && !ADMINBOT.includes(senderID)) {
      return api.sendMessage(`⌬ ━━ HINA UTILITY ━━ ⌬\n\n🔞 محتوى محظور في هذه المجموعة`, threadID, messageID);
    }

    var permssion = 0;
    const threadInfoo2 = threadInfo.get(threadID) || (await Threads.getInfo(threadID));
    const find = threadInfoo2.adminIDs.find((el) => el.id == senderID);
    if (ADMINBOT.includes(senderID.toString())) permssion = 2;
    else if (find) permssion = 1;

    if (command.config.hasPermssion > permssion) {
      return api.sendMessage(`⌬ ━━ ABU HURAIRA ADMIN ━━ ⌬\n\n⚠️ ليس لديك صلاحية لتنفيذ هذا الأمر`, event.threadID, event.messageID);
    }

    if (!client.cooldowns.has(command.config.name)) {
      client.cooldowns.set(command.config.name, new Map());
    }
    const timestamps = client.cooldowns.get(command.config.name);
    const expirationTime = (command.config.cooldowns || 1) * 1000;
    if (timestamps.has(senderID) && dateNow < timestamps.get(senderID) + expirationTime) {
      return api.setMessageReaction("⏳", event.messageID, () => {}, true);
    }

    try {
      const Obj = { api, event, args, models, Users, Threads, Currencies, permssion, getText: () => {} };
      command.run(Obj);
      timestamps.set(senderID, dateNow);
      return;
    } catch (e) {
      console.error(e);
      return api.sendMessage(`⌬ ━━ ABU HURAIRA DEVELOPER ━━ ⌬\n\n❌ حدث خطأ أثناء تنفيذ الأمر\n\n${e.message}`, threadID);
    }
  };
};