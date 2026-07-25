const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports.config = {
    name: "قولي",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "تحويل النص إلى صوت بلهجة سعودية واضحة",
    commandCategory: "media",
    usages: "[النص]",
    cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;
    const content = args.join(" ");

    if (!content) return api.sendMessage(
        `⌬ ━━ HINA VOICE ━━ ⌬\n\n⚠️ اكتب النص اللي تبيني أقوله يا بطل!`,
        threadID,
        messageID
    );

    // التأكد من وجود مجلد cache
    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }

    try {
        // تحديد اللغة
        const lang = /[\u0600-\u06FF]/.test(content) ? 'ar' : 'en';
        
        // ✅ الرابط الجديد (يعمل)
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(content)}&tl=${lang}&client=gtx`;

        const cachePath = path.join(cacheDir, `say_${Date.now()}.mp3`);

        const res = await axios({
            method: 'get',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const writer = fs.createWriteStream(cachePath);
        res.data.pipe(writer);

        writer.on('finish', () => {
            api.sendMessage({
                body: `⌬ ━━ HINA VOICE ━━ ⌬\n\n✅ تفضل الاستماع:`,
                attachment: fs.createReadStream(cachePath)
            }, threadID, () => {
                if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
            }, messageID);
        });

        writer.on('error', () => {
            api.sendMessage(
                `⌬ ━━ HINA VOICE ━━ ⌬\n\n⚠️ فشل في حفظ ملف الصوت.`,
                threadID,
                messageID
            );
        });

    } catch (error) {
        console.error("❌ خطأ في قولي:", error);
        api.sendMessage(
            `⌬ ━━ HINA VOICE ━━ ⌬\n\n⚠️ عذراً، خوادم الصوت لا تستجيب حالياً.\n📝 ${error.message}`,
            threadID,
            messageID
        );
    }
};
