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

        const res = await axios.get(url, {
            timeout: 8000
        });

        if (
            !res.data ||
            !Array.isArray(res.data[0])
        ) {
            return text;
        }

        return res.data[0]
            .map(x => x?.[0] || "")
            .join("");

    } catch (error) {
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

    for (const l of lines || []) {

        if (!l && l !== 0) {
            m += `\n`;
        } else {
            m += `  ⟣ ${l}\n`;
        }

    }

    if (footer) {

        m += `⊱ ────────────── ⊰\n`;

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

            },

            timeout: 15000

        });

        if (res.data) {
            return res.data;
        }

        throw new Error(
            "بيانات الشخصية فارغة"
        );

    } catch (error) {

        console.error(
            "[ZANJOUBA] فشل جلب معلومات الشخصية:",
            error.message
        );

        const langData =
            module.exports.langs?.[lang] ||
            module.exports.langs?.ar;

        return {

            name:
                lang === "en"
                    ? "Zanjouba"
                    : "زنجوبة",

            description:
                langData?.zanjoubaDesc ||
                "زنجوبة شخصية هادئة ومجتهدة.",

            first_mes:
                langData?.zanjoubaFirstMsg ||
                "أهلاً~ أنا زنجوبة. كيف يمكنني مساعدتك؟"

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

    if (!data) {
        return "";
    }

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

    if (
        typeof text !== "string"
    ) {

        text =
            String(text || "");

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

    const character =
        session?.character || {};

    const history =
        Array.isArray(session?.history)
            ? session.history
            : [];

    const messages = [

        {

            role: "user",

            parts: [
                {
                    text:
                        systemPrompt ||
                        "تحدث بأدب واحترام."
                }
            ]

        },

        {

            role: "user",

            parts: [
                {
                    text:
                        `أنت الآن ${character.name || "زنجوبة"}. ` +
                        `${character.description || ""}`
                }
            ]

        },

        {

            role: "model",

            parts: [
                {
                    text:
                        character.first_mes ||
                        "أهلاً~"
                }
            ]

        }

    ];

    const recentHistory =
        history.slice(-6);

    for (const msg of recentHistory) {

        if (
            !msg ||
            !msg.content
        ) {
            continue;
        }

        if (
            msg.role === "user"
        ) {

            messages.push({

                role: "user",

                parts: [
                    {
                        text:
                            String(msg.content)
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
                        text:
                            String(msg.content)
                    }
                ]

            });

        }

    }

    messages.push({

        role: "user",

        parts: [
            {
                text:
                    String(newMessage || "")
            }
        ]

    });

    return messages;
}

// ==================================================
// التفاعل مع الرسالة
// ==================================================

function react(
    api,
    messageID,
    reaction
) {

    if (
        !api ||
        typeof api.setMessageReaction !== "function" ||
        !messageID
    ) {
        return;
    }

    try {

        api.setMessageReaction(
            reaction,
            String(messageID),
            () => {},
            true
        );

    } catch (error) {

        console.error(
            `[ZANJOUBA REACTION] ${error.message}`
        );

    }

}

// ==================================================
// الحصول على اللغة
// ==================================================

async function getThreadLanguage(
    threadsData,
    threadID
) {

    let lang = "ar";

    try {

        if (
            threadsData &&
            typeof threadsData.get === "function"
        ) {

            const td =
                await threadsData.get(
                    threadID
                );

            lang =
                td?.data?.lang ||
                td?.lang ||
                lang;

        }

    } catch (error) {

        console.error(
            "[ZANJOUBA LANGUAGE]",
            error.message
        );

    }

    try {

        if (
            !["ar", "en"].includes(lang) &&
            global.GoatBot?.config?.language
        ) {

            lang =
                global.GoatBot.config.language;

        }

    } catch (error) {}

    if (
        !["ar", "en"].includes(lang)
    ) {

        lang = "ar";

    }

    return lang;
}

// ==================================================
// دالة اللغة المحلية
// ==================================================

function makeGetLang(lang) {

    return function getLang(
        key,
        ...args
    ) {

        const langData =
            module.exports.langs?.[lang] ||
            module.exports.langs?.ar ||
            {};

        let text =
            langData[key] ||
            module.exports.langs?.ar?.[key] ||
            key ||
            "";

        for (
            let i = 0;
            i < args.length;
            i++
        ) {

            text =
                String(text).replace(
                    new RegExp(
                        `%${i + 1}`,
                        "g"
                    ),
                    String(args[i])
                );

        }

        return text;

    };

}

// ==================================================
// تسجيل Reply في نظام البوت القديم
// ==================================================

function registerHandleReply(
    messageID,
    data
) {

    if (!messageID) {
        return;
    }

    if (
        !global.client ||
        !Array.isArray(
            global.client.handleReply
        )
    ) {

        console.error(
            "[ZANJOUBA] global.client.handleReply غير متوفر"
        );

        return;

    }

    try {

        const oldIndex =
            global.client.handleReply.findIndex(
                item =>
                    String(item.messageID) ===
                    String(messageID)
            );

        if (oldIndex !== -1) {

            global.client.handleReply.splice(
                oldIndex,
                1
            );

        }

        global.client.handleReply.push({

            messageID:
                String(messageID),

            name:
                "زنجوبة",

            author:
                String(data.author),

            history:
                Array.isArray(data.history)
                    ? data.history.slice()
                    : [],

            character:
                data.character ||
                null,

            lang:
                data.lang ||
                "ar"

        });

        console.log(
            `[ZANJOUBA] تم تسجيل Reply: ${messageID}`
        );

    } catch (error) {

        console.error(
            "[ZANJOUBA REPLY REGISTER]",
            error
        );

    }

}

// ==================================================
// الأمر
// ==================================================

module.exports = {

    config: {

        name: "زنجوبة",

        enname: "zanjouba",

        version: "2.4",

        author:
            "Yamada KJ (تحويل ثنائي)",

        countDown: 3,

        role: 0,

        description:
            "تحدث مع زنجوبة باللغتين العربية والإنجليزية",

        guide:
            "{pn} [رسالة]",

        category:
            "ai",

        usePrefix:
            true,

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

        try {

            const safeArgs =
                Array.isArray(args)
                    ? args
                    : [];

            let lang;

            if (
                typeof getLang === "function"
            ) {

                lang =
                    await getThreadLanguage(
                        threadsData,
                        event?.threadID
                    );

            } else {

                lang =
                    await getThreadLanguage(
                        threadsData,
                        event?.threadID
                    );

            }

            const localGetLang =
                typeof getLang === "function"
                    ? getLang
                    : makeGetLang(lang);

            return await this.onStart({

                api,

                event,

                args:
                    safeArgs,

                threadsData,

                getLang:
                    localGetLang

            });

        } catch (error) {

            console.error(
                "[ZANJOUBA RUN ERROR]",
                error
            );

            try {

                if (
                    event?.threadID
                ) {

                    await api.sendMessage(

                        "❌ حدث خطأ أثناء تنفيذ أمر زنجوبة",

                        event.threadID,

                        event.messageID

                    );

                }

            } catch (sendError) {

                console.error(
                    "[ZANJOUBA RUN SEND ERROR]",
                    sendError
                );

            }

        }

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

        try {

            const threadID =
                event?.threadID;

            const messageID =
                event?.messageID;

            const senderID =
                event?.senderID;

            if (
                !threadID ||
                !senderID
            ) {

                console.error(
                    "[ZANJOUBA] بيانات الحدث ناقصة"
                );

                return;

            }

            const safeArgs =
                Array.isArray(args)
                    ? args
                    : [];

            const lang =
                await getThreadLanguage(
                    threadsData,
                    threadID
                );

            const localGetLang =
                typeof getLang === "function"
                    ? getLang
                    : makeGetLang(lang);

            const cmdName =
                this.config.name;

            const userMessage =
                safeArgs
                    .join(" ")
                    .trim();

            const messageText =
                userMessage ||
                String(
                    event?.messageReply?.body ||
                    ""
                ).trim();

            if (!messageText) {

                await api.sendMessage(

                    BOX(
                        localGetLang(
                            "alertTitle"
                        ),
                        [
                            localGetLang(
                                "alertBody"
                            )
                        ]
                    ),

                    threadID,

                    messageID

                );

                return;

            }

            react(
                api,
                messageID,
                "💭"
            );

            let session =
                global.zanjoubaSessions.get(
                    String(senderID)
                );

            if (!session) {

                const charInfo =
                    await getCharacterInfo(
                        lang
                    );

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

                    character:
                        charInfo

                };

                global.zanjoubaSessions.set(
                    String(senderID),
                    session
                );

            }

            const systemPrompt =
                localGetLang(
                    "systemPrompt"
                );

            const messages =
                buildMessages(
                    session,
                    messageText,
                    systemPrompt
                );

            const aiData =
                await sendToAI(
                    messages
                );

            let aiReply =
                extractReply(
                    aiData
                );

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

                role:
                    "user",

                content:
                    messageText

            });

            session.history.push({

                role:
                    "assistant",

                content:
                    aiReply

            });

            if (
                session.history.length > 20
            ) {

                session.history =
                    session.history.slice(-20);

            }

            react(
                api,
                messageID,
                "✅"
            );

            const sentMsg =
                await new Promise(
                    resolve => {

                        try {

                            api.sendMessage(

                                BOX(
                                    localGetLang(
                                        "chatTitle"
                                    ),
                                    [
                                        aiReply
                                    ]
                                ),

                                threadID,

                                (
                                    err,
                                    info
                                ) => {

                                    if (err) {

                                        console.error(
                                            "[ZANJOUBA SEND]",
                                            err
                                        );

                                        resolve(
                                            null
                                        );

                                        return;

                                    }

                                    resolve(
                                        info ||
                                        null
                                    );

                                },

                                messageID

                            );

                        } catch (error) {

                            console.error(
                                "[ZANJOUBA SEND EXCEPTION]",
                                error
                            );

                            resolve(
                                null
                            );

                        }

                    }
                );

            if (
                sentMsg?.messageID
            ) {

                registerHandleReply(

                    sentMsg.messageID,

                    {

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

        } catch (error) {

            console.error(
                "[ZANJOUBA ERROR]",
                error
            );

            react(
                api,
                event?.messageID,
                "❌"
            );

            try {

                const lang =
                    await getThreadLanguage(
                        threadsData,
                        event?.threadID
                    );

                const getLangLocal =
                    makeGetLang(lang);

                await api.sendMessage(

                    BOX(
                        getLangLocal(
                            "errorTitle"
                        ),
                        [
                            getLangLocal(
                                "errorBody1"
                            ),
                            getLangLocal(
                                "errorBody2"
                            )
                        ]
                    ),

                    event.threadID,

                    event.messageID

                );

            } catch (sendError) {

                console.error(
                    "[ZANJOUBA ERROR SEND]",
                    sendError
                );

            }

        }

    },

    // ==================================================
    // نظام Reply القديم الخاص بالبوت
    // ==================================================

    async handleReply({
        api,
        event,
        handleReply
    }) {

        try {

            if (!handleReply) {
                return;
            }

            const threadID =
                event?.threadID;

            const messageID =
                event?.messageID;

            const senderID =
                event?.senderID;

            const body =
                String(
                    event?.body ||
                    ""
                ).trim();

            if (
                !threadID ||
                !senderID
            ) {

                return;

            }

            // ==========================================
            // السماح فقط لصاحب المحادثة
            // ==========================================

            if (
                String(senderID) !==
                String(handleReply.author)
            ) {

                return;

            }

            if (!body) {
                return;
            }

            const cmdName =
                this.config.name;

            const lang =
                ["ar", "en"].includes(
                    handleReply.lang
                )
                    ? handleReply.lang
                    : "ar";

            const getLang =
                makeGetLang(lang);

            react(
                api,
                messageID,
                "💭"
            );

            // ==========================================
            // استرجاع الجلسة
            // ==========================================

            let session =
                global.zanjoubaSessions.get(
                    String(senderID)
                );

            if (!session) {

                session = {

                    history:
                        Array.isArray(
                            handleReply.history
                        )
                            ? handleReply.history.slice()
                            : [],

                    character:
                        handleReply.character ||
                        await getCharacterInfo(
                            lang
                        )

                };

                global.zanjoubaSessions.set(
                    String(senderID),
                    session
                );

            } else {

                if (
                    Array.isArray(
                        handleReply.history
                    )
                ) {

                    session.history =
                        handleReply.history.slice();

                }

                if (
                    handleReply.character
                ) {

                    session.character =
                        handleReply.character;

                }

            }

            // ==========================================
            // بناء المحادثة
            // ==========================================

            const systemPrompt =
                getLang(
                    "systemPrompt"
                );

            const messages =
                buildMessages(
                    session,
                    body,
                    systemPrompt
                );

            // ==========================================
            // الاتصال بالذكاء الاصطناعي
            // ==========================================

            const aiData =
                await sendToAI(
                    messages
                );

            let aiReply =
                extractReply(
                    aiData
                );

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

            // ==========================================
            // حفظ المحادثة
            // ==========================================

            session.history.push({

                role:
                    "user",

                content:
                    body

            });

            session.history.push({

                role:
                    "assistant",

                content:
                    aiReply

            });

            if (
                session.history.length > 20
            ) {

                session.history =
                    session.history.slice(-20);

            }

            react(
                api,
                messageID,
                "✅"
            );

            // ==========================================
            // إرسال الرد
            // ==========================================

            const sentMsg =
                await new Promise(
                    resolve => {

                        try {

                            api.sendMessage(

                                BOX(
                                    getLang(
                                        "chatTitle"
                                    ),
                                    [
                                        aiReply
                                    ]
                                ),

                                threadID,

                                (
                                    err,
                                    info
                                ) => {

                                    if (err) {

                                        console.error(
                                            "[ZANJOUBA REPLY SEND]",
                                            err
                                        );

                                        resolve(
                                            null
                                        );

                                        return;

                                    }

                                    resolve(
                                        info ||
                                        null
                                    );

                                },

                                messageID

                            );

                        } catch (error) {

                            console.error(
                                "[ZANJOUBA REPLY SEND EXCEPTION]",
                                error
                            );

                            resolve(
                                null
                            );

                        }

                    }
                );

            // ==========================================
            // تسجيل الرد التالي
            // ==========================================

            if (
                sentMsg?.messageID
            ) {

                registerHandleReply(

                    sentMsg.messageID,

                    {

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

        } catch (error) {

            console.error(
                "[ZANJOUBA HANDLE REPLY ERROR]",
                error
            );

            react(
                api,
                event?.messageID,
                "❌"
            );

            try {

                const lang =
                    ["ar", "en"].includes(
                        handleReply?.lang
                    )
                        ? handleReply.lang
                        : "ar";

                const getLang =
                    makeGetLang(lang);

                if (
                    event?.threadID
                ) {

                    await api.sendMessage(

                        BOX(
                            getLang(
                                "errorTitle"
                            ),
                            [
                                getLang(
                                    "errorConnect"
                                )
                            ]
                        ),

                        event.threadID,

                        event.messageID

                    );

                }

            } catch (sendError) {

                console.error(
                    "[ZANJOUBA HANDLE REPLY ERROR SEND]",
                    sendError
                );

            }

        }

    }

};