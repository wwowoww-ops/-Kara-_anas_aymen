module.exports.run = async function({ api, event, args, Users, Threads, Currencies, models }) {
    const { threadID, messageID } = event;
    
    const text = args.join(" ");
    if (!text) {
        return api.sendMessage(
            `⌬ ━━ HINA FUN ━━ ⌬\n\n📝 اكتب شيئاً لأقوله\nمثال: قول مرحباً`,
            threadID,
            messageID
        );
    }
    
    // حذف رسالة الأمر
    api.unsendMessage(messageID);
    
    // إرسال النص فقط
    return api.sendMessage(text, threadID);
};

module.exports.config = {
    name: "قول",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "البوت يقول ما تكتبه (يحذف أمرك)",
    commandCategory: "fun",
    usages: "قول [النص]",
    cooldowns: 3
};