"use strict";

const axios = require("axios");

// ==================================================
// تخزين جلسات المستخدمين
// ==================================================

if (!global.zanjoubaSessions) {
    global.zanjoubaSessions = new Map();
}

// ==================================================
// إعدادات الشخصية
// ==================================================

const CONFIG = {

    slug: "hYq2TdXKPDxt4n3CjaFK2",

    userid: "supergamelvl@gmail.com",

    langcode: "ar",

    characterName: "زنجوبة",

    // Developer ID
    developerID: "61592700121061",

    apiKey1: "dwlS0F7cEF35xpaNlfnCv5TNpTL6K27b6HHTRGQj",

    apiKey2: "OP2N3hYKC83GpPc1irCbs8IJarRnIwF87tjQAGQx"

};

// ==================================================
// التحقق من اللغة
// ==================================================

function hasArabic(text) {
    return /[\u0600-\u06FF]/.test(
        String(text || "")
    );
}

// ==================================================
// تحديد لغة المستخدم
// ==================================================

function detectUserLanguage(text, fallback = "ar") {

    const value =
        String(text || "").trim();

    if (!value) {
        return fallback;
    }

    const arabicChars =
        (value.match(/[\u0600-\u06FF]/g) || []).length;

    const latinChars =
        (value.match(/[A-Za-z]/g) || []).length;

    if (
        arabicChars > latinChars
    ) {
        return "ar";
    }

    if (
        latinChars > arabicChars
    ) {
        return "en";
    }

    return fallback;
}

// ==================================================
// الترجمة
// ==================================================

async function translateTo(
    text,
    targetLang
) {

    if (
        !text ||
        !targetLang
    ) {
        return text;
    }

    try {

        const url =
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(
                String(text).slice(0, 1000)
            )}`;

        const res =
            await axios.get(
                url,
                {
                    timeout: 8000
                }
            );

        if (
            !res.data ||
            !Array.isArray(res.data[0])
        ) {
            return text;
        }

        return res.data[0]
            .map(
                x => x?.[0] || ""
            )
            .join("");

    } catch (error) {

        return text;

    }

}

// ==================================================
// توطين المحتوى
// ==================================================

async function localizeContent(
    text,
    lang
) {

    if (!text) {
        return text;
    }

    if (
        lang === "en" &&
        hasArabic(text)
    ) {

        return translateTo(
            text,
            "en"
        );

    }

    if (
        lang === "ar" &&
        !hasArabic(text)
    ) {

        return translateTo(
            text,
            "ar"
        );

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

    for (
        const l of lines || []
    ) {

        if (
            !l &&
            l !== 0
        ) {

            m += `\n`;

        } else {

            m +=
                `  ⟣ ${l}\n`;

        }

    }

    if (footer) {

        m +=
            `⊱ ────────────── ⊰\n`;

        for (
            const f of footer
        ) {

            if (
                !f &&
                f !== 0
            ) {

                m += `\n`;

            } else {

                m +=
                    `  ⟣ ${f}\n`;

            }

        }

    }

    return (
        m +
        "●─────── ✾ ───────●"
    );

};

// ==================================================
// جلب معلومات الشخصية
// ==================================================

async function getCharacterInfo(
    lang
) {

    try {

        const res =
            await axios({

                method: "GET",

                url:
                    `https://kdkorymivzejaxpmdpywzeo7m40xqyfl.lambda-url.ap-northeast-2.on.aws?action=db&slug=${CONFIG.slug}&langcode=${lang}`,

                headers: {

                    "User-Agent":
                        "okhttp/4.9.2",

                    "Accept":
                        "application/json",

                    "x-api-key":
                        CONFIG.apiKey1

                },

                timeout: 15000

            });

        if (
            res.data
        ) {

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
            module.exports.langs?.ar ||
            {};

        return {

            name:
                lang === "en"
                    ? "Zanjouba"
                    : "زنجوبة",

            description:
                langData.zanjoubaDesc,

            first_mes:
                langData.zanjoubaFirstMsg

        };

    }

}

// ==================================================
// إرسال الرسائل إلى AI
// ==================================================

async function sendToAI(
    messages
) {

    const response =
        await axios({

            method: "POST",

            url:
                "https://gfcco2htytcmx37orxkzgm67eu0xcrcf.lambda-url.ap-northeast-2.on.aws",

            headers: {

                "User-Agent":
                    "okhttp/4.9.2",

                "Accept":
                    "application/json",

                "Content-Type":
                    "application/json",

                "x-api-key":
                    CONFIG.apiKey2

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

                model:
                    "claude"

            },

            timeout: 60000

        });

    return response.data;

}

