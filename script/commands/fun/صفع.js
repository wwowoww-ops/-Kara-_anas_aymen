const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "صفع",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "صفع شخص ما",
    commandCategory: "fun",
    usages: "صفع [@منشن] أو رد على رسالة",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args, Users }) {
    const { threadID, messageID, senderID, mentions, messageReply } = event;
    
    let targetID;
    let targetName = "شخص ما";

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // الحالة 1: رد على رسالة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (messageReply) {
        targetID = messageReply.senderID;
        try {
            const userInfo = await api.getUserInfo(targetID);
            targetName = userInfo[targetID]?.name || "الشخص";
        } catch (e) {
            targetName = "الشخص";
        }
    } 
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // الحالة 2: منشن
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    else if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
        targetName = mentions[targetID].replace("@", "");
    } 
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // الحالة 3: لا يوجد مستهدف
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    else {
        return api.sendMessage(
            `⌬ ━━ HINA FUN ━━ ⌬\n\n📝 الاستخدام:\n• صفع @منشن\n• أو رد على رسالة العضو`,
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

    // منع صفع البوت نفسه
    if (targetID === api.getCurrentUserID()) {
        return api.sendMessage(
            `⌬ ━━ HINA FUN ━━ ⌬\n\n😅 لا يمكنك صفعي! أنا هنا لمساعدتك.`,
            threadID,
            messageID
        );
    }

    // منع صفع المطور
    const config = JSON.parse(fs.readFileSync("./config.json"));
    const devID = config.KIRA_CONF?.dev || config.ADMINBOT?.[0];
    if (targetID === devID) {
        return api.sendMessage(
            `⌬ ━━ HINA FUN ━━ ⌬\n\n🛡️ لا يمكنك صفع المطور!`,
            threadID,
            messageID
        );
    }

    try {
        // جلب GIF عشوائي
        const response = await axios.get('https://nekos.best/api/v2/slap');
        const gifUrl = response.data.results[0].url;
        
        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        
        const gifPath = path.join(cacheDir, `slap_${Date.now()}.gif`);
        const gifResponse = await axios.get(gifUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(gifPath, Buffer.from(gifResponse.data));
        
        await api.sendMessage({
            body: `⌬ ━━ HINA FUN ━━ ⌬\n\n👋 ${senderName} يصفع ${targetName}! 😂`,
            attachment: fs.createReadStream(gifPath)
        }, threadID, () => {
            if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
        }, messageID);
        
    } catch (error) {
        console.error("❌ خطأ في صفع:", error);
        return api.sendMessage(
            `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ فشل جلب الصورة. حاول مرة أخرى.`,
            threadID,
            messageID
        );
    }
};