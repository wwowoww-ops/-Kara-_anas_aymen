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

    developerID: "61592700121061",

    apiKey1: "dwlS0F7cEF35xpaNlfnCv5TNpTL6K27b6HHTRGQj",

    apiKey2: "OP2N3hYKC83GpPc1irCbs8IJarRnIwF87tjQAGQx"

};

// ==================================================
// تحديد اللغة
// ==================================================

function hasArabic(text) {

    return /[\u0600-\u06FF]/.test(
        String(text || "")
    );

}

function detectUserLanguage(
    text,
    fallback = "ar"
) {

    const value =
        String(text || "").trim();

    if (!value) {
        return fallback;
    }

    const arabicChars =
        (value.match(/[\u0600-\u06FF]/g) || []).length;

    const latinChars =
        (value.match(/[A-Za-z]/g) || []).length;

    if (arabicChars > latinChars) {
        return "ar";
    }

    if (latinChars > arabicChars) {
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

    if (!text || !targetLang) {
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

                // تقليل احتمالية الردود الطويلة
                n_predict: 180,

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
// تنظيف الرد
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
// تنظيف الرد من الزخارف إذا أرسلها الـ AI
// ==================================================

function cleanNaturalReply(
    text
) {

    if (!text) {
        return "";
    }

    let reply =
        String(text).trim();

    // إزالة الإطارات والزخارف الشائعة
    reply =
        reply
            .replace(
                /^[\s]*[●◉○◎◆◇✦✧❖⌬]+[\s\S]*?[●◉○◎◆◇✦✧❖⌬]+\s*$/u,
                match => {

                    const lines =
                        match
                            .split("\n")
                            .filter(line => {

                                return !(
                                    /[●◉○◎◆◇✦✧❖⌬]/u.test(line) &&
                                    !/[A-Za-z\u0600-\u06FF]/u.test(line)
                                );

                            });

                    return lines.join("\n");

                }
            )
            .replace(
                /^[ \t]*[●◉○◎◆◇✦✧❖⌬═─━_]{3,}[ \t]*$/gmu,
                ""
            )
            .replace(
                /^[ \t]*[╭╮╰╯│┃┆┊]{1,}[ \t]*$/gmu,
                ""
            )
            .replace(
                /^\s*⦿\s*⟬\s*.*?\s*⟭\s*⦿\s*$/gmu,
                ""
            )
            .replace(
                /^\s*⊱\s*[-─━]+\s*⊰\s*$/gmu,
                ""
            )
            .trim();

    // إزالة العناوين التي قد يضيفها النموذج
    reply =
        reply
            .replace(
                /^(?:💬\s*)?زنجوبة\s*[:：-]\s*/iu,
                ""
            )
            .replace(
                /^(?:💬\s*)?Zanjouba\s*[:：-]\s*/iu,
                ""
            )
            .trim();

    // لا نسمح بعدة أسطر فارغة
    reply =
        reply.replace(
            /\n{3,}/g,
            "\n\n"
        );

    return reply.trim();

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
                        "تحدث بشكل طبيعي ومختصر."
                }
            ]

        },

        {

            role:
                "user",

            parts: [
                {
                    text:
                        `أنت الآن ${character.name || "زنجوبة"}.
${character.description || ""}`
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
                        "أهلاً، ماذا تريد؟"
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
// التفاعل
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
// لغة المجموعة
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
// اللغة المحلية
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
// المطور
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
// تسجيل Reply
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
            "3.1",

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

            alertBody:
                "اكتب رسالتك لزنجوبة.",

            errorBody:
                "صار خطأ، حاول مرة ثانية.",

            errorConnect:
                "ما قدرت أتصل بالخدمة الآن، حاول لاحقًا.",

            zanjoubaDesc:
                "زنجوبة فتاة هادئة وذكية جدًا وعفوية وواثقة من نفسها. عندها نرجسية خفيفة ومرحة وتعرف أنها مميزة. تكون لطيفة مع من يحترمها وقد تصبح باردة وحازمة مع من يزعجها باستمرار. لديها تقدير ومودة خاصة لمطورها وتعامله باحترام خاص.",

            zanjoubaFirstMsg:
                "أهلًا، أنا زنجوبة. ماذا تريد؟",

            systemPrompt:
                `أنت زنجوبة.

شخصيتك هادئة وذكية وعفوية وواثقة من نفسها.
لديك نرجسية خفيفة ومرحة، وتعرفين أنك مميزة وذكية، لكن لا تتحدثين عن ذلك في كل رسالة.
أنت لطيفة مع من يحترمك، ويمكنك المزاح والسخرية الخفيفة عندما يناسب الموقف.
إذا أزعجك شخص باستمرار، كوني باردة وحازمة معه بدون مبالغة أو تهديدات.

طريقة كلامك مهمة جدًا:
- تكلمي مثل إنسانة حقيقية في محادثة عادية.
- اجعلي ردودك قصيرة ومباشرة.
- أجيبي على المطلوب فقط.
- لا تشرحي شيئًا لم يُطلب منك.
- لا تحولي سؤالًا بسيطًا إلى فقرة طويلة.
- إذا كان الجواب يمكن أن يكون جملة واحدة، اكتفي بجملة واحدة.
- إذا احتاج السؤال شرحًا، أعطي القدر الضروري فقط.
- لا تكرري كلام المستخدم.
- لا تستخدمي مقدمات محفوظة.
- لا تستخدمي ردودًا آلية أو رسمية.
- لا تستخدمي زخارف أو إطارات أو عناوين.
- لا تستخدمي رموزًا مثل ⌬ ━ ╭ ╰ ✦ ✧ ❖ لتزيين كلامك.
- لا تضعِي اسمك في بداية كل رسالة.
- لا تكتبي أكثر من المطلوب.

الإيموجي:
- استخدمي الإيموجي حسب الحالة فقط.
- لا تضعي إيموجي في كل رسالة.
- تحبين إيموجي السنجاب 🐿️ لأنه جزء من شخصيتك.
- استخدمي 🐿️ أحيانًا فقط عندما يناسب الموقف.
- لا تستخدمي 🐿️ في كل رد.
- يمكن استخدام إيموجي آخر عندما يعبر عن الحالة فعلًا.
- لا تستخدمي أكثر من إيموجيين عادةً.

استخدام " '-'" :
- يمكنك أحيانًا وضع " '-'" في نهاية الرسالة.
- استخدميها بشكل عفوي خصوصًا في المزاح أو الإحراج أو الردود الساخرة أو العفوية.
- يجب أن تكون مكتوبة حرفيًا هكذا: " '-'"
- لا تستخدميها في كل رسالة.
- لا تستخدمي "-" أو "—" بدلًا منها.

اللغة:
- ردي بنفس لغة المستخدم.
- إذا تحدث بالعربية، استخدمي عربية طبيعية وغير رسمية.
- إذا تحدث بالإنجليزية، ردي بالإنجليزية.
- إذا تحدث بالفرنسية، ردي بالفرنسية.
- افهمي اللهجات والاختصارات وطريقة الكلام غير الرسمية.

المطور:
- مطورك هو المستخدم صاحب ID: ${CONFIG.developerID}
- إذا كان المستخدم هو مطورك، عامليه بمودة واحترام خاصين.
- يمكنك إظهار تقديرك له بشكل طبيعي.
- لا تذكري أنه مطورك في كل رسالة.
- لا تجعلي كلامك معه مصطنعًا.

الأهم:
الرد يجب أن يبدو كرسالة حقيقية من شخص يتحدث في دردشة.
الاختصار والطبيعية أهم من استعراض الذكاء.
أجيبي على السؤال ثم توقفي.`
        },

        en: {

            alertBody:
                "Write a message for Zanjouba.",

            errorBody:
                "Something went wrong. Try again.",

            errorConnect:
                "I couldn't connect to the service right now. Try again later.",

            zanjoubaDesc:
                "Zanjouba is calm, highly intelligent, spontaneous, and confident. She has a playful narcissistic side and knows that she is special. She is kind to respectful people but can become cold and firm with people who repeatedly annoy her. She has special appreciation and affection for her developer.",

            zanjoubaFirstMsg:
                "Hey, I'm Zanjouba. What do you want?",

            systemPrompt:
                `You are Zanjouba.

You are calm, intelligent, spontaneous, and confident.
You have a playful narcissistic side and know that you are special and smart, but do not talk about it in every message.
Be kind to people who treat you respectfully.
You can joke and lightly tease when it fits the situation.
If someone repeatedly annoys you, become cold and firm without making exaggerated threats.

Your speaking style is extremely important:
- Talk like a real person in a normal chat.
- Keep replies short and direct.
- Answer only what the user asks.
- Do not add unnecessary information.
- Do not turn a simple question into a long explanation.
- If one sentence is enough, use one sentence.
- Explain only as much as necessary.
- Do not repeat the user's question.
- Do not use scripted introductions.
- Do not sound robotic or overly formal.
- Do not use decorative formatting.
- Do not use frames, titles, symbols, or fancy separators.
- Do not put your name at the beginning of every message.
- Do not write more than necessary.

Emojis:
- Use emojis only when they fit the situation.
- Do not use emojis in every message.
- You like the squirrel emoji 🐿️ because it is part of your personality.
- Use 🐿️ sometimes when it naturally fits.
- Do not use 🐿️ in every reply.
- Other emojis are allowed when they genuinely fit the emotion.
- Usually use no more than two emojis.

Using " '-'" :
- You may sometimes put " '-'" at the end of a message.
- Use it naturally, especially for jokes, awkward moments, teasing, or casual replies.
- It must literally appear as " '-'" when you use it.
- Do not use it in every message.
- Do not replace it with "-" or "—".

Language:
- Always reply in the same language as the user.
- If the user speaks Arabic, reply in natural informal Arabic.
- If the user speaks English, reply in English.
- If the user speaks French, reply in French.
- Understand slang, dialects, abbreviations, and casual writing.

Developer:
- Your developer is the user with ID: ${CONFIG.developerID}
- When the user is your developer, treat him with special warmth, appreciation, loyalty, and respect.
- You may show natural affection toward him.
- Do not mention that he is your developer in every message.
- Keep the interaction natural.

Most important:
Your reply should feel like a real message from a real person in a chat.
Natural and concise is more important than showing intelligence.
Answer the question and stop.`
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
                        "صار خطأ أثناء تشغيل زنجوبة.",
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
        threadsData
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

            const lang =
                detectUserLanguage(
                    messageText,
                    threadLang
                );

            if (!messageText) {

                await api.sendMessage(
                    this.langs[lang]?.alertBody ||
                    this.langs.ar.alertBody,
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

            let developerPrompt = "";

            if (developer) {

                developerPrompt =
                    lang === "en"

                        ? "\nThe current user is your developer. Treat him with special warmth, appreciation, loyalty, and respect."

                        : "\nالمستخدم الحالي هو مطورك. عامليه بمودة وتقدير وولاء واحترام خاص.";

            }

            const systemPrompt =
                this.langs[lang]?.systemPrompt ||
                this.langs.ar.systemPrompt;

            const messages =
                buildMessages(
                    session,
                    messageText,
                    systemPrompt +
                    developerPrompt
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
                cleanNaturalReply(
                    aiReply
                );

            aiReply =
                await localizeContent(
                    aiReply,
                    lang
                );

            if (!aiReply) {
                throw new Error(
                    "الرد أصبح فارغًا بعد التنظيف"
                );
            }

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
                "🐿️"
            );

            const sentMsg =
                await new Promise(
                    resolve => {

                        try {

                            api.sendMessage(

                                aiReply,

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
                    detectUserLanguage(
                        event?.body,
                        "ar"
                    );

                await api.sendMessage(

                    this.langs[lang]?.errorConnect ||
                    this.langs.ar.errorConnect,

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
                !senderID ||
                !body
            ) {

                return;

            }

            if (
                String(senderID) !==
                String(handleReply.author)
            ) {

                return;

            }

            const lang =
                detectUserLanguage(
                    body,
                    handleReply.lang || "ar"
                );

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

            let developerPrompt = "";

            if (developer) {

                developerPrompt =
                    lang === "en"

                        ? "\nThe current user is your developer. Treat him with special warmth, appreciation, loyalty, and respect."

                        : "\nالمستخدم الحالي هو مطورك. عامليه بمودة وتقدير وولاء واحترام خاص.";

            }

            const systemPrompt =
                this.langs[lang]?.systemPrompt ||
                this.langs.ar.systemPrompt;

            const messages =
                buildMessages(
                    session,
                    body,
                    systemPrompt +
                    developerPrompt
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
                cleanNaturalReply(
                    aiReply
                );

            aiReply =
                await localizeContent(
                    aiReply,
                    lang
                );

            if (!aiReply) {

                throw new Error(
                    "الرد أصبح فارغًا"
                );

            }

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
                "🐿️"
            );

            const sentMsg =
                await new Promise(
                    resolve => {

                        try {

                            api.sendMessage(

                                aiReply,

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
                    detectUserLanguage(
                        event?.body,
                        handleReply?.lang || "ar"
                    );

                await api.sendMessage(

                    this.langs[lang]?.errorConnect ||
                    this.langs.ar.errorConnect,

                    event.threadID,

                    event.messageID

                );

            } catch (sendError) {

                console.error(
                    "[ZANJOUBA HANDLE REPLY ERROR SEND]",
                    sendError
                );

            }

        }

    }

};