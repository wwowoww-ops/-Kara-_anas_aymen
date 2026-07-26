const { Groq } = require('groq-sdk');
const fs = require("fs");

module.exports.config = {
    name: "رسالة_حب",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "كتابة رسائل رومانسية وكلمات جميلة",
    commandCategory: "fun",
    usages: "رسالة_حب [المناسبة أو الموضوع]",
    cooldowns: 5
};

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    
    try {
        // قراءة مفتاح API من config.json
        const config = JSON.parse(fs.readFileSync("./config.json"));
        const apiKey = config.MODEL_API_KEY;

        if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
            return api.sendMessage(
                `⌬ ━━ HINA FUN ━━ ⌬\n\n⚠️ مفتاح الذكاء الاصطناعي غير مضبوط.\n📌 أضف MODEL_API_KEY في config.json`,
                threadID,
                messageID
            );
        }

        const occasion = args.join(" ") || "رسالة حب عامة";

        const waitMsg = await api.sendMessage(
            `💌 جاري كتابة رسالة رومانسية...\n❤️ بكل مشاعر صادقة...`,
            threadID
        );

        const groq = new Groq({
            apiKey: apiKey
        });

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "أنت كاتب رومانسي محترف. تكتب رسائل حب صادقة وجميلة بلغة عربية راقية. استخدم كلمات جميلة ومعبرة دون مبالغة."
                },
                {
                    role: "user",
                    content: `اكتب رسالة حب جميلة ومعبرة عن: ${occasion}\n\nاجعل الرسالة:\n- صادقة ومؤثرة\n- بلغة عربية راقية\n- بطول مناسب (150-200 كلمة)\n- تحتوي على مشاعر حقيقية\n- مناسبة للمناسبة المذكورة\n\nلا تذكر أي أسماء، اجعلها عامة.`
                }
            ],
            model: "llama3-70b-8192",
            temperature: 0.9,
            max_tokens: 1024,
            top_p: 0.95
        });

        const letter = chatCompletion.choices[0]?.message?.content || "عذراً، لم أتمكن من كتابة الرسالة.";

        api.unsendMessage(waitMsg.messageID);

        return api.sendMessage(
            `⌬ ━━ HINA FUN ━━ ⌬\n\n💌 رسالة رومانسية\n\n` +
            `${letter}\n\n` +
            `━━━━━━━━━━━━━━━\n` +
            `❤️ كُتبت بكل مشاعر صادقة\n` +
            `💝 المناسبة: ${occasion}`,
            threadID,
            messageID
        );

    } catch (error) {
        console.error("❌ خطأ في رسالة_حب:", error);
        return api.sendMessage(
            `⌬ ━━ HINA FUN ━━ ⌬\n\n⚠️ حدث خطأ: ${error.message}`,
            threadID,
            messageID
        );
    }
};