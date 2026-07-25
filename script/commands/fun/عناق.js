const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "عناق",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "عانق شخص ما",
    commandCategory: "fun",
    usages: "عناق [@منشن] أو رد على رسالة",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args, Users }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;
    
    let targetID;
    let targetName = "شخص ما";

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // تحديد المستهدف (رد أو منشن)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (messageReply) {
        targetID = messageReply.senderID;
        try {
            const userInfo = await api.getUserInfo(targetID);
            targetName = userInfo[targetID]?.name || "الشخص";
        } catch (e) {
            targetName = "الشخص";
        }
    } else if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
        targetName = mentions[targetID].replace("@", "");
    } else {
        return api.sendMessage(
            `⌬ ━━ HINA FUN ━━ ⌬\n\n📝 الاستخدام:\n• عناق @منشن\n• أو رد على رسالة العضو`,
            threadID,
            messageID
        );
    }

    // جلب اسم المرسل
    let senderName = "أنا";
    try {
        const userInfo = await api.getUserInfo(senderID);
        senderName = userInfo[senderID]?.name || "أنا";
    } catch (e) {}

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ❌ تم إلغاء حماية المطور ✅
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // منع عناق البوت فقط
    if (targetID === api.getCurrentUserID()) {
        return api.sendMessage(
            `⌬ ━━ HINA FUN ━━ ⌬\n\n😅 لا يمكنك عناقي! أنا هنا لمساعدتك.`,
            threadID,
            messageID
        );
    }

    try {
        const response = await axios.get('https://nekos.best/api/v2/hug');
        const gifUrl = response.data.results[0].url;
        
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        
        const gifPath = path.join(cacheDir, `hug_${Date.now()}.gif`);
        const gifResponse = await axios.get(gifUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(gifPath, Buffer.from(gifResponse.data));
        
        await api.sendMessage({
            body: `⌬ ━━ HINA FUN ━━ ⌬\n\n🤗 ${senderName} يعانق ${targetName}! 💕`,
            attachment: fs.createReadStream(gifPath)
        }, threadID, () => {
            if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
        }, messageID);
        
    } catch (error) {
        console.error("❌ خطأ في عناق:", error);
        return api.sendMessage(
            `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ فشل جلب صورة العناق. حاول مرة أخرى.`,
            threadID,
            messageID
        );
    }
};