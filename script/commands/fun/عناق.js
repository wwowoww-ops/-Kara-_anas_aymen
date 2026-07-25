const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "عناق",
    version: "2.1.0",
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

    // منع عناق البوت فقط
    if (targetID === api.getCurrentUserID()) {
        return api.sendMessage(
            `⌬ ━━ HINA FUN ━━ ⌬\n\n😅 لا يمكنك عناقي! أنا هنا لمساعدتك.`,
            threadID,
            messageID
        );
    }

    try {
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 🔄 محاولة جلب GIF من عدة مصادر
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        let gifUrl = null;
        let apiError = false;

        // المصدر 1: nekos.best
        try {
            const response = await axios.get('https://nekos.best/api/v2/hug', { timeout: 5000 });
            if (response.data && response.data.results && response.data.results[0]) {
                gifUrl = response.data.results[0].url;
            }
        } catch (e) {
            console.log("⚠️ المصدر 1 فشل:", e.message);
        }

        // المصدر 2: nekos.life (بديل)
        if (!gifUrl) {
            try {
                const response = await axios.get('https://nekos.life/api/v2/img/hug', { timeout: 5000 });
                if (response.data && response.data.url) {
                    gifUrl = response.data.url;
                }
            } catch (e) {
                console.log("⚠️ المصدر 2 فشل:", e.message);
            }
        }

        // المصدر 3: صور ثابتة (في حالة فشل جميع الـ APIs)
        if (!gifUrl) {
            const fallbackImages = [
                "https://i.imgur.com/4R3vX6k.gif",
                "https://i.imgur.com/zRkBZOV.jpeg",
                "https://i.imgur.com/co4wnOI.jpg"
            ];
            gifUrl = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
            console.log("✅ استخدام صورة احتياطية");
        }

        const cacheDir = path.join(__dirname, 'cache');
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        
        const gifPath = path.join(cacheDir, `hug_${Date.now()}.gif`);
        const gifResponse = await axios.get(gifUrl, { 
            responseType: 'arraybuffer',
            timeout: 10000 
        });
        fs.writeFileSync(gifPath, Buffer.from(gifResponse.data));
        
        await api.sendMessage({
            body: `⌬ ━━ HINA FUN ━━ ⌬\n\n🤗 ${senderName} يعانق ${targetName}! 💕`,
            attachment: fs.createReadStream(gifPath)
        }, threadID, () => {
            if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath);
        }, messageID);
        
    } catch (error) {
        console.error("❌ خطأ في عناق:", error);
        
        // رسالة بديلة في حالة فشل كل شيء
        return api.sendMessage(
            `⌬ ━━ HINA FUN ━━ ⌬\n\n🤗 ${senderName} يعانق ${targetName}! 💕\n\n💡 تعذر جلب الصورة، لكن العناق وصل ❤️`,
            threadID,
            messageID
        );
    }
};