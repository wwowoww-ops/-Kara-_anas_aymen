module.exports.config = {
    name: "خاص",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "اختبار عمل البوت في الخاص",
    commandCategory: "Utility",
    usages: "خاص",
    cooldowns: 3
};

module.exports.run = async function ({ api, event }) {

    const isPrivate =
        !event.isGroup ||
        String(event.threadID) === String(event.senderID);

    return api.sendMessage(
        `╭──────────────╮
│ 𝗛𝗜𝗡𝗔 〢 DM TEST
╰──────────────╯

الحالة: ${isPrivate ? "خاص" : "مجموعة"}

senderID:
${event.senderID}

threadID:
${event.threadID}

البوت يستقبل رسائل الخاص بشكل صحيح`,
        event.threadID,
        event.messageID
    );
};