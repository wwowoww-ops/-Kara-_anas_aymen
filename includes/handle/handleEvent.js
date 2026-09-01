const fs = require("fs");
const path = require("path");

module.exports = function ({
    api,
    models,
    Users,
    Threads,
    Currencies
}) {

    const logger = require("../../utils/log.js");

    // ==================================================
    // 📊 إعدادات نشاط الأعضاء
    // ==================================================

    const ACTIVITY_DIR = path.join(
        process.cwd(),
        "data",
        "groupActivity"
    );

    const MAX_ACTIVITY_MEMBERS = 5000;

    try {
        if (!fs.existsSync(ACTIVITY_DIR)) {
            fs.mkdirSync(ACTIVITY_DIR, {
                recursive: true
            });
        }
    } catch (error) {
        console.error(
            "[ACTIVITY] فشل إنشاء مجلد النشاط:",
            error.message
        );
    }

    // ==================================================
    // 📁 الحصول على ملف نشاط المجموعة
    // ==================================================

    function getActivityFile(threadID) {
        return path.join(
            ACTIVITY_DIR,
            `${String(threadID)}.json`
        );
    }

    // ==================================================
    // 📖 قراءة نشاط المجموعة
    // ==================================================

    function loadActivity(threadID) {

        const file = getActivityFile(threadID);

        try {

            if (!fs.existsSync(file)) {
                return {};
            }

            const content = fs.readFileSync(
                file,
                "utf8"
            );

            if (!content.trim()) {
                return {};
            }

            const data = JSON.parse(content);

            if (
                !data ||
                typeof data !== "object" ||
                Array.isArray(data)
            ) {
                return {};
            }

            return data;

        } catch (error) {

            console.error(
                `[ACTIVITY] فشل قراءة ${threadID}:`,
                error.message
            );

            return {};
        }
    }

    // ==================================================
    // 💾 حفظ نشاط المجموعة
    // ==================================================

    function saveActivity(threadID, activity) {

        try {

            const file = getActivityFile(threadID);

            fs.writeFileSync(
                file,
                JSON.stringify(
                    activity,
                    null,
                    2
                ),
                "utf8"
            );

        } catch (error) {

            console.error(
                `[ACTIVITY] فشل حفظ ${threadID}:`,
                error.message
            );
        }
    }

    // ==================================================
    // 📈 تسجيل نشاط العضو
    // ==================================================

    function registerActivity(threadID, senderID) {

        if (!threadID || !senderID) {
            return;
        }

        // عدم تسجيل الخاص
        if (
            String(threadID) ===
            String(senderID)
        ) {
            return;
        }

        try {

            const activity =
                loadActivity(threadID);

            const uid =
                String(senderID);

            if (!activity[uid]) {

                activity[uid] = {
                    messages: 0,
                    lastMessage: 0
                };
            }

            activity[uid].messages =
                Number(
                    activity[uid].messages || 0
                ) + 1;

            activity[uid].lastMessage =
                Date.now();

            // ==================================================
            // 🛡️ حماية من تضخم الملف
            // ==================================================

            const users =
                Object.keys(activity);

            if (
                users.length >
                MAX_ACTIVITY_MEMBERS
            ) {

                users.sort((a, b) => {

                    const countA =
                        Number(
                            activity[a]?.messages || 0
                        );

                    const countB =
                        Number(
                            activity[b]?.messages || 0
                        );

                    return countB - countA;
                });

                const keep =
                    users.slice(
                        0,
                        MAX_ACTIVITY_MEMBERS
                    );

                const cleaned = {};

                for (const uid of keep) {
                    cleaned[uid] =
                        activity[uid];
                }

                saveActivity(
                    threadID,
                    cleaned
                );

                return;
            }

            saveActivity(
                threadID,
                activity
            );

        } catch (error) {

            console.error(
                "[ACTIVITY ERROR]",
                error
            );
        }
    }

    // ==================================================
    // 🚀 Handle Event
    // ==================================================

    return async function ({ event }) {

        try {

            // ==================================================
            // التأكد من وجود Event
            // ==================================================

            if (!event) {
                return;
            }

            // ==================================================
            // 🦧 HINA — التفاعل التلقائي
            // ==================================================

            if (
                event.type === "message" &&
                event.body &&
                event.messageID
            ) {

                const text =
                    String(event.body)
                        .toLowerCase();

                const triggerWords = [
                    "يوتا",
                    "شفق",
                    "الشفق",
                    "هريرة",
                    "ابو هريرة",
                    "أبو هريرة"
                ];

                const matched =
                    triggerWords.some(
                        word =>
                            text.includes(
                                word.toLowerCase()
                            )
                    );

                if (matched) {

                    try {

                        await new Promise(
                            (resolve) => {

                                api.setMessageReaction(
                                    "🦧",
                                    String(event.messageID),
                                    error => {

                                        if (error) {

                                            console.error(
                                                "[HINA 🦧 REACTION ERROR]",
                                                error
                                            );

                                        } else {

                                            console.log(
                                                "[HINA 🦧] تم وضع التفاعل"
                                            );

                                        }

                                        resolve();
                                    },
                                    true
                                );

                            }
                        );

                    } catch (error) {

                        console.error(
                            "[HINA 🦧 REACTION ERROR]",
                            error
                        );
                    }
                }
            }

            // ==================================================
            // 📊 تسجيل نشاط الرسائل
            // ==================================================

            if (
                event.type === "message" &&
                event.threadID &&
                event.senderID
            ) {

                registerActivity(
                    String(event.threadID),
                    String(event.senderID)
                );
            }

            // ==================================================
            // ⚙️ الإعدادات
            // ==================================================

            const {
                allowInbox
            } = global.config;

            // ==================================================
            // 🚫 المحظورون
            // ==================================================

            const {
                userBanned,
                threadBanned
            } = global.data;

            // ==================================================
            // 📦 أوامر البوت
            // ==================================================

            const {
                commands
            } = global.client;

            // ==================================================
            // 🆔 IDs
            // ==================================================

            const senderID =
                String(
                    event.senderID || ""
                );

            const threadID =
                String(
                    event.threadID || ""
                );

            // ==================================================
            // 🚫 منع المستخدم المحظور
            // ==================================================

            if (
                userBanned &&
                typeof userBanned.has === "function" &&
                userBanned.has(senderID)
            ) {
                return;
            }

            // ==================================================
            // 🚫 منع المجموعة المحظورة
            // ==================================================

            if (
                threadBanned &&
                typeof threadBanned.has === "function" &&
                threadBanned.has(threadID)
            ) {
                return;
            }

            // ==================================================
            // 🚫 منع الخاص
            // ==================================================

            if (
                allowInbox === false &&
                senderID === threadID
            ) {
                return;
            }

            // ==================================================
            // 📋 الحصول على Events
            // ==================================================

            let registeredEvents = [];

            // الطريقة الأساسية
            if (
                global.client.events &&
                global.client.events instanceof Map
            ) {

                registeredEvents =
                    Array.from(
                        global.client.events.entries()
                    );
            }

            // ==================================================
            // دعم eventRegistered
            // ==================================================

            if (
                Array.isArray(
                    global.client.eventRegistered
                ) &&
                global.client.eventRegistered.length > 0
            ) {

                const oldEvents = [];

                for (
                    const eventName
                    of global.client.eventRegistered
                ) {

                    try {

                        const eventModule =
                            global.client.events?.get(
                                eventName
                            );

                        if (eventModule) {

                            oldEvents.push([
                                eventName,
                                eventModule
                            ]);
                        }

                    } catch (error) {

                        console.error(
                            `[EVENT REGISTER ERROR] ${eventName}`,
                            error.message
                        );
                    }
                }

                if (oldEvents.length > 0) {

                    registeredEvents =
                        oldEvents;
                }
            }

            // ==================================================
            // لا توجد Events
            // ==================================================

            if (
                registeredEvents.length === 0
            ) {

                if (
                    global.config.DeveloperMode
                ) {

                    console.log(
                        "[HANDLE EVENT] لا توجد Events مسجلة"
                    );
                }

                return;
            }

            // ==================================================
            // تشغيل جميع Events
            // ==================================================

            for (
                const [
                    eventName,
                    eventModule
                ]
                of registeredEvents
            ) {

                if (!eventModule) {
                    continue;
                }

                // ==================================================
                // التأكد من handleEvent
                // ==================================================

                if (
                    typeof eventModule.handleEvent !==
                    "function"
                ) {
                    continue;
                }

                // ==================================================
                // getText
                // ==================================================

                let getText =
                    function () {
                        return "";
                    };

                if (
                    eventModule.languages &&
                    typeof eventModule.languages ===
                    "object"
                ) {

                    getText =
                        function (...values) {

                            try {

                                const language =
                                    global.config.language ||
                                    "ar";

                                const languageData =
                                    eventModule.languages[
                                        language
                                    ];

                                if (!languageData) {
                                    return "";
                                }

                                let text =
                                    languageData[
                                        values[0]
                                    ] || "";

                                for (
                                    let i = 1;
                                    i < values.length;
                                    i++
                                ) {

                                    const regex =
                                        new RegExp(
                                            "%" + i,
                                            "g"
                                        );

                                    text =
                                        text.replace(
                                            regex,
                                            String(
                                                values[i]
                                            )
                                        );
                                }

                                return text;

                            } catch (error) {

                                return "";
                            }
                        };
                }

                // ==================================================
                // Object الخاص بالـ Event
                // ==================================================

                const Obj = {

                    api,

                    event,

                    models,

                    Users,

                    Threads,

                    Currencies,

                    getText

                };

                // ==================================================
                // تشغيل Event
                // ==================================================

                try {

                    await eventModule.handleEvent(
                        Obj
                    );

                } catch (error) {

                    console.error(
                        `❌ EVENT ERROR: ${eventName}`
                    );

                    console.error(error);

                    try {

                        logger(
                            `❌ Event Error: ${eventName}\n${error.message}`,
                            "error"
                        );

                    } catch (e) {}
                }
            }

        } catch (error) {

            // ==================================================
            // ❌ خطأ عام
            // ==================================================

            console.error(
                "❌ HANDLE EVENT ERROR:",
                error
            );

            try {

                logger(
                    `❌ HandleEvent Error: ${error.message}`,
                    "error"
                );

            } catch (e) {}
        }
    };
};