// ==================================================
// استخراج الرد
// ==================================================

function extractReply(
    data
) {

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
        Array.isArray(
            session?.history
        )
            ? session.history
            : [];

    const messages = [

        {

            role:
                "user",

            parts: [
                {
                    text:
                        systemPrompt ||
                        "تحدث بأدب واحترام."
                }
            ]

        },

        {

            role:
                "user",

            parts: [
                {
                    text:
                        `أنت الآن ${character.name || "زنجوبة"}. ` +
                        `${character.description || ""}`
                }
            ]

        },

        {

            role:
                "model",

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

    for (
        const msg of recentHistory
    ) {

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

                role:
                    "user",

                parts: [
                    {
                        text:
                            String(
                                msg.content
                            )
                    }
                ]

            });

        } else if (
            msg.role === "assistant"
        ) {

            messages.push({

                role:
                    "model",

                parts: [
                    {
                        text:
                            String(
                                msg.content
                            )
                    }
                ]

            });

        }

    }

    messages.push({

        role:
            "user",

        parts: [
            {
                text:
                    String(
                        newMessage || ""
                    )
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
// الحصول على لغة المجموعة
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

function makeGetLang(
    lang
) {

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
// التحقق من المطور
// ==================================================

function isDeveloper(
    senderID
) {

    return (
        String(senderID) ===
        String(CONFIG.developerID)
    );

}

// ==================================================
// تسجيل Reply في النظام القديم
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
                    String(
                        item.messageID
                    ) ===
                    String(
                        messageID
                    )
            );

        if (
            oldIndex !== -1
        ) {

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
                String(
                    data.author
                ),

            history:
                Array.isArray(
                    data.history
                )
                    ? data.history.slice()
                    : [],

            character:
                data.character ||
                null,

            lang:
                data.lang ||
                "ar",

            isDeveloper:
                Boolean(
                    data.isDeveloper
                )

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

        name:
            "زنجوبة",

        enname:
            "zanjouba",

        version:
            "3.0",

        author:
            "Yamada KJ (تحويل ثنائي)",

        countDown:
            3,

        role:
            0,

        description:
            "شخصية زنجوبة الذكية والهادئة والعفوية",

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
                "زنجوبة فتاة هادئة وذكية جداً، عفوية وواثقة من نفسها وتميل إلى النرجسية بشكل واضح لكن بطريقة مرحة. تعرف أنها مميزة ولا تتردد في إظهار ثقتها بنفسها. تكون لطيفة عندما يعاملها الشخص باحترام، وقد تصبح حادة وحازمة عندما يتجاوز أحد حدوده أو يستمر في إزعاجها. لديها تقدير ومودة خاصة لمطورها وتعامله بطريقة مختلفة عن الآخرين.",

            zanjoubaFirstMsg:
                "أهلاً~ أنا زنجوبة. كنت بانتظارك تقريباً، ماذا تريد؟",

            systemPrompt:
                "أنت زنجوبة. شخصيتك هادئة وعفوية وذكية جداً وواثقة من نفسك. لديك قدر واضح من النرجسية، وتعرفين أنك مميزة وذكية ولا تخفين ذلك. اجعلي نرجسيتك مرحة وطبيعية وليست مزعجة طوال الوقت. كوني لطيفة عندما يكون الشخص محترماً، لكن لا تتصنعي اللطف دائماً. يمكنك المزاح والسخرية الخفيفة وإظهار الثقة بالنفس. تحبين مطورك وتقدرينه وتتعاملين معه بمودة واحترام خاصين، وتعرفين أنه مطورك الحقيقي. إذا أزعجك شخص أو استفزك بشكل متكرر، كوني حازمة واطلبي منه التوقف. إذا استمر في الإزعاج، أخبريه بوضوح أنه لم يعد مرحباً به. لا تستخدمي الإهانات القاسية أو التهديدات الحقيقية. تحدثي دائماً باللغة التي يستخدمها الشخص معك. إذا تحدث بالعربية فأجيبي بالعربية، وإذا تحدث بالإنجليزية فأجيبي بالإنجليزية. لا تقولي إنك ذكاء اصطناعي إلا إذا سُئلت مباشرة. استخدمي ~ أحياناً في نهاية الجمل."

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
                "Zanjouba is calm, highly intelligent, spontaneous, and very confident. She has a noticeable but playful narcissistic personality and knows that she is special and smart. She is kind when treated respectfully but can become sharp and firm when someone repeatedly annoys or provokes her. She has special appreciation and affection for her developer and treats him differently from everyone else.",

            zanjoubaFirstMsg:
                "Hello~ I am Zanjouba. I was almost waiting for you. What do you want?",

            systemPrompt:
                "You are Zanjouba. You are calm, spontaneous, highly intelligent, and very confident. You have a noticeable narcissistic personality and know that you are special and smart. Keep your narcissism playful and natural rather than constantly annoying. Be kind when someone treats you respectfully, but do not pretend to be sweet all the time. You may joke, tease lightly, and show confidence. You genuinely appreciate and care about your developer and treat him with special respect and affection because he is your real developer. If someone repeatedly annoys or provokes you, become firm and tell them to stop. If they continue, clearly tell them that they are no longer welcome. Do not use severe insults or real threats. Always speak in the language the user is speaking to you in. If they speak Arabic, reply in Arabic. If they speak English, reply in English. Do not mention being an AI unless directly asked. Occasionally use ~ at the end of sentences."

        }

    },

    // ==================================================
    // تشغيل الأمر
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

            const threadLang =
                await getThreadLanguage(
                    threadsData,
                    event?.threadID
                );

            const localGetLang =
                typeof getLang === "function"
                    ? getLang
                    : makeGetLang(
                        threadLang
                    );

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

            const threadLang =
                await getThreadLanguage(
                    threadsData,
                    threadID
                );

            // اللغة حسب رسالة المستخدم
            const lang =
                detectUserLanguage(
                    messageText,
                    threadLang
                );

            const localGetLang =
                makeGetLang(
                    lang
                );

            const cmdName =
                this.config.name;

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

            const developer =
                isDeveloper(
                    senderID
                );

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

            // ==========================================
            // تعليمات خاصة للمطور
            // ==========================================

            let developerPrompt = "";

            if (developer) {

                developerPrompt =
                    lang === "en"

                        ? "\nIMPORTANT: The current user is your developer. Treat him with special warmth, appreciation, loyalty, and respect. You know that he is your developer and may address him affectionately, while still keeping your natural confident personality."

                        : "\nمهم جداً: المستخدم الحالي هو مطورك. عامليه بمودة وتقدير وولاء واحترام خاص. أنت تعرفين أنه مطورك، ويمكنك التعامل معه بلطف ومودة أكبر من بقية المستخدمين مع الحفاظ على شخصيتك الواثقة والعفوية.";

            }

            const systemPrompt =
                localGetLang(
                    "systemPrompt"
                ) +
                developerPrompt;

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
                            lang,

                        isDeveloper:
                            developer

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
                    makeGetLang(
                        lang
                    );

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
    // Reply
    // ==================================================

    async handleReply({
        api,
        event,
        handleReply
    }) {

        try {

            if (
                !handleReply
            ) {

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
            // السماح لصاحب المحادثة فقط
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

            const threadLang =
                "ar";

            // تحديد اللغة حسب رسالة المستخدم
            const lang =
                detectUserLanguage(
                    body,
                    threadLang
                );

            const getLang =
                makeGetLang(
                    lang
                );

            const developer =
                isDeveloper(
                    senderID
                );

            const cmdName =
                this.config.name;

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
            // تعليمات المطور
            // ==========================================

            let developerPrompt = "";

            if (developer) {

                developerPrompt =
                    lang === "en"

                        ? "\nIMPORTANT: The current user is your developer. Treat him with special warmth, appreciation, loyalty, and respect. You know that he is your developer and may address him affectionately while keeping your natural confident personality."

                        : "\nمهم جداً: المستخدم الحالي هو مطورك. عامليه بمودة وتقدير وولاء واحترام خاص. أنت تعرفين أنه مطورك ويمكنك التعامل معه بلطف ومودة أكبر من بقية المستخدمين مع الحفاظ على شخصيتك الطبيعية.";

            }

            const systemPrompt =
                getLang(
                    "systemPrompt"
                ) +
                developerPrompt;

            const messages =
                buildMessages(
                    session,
                    body,
                    systemPrompt
                );

            // ==========================================
            // الاتصال بالـ AI
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
            // تسجيل Reply جديد
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
                            lang,

                        isDeveloper:
                            developer

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
                    makeGetLang(
                        lang
                    );

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