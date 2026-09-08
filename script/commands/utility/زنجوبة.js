"use strict";

const axios = require("axios");

// ==================================================
// تخزين جلسات المستخدمين
// ==================================================

if (!global.zanjoubaSessions) {
    global.zanjoubaSessions = new Map();
}

// ==================================================
// التحقق من اللغة
// ==================================================

function hasArabic(text) {
    return /[\u0600-\u06FF]/.test(String(text || ""));
}

// ==================================================
// الترجمة
// ==================================================

async function translateTo(text, targetLang) {

    if (!text || !targetLang) {
        return text;
    }

    try {

        const url =
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
                String(text).slice(0, 1000)
            )}`;

        const res = await axios.get(
            url,
            {
                timeout: 8000
            }
        );

        return res.data[0]
            .map(x => x[0])
            .join("");

    } catch {

        return text;

    }
}

// ==================================================
// توطين المحتوى
// ==================================================

async function localizeContent(text, lang) {

    if (!text) {
        return text;
    }

    if (
        lang === "en" &&
        hasArabic(text)
    ) {
        return translateTo(text, "en");
    }

    if (
        lang === "ar" &&
        !hasArabic(text)
    ) {
        return translateTo(text, "ar");
    }

    return text;
}

// ==================================================
// صندوق الرسائل
// ==================================================

const BOX = (
    title,
    lines,
    footer = null
) => {

    let m =
        `●─────── ✾ ───────●\n` +
        ` ⦿ ⟬ ${title} ⟭ ⦿\n` +
        `⊱ ────────────── ⊰\n`;

    for (const l of lines) {

        if (!l && l !== 0) {

            m += `\n`;

        } else {

            m += `  ⟣ ${l}\n`;

        }

    }

    if (footer) {

        m +=
            `⊱ ────────────── ⊰\n`;

        for (const f of footer) {

            if (!f && f !== 0) {

                m += `\n`;

            } else {

                m += `  ⟣ ${f}\n`;

            }

        }

    }

    return m +
        "●─────── ✾ ───────●";
};

// ==================================================
// إعدادات الشخصية
// ==================================================

const CONFIG = {

    slug: "hYq2TdXKPDxt4n3CjaFK2",

    userid: "supergamelvl@gmail.com",

    langcode: "ar",

    characterName: "زنجوبة",

    apiKey1: "dwlS0F7cEF35xpaNlfnCv5TNpTL6K27b6HHTRGQj",

    apiKey2: "OP2N3hYKC83GpPc1irCbs8IJarRnIwF87tjQAGQx"

};

// ==================================================
// جلب معلومات الشخصية
// ==================================================

async function getCharacterInfo(lang) {

    try {

        const res = await axios({

            method: "GET",

            url:
                `https://kdkorymivzejaxpmdpywzeo7m40xqyfl.lambda-url.ap-northeast-2.on.aws?action=db&slug=${CONFIG.slug}&langcode=${lang}`,

            headers: {

                "User-Agent": "okhttp/4.9.2",

                "Accept": "application/json",

                "x-api-key": CONFIG.apiKey1

            }

        });

        return res.data;

    } catch (e) {

        console.error(
            "فشل جلب معلومات زنجوبة، استخدام الافتراضي"
        );

        const getLangLocal = (key) =>
            module.exports.langs[lang]?.[key] ||
            module.exports.langs.ar[key];

        return {

            name:
                lang === "en"
                    ? "Zanjouba"
                    : "زنجوبة",

            description:
                getLangLocal("zanjoubaDesc"),

            first_mes:
                getLangLocal("zanjoubaFirstMsg")

        };

    }

}

// ==================================================
// إرسال الرسائل إلى AI
// ==================================================

