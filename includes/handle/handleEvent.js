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
    // إعدادات نظام السجل
    // ==================================================

    const LOG_DIR = path.join(
        process.cwd(),
        "data",
        "groupLogs"
    );

    const MAX_LOGS = 100;

    // إنشاء مجلد السجلات
    try {
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR, {
                recursive: true
            });
        }
    } catch (error) {
        console.error(
            "[GROUP LOG] فشل إنشاء مجلد السجلات:",
            error.message
        );
    }

    // ==================================================
    // الحصول على اسم المستخدم
    // ==================================================

    async function getUserName(uid) {

        try {

            if (
                Users &&
                typeof Users.getNameUser === "function"
            ) {

                const name =
                    await Users.getNameUser(
                        String(uid)
                    );

                if (name) {
                    return name;
                }
            }

        } catch (e) {}

        try {

            if (
                api &&
                typeof api.getUserInfo === "function"
            ) {

                const info =
                    await api.getUserInfo(
                        String(uid)
                    );

                if (
                    info &&
                    info[String(uid)] &&
                    info[String(uid)].name
                ) {

                    return info[String(uid)].name;
                }
            }

        } catch (e) {}

        return "مستخدم غير معروف";
    }

    // ==================================================
    // مسار سجل المجموعة
    // ==================================================

    function getLogFile(threadID) {

        return path.join(
            LOG_DIR,
            `${String(threadID)}.json`
        );
    }

    // ==================================================
    // قراءة سجل المجموعة
    // ==================================================

    function readLogs(threadID) {

        const file =
            getLogFile(threadID);

        try {

            if (!fs.existsSync(file)) {
                return [];
            }

            const data =
                fs.readFileSync(
                    file,
                    "utf8"
                );

            if (!data.trim()) {
                return [];
            }

            const logs =
                JSON.parse(data);

            return Array.isArray(logs)
                ? logs
                : [];

        } catch (error) {

            console.error(
                "[GROUP LOG] خطأ في قراءة السجل:",
                error.message
            );

            return [];
        }
    }

    // ==================================================
    // حفظ حدث جديد
    // ==================================================

    function saveLog(
        threadID,
        data
    ) {

        if (!threadID) {
            return;
        }

        try {

            const logs =
                readLogs(threadID);

            logs.push({

                event:
                    data.event ||
                    "حدث غير معروف",

                name:
                    data.name ||
                    "غير معروف",

                userID:
                    data.userID
                    ? String(data.userID)
                    : null,

                target:
                    data.target ||
                    null,

                time:
                    new Date().toLocaleString(
                        "ar-TN",
                        {
                            timeZone:
                                "Africa/Tunis"
                        }
                    ),

                timestamp:
                    Date.now()

            });

            // الاحتفاظ بآخر 100 حدث فقط
            const limitedLogs =
                logs.slice(-MAX_LOGS);

            const file =
                getLogFile(threadID);

            fs.writeFileSync(
                file,
                JSON.stringify(
                    limitedLogs,
                    null,
                    2
                ),
                "utf8"
            );

        } catch (error) {

            console.error(
                "[GROUP LOG] فشل حفظ الحدث:",
                error.message
            );
        }
    }

    // ==================================================
    // استخراج الأعضاء من حدث الدخول
    // ==================================================

    async function handleSubscribe(event) {

        if (
            !event ||
            !Array.isArray(event.logMessageData?.addedParticipants)
        ) {
            return;
        }

        for (
            const participant
            of event.logMessageData.addedParticipants
        ) {

            const uid =
                participant.userFbId ||
                participant.userID ||
                participant.id;

            if (!uid) {
                continue;
            }

            const name =
                participant.fullName ||
                await getUserName(uid);

            saveLog(
                event.threadID,
                {
                    event:
                        "دخول عضو",

                    name,

                    userID:
                        uid
                }
            );
        }
    }

    // ==================================================
    // استخراج الأعضاء من حدث الخروج
    // ==================================================

    async function handleUnsubscribe(event) {

        const data =
            event.logMessageData;

        if (!data) {
            return;
        }

        let users = [];

        if (
            Array.isArray(
                data.leftParticipantFbId
            )
        ) {

            users =
                data.leftParticipantFbId;

        } else if (
            data.leftParticipantFbId
        ) {

            users = [
                data.leftParticipantFbId
            ];
        }

        // بعض نسخ FCA تستخدم هذا الاسم
        if (
            users.length === 0 &&
            Array.isArray(
                data.removedParticipants
            )
        ) {

            users =
                data.removedParticipants.map(
                    user =>
                        user.userFbId ||
                        user.userID ||
                        user.id
                );
        }

        for (
            const uid
            of users
        ) {

            if (!uid) {
                continue;
            }

            const name =
                await getUserName(uid);

            saveLog(
                event.threadID,
                {
                    event:
                        "خروج عضو",

                    name,

                    userID:
                        uid
                }
            );
        }
    }

    // ==================================================
    // أحداث تغيير المجموعة
    // ==================================================

    async function handleThreadChange(event) {

        const data =
            event.logMessageData || {};

        const senderID =
            event.author ||
            event.senderID;

        const senderName =
            senderID
                ? await getUserName(senderID)
                : "غير معروف";

        const type =
            event.logMessageType;

        // ----------------------------------------------
        // تغيير اسم المجموعة
        // ----------------------------------------------

        if (
            type === "log:thread-name"
        ) {

            const newName =
                data.name ||
                data.threadName ||
                "اسم غير معروف";

            saveLog(
                event.threadID,
                {
                    event:
                        "تغيير اسم المجموعة",

                    name:
                        senderName,

                    userID:
                        senderID,

                    target:
                        `الاسم الجديد: ${newName}`
                }
            );

            return;
        }

        // ----------------------------------------------
        // تغيير صورة المجموعة
        // ----------------------------------------------

        if (
            type === "log:thread-image"
        ) {

            saveLog(
                event.threadID,
                {
                    event:
                        "تغيير صورة المجموعة",

                    name:
                        senderName,

                    userID:
                        senderID
                }
            );

            return;
        }

        // ----------------------------------------------
        // تغيير لون المجموعة
        // ----------------------------------------------

        if (
            type === "log:thread-color"
        ) {

            saveLog(
                event.threadID,
                {
                    event:
                        "تغيير لون المجموعة",

                    name:
                        senderName,

                    userID:
                        senderID
                }
            );

            return;
        }

        // ----------------------------------------------
        // تغيير أيقونة المجموعة
        // ----------------------------------------------

        if (
            type === "log:thread-icon"
        ) {

            saveLog(
                event.threadID,
                {
                    event:
                        "تغيير أيقونة المجموعة",

                    name:
                        senderName,

                    userID:
                        senderID
                }
            );

            return;
        }

        // ----------------------------------------------
        // تغيير إعدادات الإدارة
        // ----------------------------------------------

        if (
            type === "log:thread-admins"
        ) {

            saveLog(
                event.threadID,
                {
                    event:
                        "تغيير إدارة المجموعة",

                    name:
                        senderName,

                    userID:
                        senderID
                }
            );

            return;
        }

        // ----------------------------------------------
        // تغيير الموافقة على الأعضاء
        // ----------------------------------------------

        if (
            type === "log:thread-approval-mode"
        ) {

            saveLog(
                event.threadID,
                {
                    event:
                        "تغيير إعدادات الموافقة",

                    name:
                        senderName,

                    userID:
                        senderID
                }
            );

            return;
        }
    }

    // ==================================================
    // نظام مراقبة الأحداث
    // ==================================================

    async function processGroupLog(event) {

        if (
            !event ||
            !event.threadID
        ) {
            return;
        }

        const type =
            event.type;

        // ----------------------------------------------
        // دخول عضو
        // ----------------------------------------------

        if (
            type === "event" &&
            event.logMessageType ===
            "log:subscribe"
        ) {

            await handleSubscribe(
                event
            );

            return;
        }

        // ----------------------------------------------
        // خروج عضو
        // ----------------------------------------------

        if (
            type === "event" &&
            event.logMessageType ===
            "log:unsubscribe"
        ) {

            await handleUnsubscribe(
                event
            );

            return;
        }

        // ----------------------------------------------
        // تغييرات المجموعة
        // ----------------------------------------------

        if (
            type === "event" &&
            typeof event.logMessageType ===
            "string" &&
            event.logMessageType.startsWith(
                "log:thread-"
            )
        ) {

            await handleThreadChange(
                event
            );
        }
    }

    // ==================================================
    // HANDLE EVENT الرئيسي
    // ==================================================

    return async function ({ event }) {

        try {

            if (!event) {
                return;
            }

            // ==================================================
            // تشغيل نظام السجل
            // ==================================================

            try {

                await processGroupLog(
                    event
                );

            } catch (error) {

                console.error(
                    "[GROUP LOG ERROR]",
                    error
                );
            }

            // ==================================================
            // بيانات البوت
            // ==================================================

            const {
                allowInbox
            } = global.config;

            const {
                userBanned,
                threadBanned
            } = global.data;

            const {
                commands
            } = global.client;

            // ==================================================
            // IDs
            // ==================================================

            const senderID =
                String(
                    event.senderID ||
                    ""
                );

            const threadID =
                String(
                    event.threadID ||
                    ""
                );

            // ==================================================
            // منع المستخدمين المحظورين
            // ==================================================

            if (
                userBanned &&
                userBanned.has(
                    senderID
                )
            ) {

                return;
            }

            // ==================================================
            // منع المجموعات المحظورة
            // ==================================================

            if (
                threadBanned &&
                threadBanned.has(
                    threadID
                )
            ) {

                return;
            }

            // ==================================================
            // منع الخاص
            // ==================================================

            if (
                allowInbox === false &&
                senderID === threadID
            ) {

                return;
            }

            // ==================================================
            // الحصول على Events المسجلة
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

            // دعم eventRegistered
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
                }

                if (
                    oldEvents.length > 0
                ) {

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

                // يجب أن يحتوي الملف على handleEvent
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

                                if (
                                    !languageData
                                ) {

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
                                            "%" +
                                            i,
                                            "g"
                                        );

                                    text =
                                        text.replace(
                                            regex,
                                            values[i]
                                        );
                                }

                                return text;

                            } catch (error) {

                                return "";
                            }
                        };
                }

                // ==================================================
                // Object الخاص بالـEvent
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

                    console.error(
                        error
                    );

                    try {

                        logger(
                            `❌ Event Error: ${eventName}\n${error.message}`,
                            "error"
                        );

                    } catch (e) {}
                }
            }

        } catch (error) {

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