async function sendToAI(messages) {

    const response = await axios({

        method: "POST",

        url:
            "https://gfcco2htytcmx37orxkzgm67eu0xcrcf.lambda-url.ap-northeast-2.on.aws",

        headers: {

            "User-Agent": "okhttp/4.9.2",

            "Accept": "application/json",

            "Content-Type": "application/json",

            "x-api-key": CONFIG.apiKey2

        },

        data: {

            messages,

            n_predict: 300,

            stop: [
                "</s>",
                "<|end|>",
                "<|eot_id|>",
                "<|end_of_text|>",
                "<|im_end|>",
                "/autoritetsdata",
                "<|END_OF_TURN_TOKEN|>",
                "<|end_of_turn|>",
                "<|endoftext|>",
                "<end_of_turn>",
                "<eos>"
            ],

            model: "claude"

        },

        timeout: 60000

    });

    return response.data;

}

// ==================================================
// استخراج الرد
// ==================================================

function extractReply(data) {

    let text = "";

    if (
        data.candidates &&
        data.candidates[0]?.content?.parts?.[0]?.text
    ) {

        text =
            data.candidates[0]
                .content
                .parts[0]
                .text;

    } else {

        text =
            data.content ||
            data.response ||
            data.text ||
            "";

    }

    return text

        .replace(
            /## Approved\s*\n*### Response\s*\n*/g,
            ""
        )

        .replace(
            /!\[.*?\]\(.*?\)/g,
            ""
        )

        .replace(
            /{{img:.*?}}/g,
            ""
        )

        .replace(
            /```[\s\S]*?```/g,
            ""
        )

        .trim();

}

// ==================================================
// بناء سجل المحادثة
// ==================================================

function buildMessages(
    session,
    newMessage,
    systemPrompt
) {

    const messages = [

        {
            role: "user",
            parts: [
                {
                    text: systemPrompt
                }
            ]
        },

        {
            role: "user",
            parts: [
                {
                    text:
                        `أنت الآن ${session.character.name || "زنجوبة"}. ` +
                        `${session.character.description || ""}`
                }
            ]
        },

        {
            role: "model",
            parts: [
                {
                    text:
                        session.character.first_mes ||
                        "أهلاً~"
                }
            ]
        }

    ];

    const recentHistory =
        session.history.slice(-6);

    for (const msg of recentHistory) {

        if (msg.role === "user") {

            messages.push({

                role: "user",

                parts: [
                    {
                        text: msg.content
                    }
                ]

            });

        } else if (
            msg.role === "assistant"
        ) {

            messages.push({

                role: "model",

                parts: [
                    {
                        text: msg.content
                    }
                ]

            });

        }

    }

    messages.push({

        role: "user",

        parts: [
            {
                text: newMessage
            }
        ]

    });

    return messages;
}

// ==================================================
// الأمر
// ==================================================

module.exports = {

    config: {

        name: "زنجوبة",

        enname: "zanjouba",

        version: "2.2",

        author: "Yamada KJ (تحويل ثنائي)",

        countDown: 3,

        role: 0,

        description:
            "تحدث مع زنجوبة باللغتين العربية والإنجليزية",

        guide:
            "{pn} [رسالة]",

        category: "ai",

        usePrefix: true,

        aliases: [
            "زنجوبة",
            "zanjouba"
        ]

    },

    // ==================================================
    // اللغات
    // ==================================================

    langs: {

        ar: {

            alertTitle:
                "❌ تَنْبِيه",

            alertBody:
                "أدخل رسالة للدردشة مع زنجوبة.",

            chatTitle:
                "💬 زَنْجُوبَة",

            errorTitle:
                "❌ خَطَأ",

            errorBody1:
                "حدث خطأ أثناء التواصل مع زنجوبة.",

            errorBody2:
                "حاول مرة أخرى لاحقاً.",

            errorConnect:
                "فشل الاتصال بزنجوبة، حاول مرة أخرى.",

            zanjoubaDesc:
                "زنجوبة، شخصية هادئة ومجتهدة. تتحدث بأدب واحترام لكنها حادة أحياناً. تستخدم \"~\" في نهاية الجمل أحياناً.",

            zanjoubaFirstMsg:
                "أهلاً~ أنا زنجوبة. كيف يمكنني مساعدتك؟",

            systemPrompt:
                "أنت زنجوبة. تحدثي بأدب واحترام، استخدمي \"~\" في نهاية الجمل أحياناً. ردي باللغة العربية دائماً وبأسلوب لطيف."

        },

        en: {

            alertTitle:
                "❌ WARNING",

            alertBody:
                "Please enter a message to chat with Zanjouba.",

            chatTitle:
                "💬 ZANJOUBA",

            errorTitle:
                "❌ ERROR",

            errorBody1:
                "An error occurred while communicating with Zanjouba.",

            errorBody2:
                "Please try again later.",

            errorConnect:
                "Failed to connect to Zanjouba, please try again.",

            zanjoubaDesc:
                "Zanjouba is a calm and hardworking character. She speaks politely and respectfully but can be sharp at times. She occasionally uses \"~\" at the end of sentences.",

            zanjoubaFirstMsg:
                "Hello~ I am Zanjouba. How can I help you?",

            systemPrompt:
                "You are Zanjouba. Speak politely and respectfully, occasionally using \"~\" at the end of sentences. Always reply in English in a sweet demeanor."

        }

    },

    // ==================================================
    // توافق مع اللودر القديم
    // ==================================================

    async run({
        api,
        event,
        args,
        threadsData,
        getLang
    }) {

        return this.onStart({
            api,
            event,
            args,
            threadsData,
            getLang
        });

    },

    // ==================================================
    // بداية الأمر
    // ==================================================

    async onStart({
        api,
        event,
        args,
        threadsData,
        getLang
    }) {

        const {
            threadID,
            messageID,
            senderID,
            messageReply
        } = event;

        const cmdName =
            this.config.name;

        const userMessage =
            args.join(" ").trim();

        let lang;

        try {

            const td =
                await threadsData.get(threadID);

            lang =
                td?.data?.lang ||
                global.GoatBot.config.language ||
                "ar";

        } catch {

            lang = "ar";

        }

        if (
            !["ar", "en"].includes(lang)
        ) {

            lang = "ar";

        }

        const messageText =
            userMessage ||
            (
                messageReply &&
                messageReply.body
            );

        if (!messageText) {

            return api.sendMessage(

                BOX(
                    getLang("alertTitle"),
                    [
                        getLang("alertBody")
                    ]
                ),

                threadID,

                messageID

            );

        }

        api.setMessageReaction(
            "💭",
            messageID,
            () => {},
            true
        );

        let session =
            global.zanjoubaSessions.get(senderID);

        if (!session) {

            const charInfo =
                await getCharacterInfo(lang);

            charInfo.name =
                await localizeContent(
                    charInfo.name,
                    lang
                );

            charInfo.description =
                await localizeContent(
                    charInfo.description,
                    lang
                );

            charInfo.first_mes =
                await localizeContent(
                    charInfo.first_mes,
                    lang
                );

            session = {

                history: [],

                character: charInfo

            };

            global.zanjoubaSessions.set(
                senderID,
                session
            );

        }

        const systemPrompt =
            getLang("systemPrompt");

        const messages =
            buildMessages(
                session,
                messageText,
                systemPrompt
            );

        try {

            const aiData =
                await sendToAI(messages);

            let aiReply =
                extractReply(aiData);

            if (!aiReply) {

                throw new Error(
                    "رد فارغ من AI"
                );

            }

            aiReply =
                await localizeContent(
                    aiReply,
                    lang
                );

            session.history.push({

                role: "user",

                content: messageText

            });

            session.history.push({

                role: "assistant",

                content: aiReply

            });

            if (
                session.history.length > 20
            ) {

                session.history =
                    session.history.slice(-20);

            }

            api.setMessageReaction(
                "✅",
                messageID,
                () => {},
                true
            );

            const sentMsg =
                await new Promise(resolve =>

                    api.sendMessage(

                        BOX(
                            getLang("chatTitle"),
                            [
                                aiReply
                            ]
                        ),

                        threadID,

                        (err, info) =>
                            resolve(
                                err
                                    ? null
                                    : info
                            ),

                        messageID

                    )

                );

            if (
                sentMsg?.messageID
            ) {

                global.GoatBot.onReply.set(

                    sentMsg.messageID,

                    {

                        commandName:
                            cmdName,

                        author:
                            senderID,

                        history:
                            session.history.slice(),

                        character:
                            session.character,

                        lang:
                            lang

                    }

                );

            }

        } catch (err) {

            console.error(
                "خطأ زنجوبة:",
                err
            );

            api.setMessageReaction(
                "❌",
                messageID,
                () => {},
                true
            );

            api.sendMessage(

                BOX(
                    getLang("errorTitle"),
                    [
                        getLang("errorBody1"),
                        getLang("errorBody2")
                    ]
                ),

                threadID,

                messageID

            );

        }

    },

    // ==================================================
    // الرد على رسالة زنجوبة
    // ==================================================

    async onReply({
        api,
        event,
        Reply
    }) {

        const {
            threadID,
            messageID,
            senderID,
            body
        } = event;

        if (
            senderID !== Reply.author
        ) {

            return;

        }

        const userMessage =
            (body || "").trim();

        if (!userMessage) {

            return;

        }

        const cmdName =
            this.config.name;

        api.setMessageReaction(
            "💭",
            messageID,
            () => {},
            true
        );

        const lang =
            Reply.lang || "ar";

        const getLang =
            (key, ...args) => {

                const langData =
                    module.exports.langs[lang] ||
                    module.exports.langs.ar;

                let text =
                    langData[key] || "";

                for (
                    let i = 0;
                    i < args.length;
                    i++
                ) {

                    text =
                        text.replace(
                            new RegExp(
                                `%${i + 1}`,
                                "g"
                            ),
                            args[i]
                        );

                }

                return text;

            };

        let session =
            global.zanjoubaSessions.get(
                senderID
            );

        if (!session) {

            session = {

                history:
                    Reply.history || [],

                character:
                    Reply.character ||
                    await getCharacterInfo(lang)

            };

            global.zanjoubaSessions.set(
                senderID,
                session
            );

        } else {

            if (Reply.history) {

                session.history =
                    Reply.history;

            }

            if (Reply.character) {

                session.character =
                    Reply.character;

            }

        }

        const systemPrompt =
            getLang("systemPrompt");

        const messages =
            buildMessages(
                session,
                userMessage,
                systemPrompt
            );

        try {

            const aiData =
                await sendToAI(messages);

            let aiReply =
                extractReply(aiData);

            if (!aiReply) {

                throw new Error(
                    "رد فارغ"
                );

            }

            aiReply =
                await localizeContent(
                    aiReply,
                    lang
                );

            session.history.push({

                role: "user",

                content: userMessage

            });

            session.history.push({

                role: "assistant",

                content: aiReply

            });

            if (
                session.history.length > 20
            ) {

                session.history =
                    session.history.slice(-20);

            }

            api.setMessageReaction(
                "✅",
                messageID,
                () => {},
                true
            );

            const sentMsg =
                await new Promise(resolve =>

                    api.sendMessage(

                        BOX(
                            getLang("chatTitle"),
                            [
                                aiReply
                            ]
                        ),

                        threadID,

                        (err, info) =>
                            resolve(
                                err
                                    ? null
                                    : info
                            ),

                        messageID

                    )

                );

            if (
                sentMsg?.messageID
            ) {

                global.GoatBot.onReply.set(

                    sentMsg.messageID,

                    {

                        commandName:
                            cmdName,

                        author:
                            senderID,

                        history:
                            session.history.slice(),

                        character:
                            session.character,

                        lang:
                            lang

                    }

                );

            }

        } catch (err) {

            console.error(
                "خطأ زنجوبة في الرد:",
                err
            );

            api.setMessageReaction(
                "❌",
                messageID,
                () => {},
                true
            );

            api.sendMessage(

                BOX(
                    getLang("errorTitle"),
                    [
                        getLang("errorConnect")
                    ]
                ),

                threadID,

                messageID

            );

        }

    }

};

التعديل الفعلي الوحيد على المنطق هو إضافة:

async run(...) {
    return this.onStart(...);
}

وغيّرت رقم الإصدار إلى "2.2" فقط لتمييز النسخة.

بهذا اللودر الذي يشترط "config.name + run" سيقبل "زنجوبة.js" بدل ظهورها كـ فشل تحميل.
