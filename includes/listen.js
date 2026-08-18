/**
 * KIRA LISTEN SYSTEM
 * Version: 13.0.0
 *
 * يستقبل أحداث Facebook ويرسلها للـ handlers
 * بدون الاعتماد على eventRegistered.
 */

module.exports = function ({ api, models }) {

    const logger = require("../utils/log.js");

    const fs = require("fs");

    // ============================================================
    // Controllers
    // ============================================================

    const Users =
        require("./controllers/users")({
            models,
            api
        });

    const Threads =
        require("./controllers/threads")({
            models,
            api
        });

    const Currencies =
        require("./controllers/currencies")({
            models
        });

    // ============================================================
    // Handlers
    // ============================================================

    const handleCommand =
        require("./handle/handleCommand")({
            api,
            models,
            Users,
            Threads,
            Currencies
        });

    const handleCommandEvent =
        require("./handle/handleCommandEvent")({
            api,
            models,
            Users,
            Threads,
            Currencies
        });

    const handleReply =
        require("./handle/handleReply")({
            api,
            models,
            Users,
            Threads,
            Currencies
        });

    const handleReaction =
        require("./handle/handleReaction")({
            api,
            models,
            Users,
            Threads,
            Currencies
        });

    const handleEvent =
        require("./handle/handleEvent")({
            api,
            models,
            Users,
            Threads,
            Currencies
        });

    const handleRefresh =
        require("./handle/handleRefresh")({
            api,
            models,
            Users,
            Threads,
            Currencies
        });

    const handleCreateDatabase =
        require("./handle/handleCreateDatabase")({
            api,
            Threads,
            Users,
            Currencies,
            models
        });

    const handleNotification =
        require("./handle/handleNotification")({
            api
        });

    // ============================================================
    // أدوات مساعدة
    // ============================================================

    function safeString(value) {
        if (
            value === undefined ||
            value === null
        ) {
            return "";
        }

        return String(value);
    }

    function isBotMessage(event) {

        try {

            const botID =
                String(
                    api.getCurrentUserID()
                );

            const senderID =
                String(
                    event.senderID || ""
                );

            return (
                botID &&
                senderID === botID
            );

        } catch (e) {

            return false;

        }
    }

    function isBanned(threadID, senderID) {

        try {

            if (
                global.data.userBanned &&
                global.data.userBanned.has(
                    senderID
                )
            ) {
                return true;
            }

            if (
                global.data.threadBanned &&
                global.data.threadBanned.has(
                    threadID
                )
            ) {
                return true;
            }

        } catch (e) {

            console.error(
                "BAN CHECK ERROR:",
                e
            );

        }

        return false;
    }

    // ============================================================
    // تحميل قاعدة البيانات
    // ============================================================

    (async function loadDatabase() {

        try {

            logger(
                "📊 جاري تحميل قاعدة البيانات...",
                "[ DATABASE ]"
            );

            // ----------------------------------------------------
            // Threads
            // ----------------------------------------------------

            const threads =
                await Threads.getAll([
                    "threadID",
                    "data",
                    "threadInfo"
                ]);

            if (
                Array.isArray(
                    global.data.allThreadID
                )
            ) {
                global.data.allThreadID.length = 0;
            }

            for (
                const thread of threads
            ) {

                const tid =
                    String(
                        thread.threadID
                    );

                if (
                    !global.data.allThreadID.includes(
                        tid
                    )
                ) {

                    global.data.allThreadID.push(
                        tid
                    );

                }

                global.data.threadData.set(
                    tid,
                    thread.data || {}
                );

                global.data.threadInfo.set(
                    tid,
                    thread.threadInfo || {}
                );

                // حظر المجموعة
                if (
                    thread.data &&
                    (
                        thread.data.banned == 1 ||
                        thread.data.banned === true
                    )
                ) {

                    global.data.threadBanned.set(
                        tid,
                        {
                            reason:
                                thread.data.reason ||
                                "",

                            dateAdded:
                                thread.data.dateAdded ||
                                Date.now()
                        }
                    );

                }

                // حظر الأوامر
                if (
                    thread.data &&
                    Array.isArray(
                        thread.data.commandBanned
                    ) &&
                    thread.data.commandBanned.length
                ) {

                    global.data.commandBanned.set(
                        tid,
                        thread.data.commandBanned
                    );

                }

                // NSFW
                if (
                    thread.data &&
                    thread.data.NSFW
                ) {

                    if (
                        !global.data.threadAllowNSFW.includes(
                            tid
                        )
                    ) {

                        global.data.threadAllowNSFW.push(
                            tid
                        );

                    }

                }

            }

            // ----------------------------------------------------
            // Users
            // ----------------------------------------------------

            const users =
                await Users.getAll([
                    "userID",
                    "name",
                    "data"
                ]);

            if (
                Array.isArray(
                    global.data.allUserID
                )
            ) {
                global.data.allUserID.length = 0;
            }

            for (
                const user of users
            ) {

                const uid =
                    String(
                        user.userID
                    );

                if (
                    !global.data.allUserID.includes(
                        uid
                    )
                ) {

                    global.data.allUserID.push(
                        uid
                    );

                }

                if (user.name) {

                    global.data.userName.set(
                        uid,
                        user.name
                    );

                }

                if (
                    user.data &&
                    (
                        user.data.banned == 1 ||
                        user.data.banned === true
                    )
                ) {

                    global.data.userBanned.set(
                        uid,
                        {
                            reason:
                                user.data.reason ||
                                "",

                            dateAdded:
                                user.data.dateAdded ||
                                Date.now()
                        }
                    );

                }

                if (
                    user.data &&
                    Array.isArray(
                        user.data.commandBanned
                    ) &&
                    user.data.commandBanned.length
                ) {

                    global.data.commandBanned.set(
                        uid,
                        user.data.commandBanned
                    );

                }

            }

            // ----------------------------------------------------
            // Currencies
            // ----------------------------------------------------

            const currencies =
                await Currencies.getAll([
                    "userID"
                ]);

            if (
                Array.isArray(
                    global.data.allCurrenciesID
                )
            ) {
                global.data.allCurrenciesID.length = 0;
            }

            for (
                const currency of currencies
            ) {

                const uid =
                    String(
                        currency.userID
                    );

                if (
                    !global.data.allCurrenciesID.includes(
                        uid
                    )
                ) {

                    global.data.allCurrenciesID.push(
                        uid
                    );

                }

            }

            logger(
                "✅ اكتمل تحميل قاعدة البيانات",
                "[ DATABASE ]"
            );

        } catch (error) {

            console.error(
                "DATABASE LOAD ERROR:",
                error
            );

            logger(
                `❌ فشل تحميل قاعدة البيانات: ${error.message}`,
                "error"
            );

        }

    })();

    // ============================================================
    // إشعارات دورية
    // ============================================================

    if (
        global.config.NOTIFICATION
    ) {

        setInterval(
            async () => {

                try {

                    if (
                        typeof handleNotification ===
                        "function"
                    ) {

                        await handleNotification({
                            api
                        });

                    }

                } catch (error) {

                    console.error(
                        "NOTIFICATION ERROR:",
                        error
                    );

                }

            },
            60000
        );

    }

    // ============================================================
    // استقبال الأحداث
    // ============================================================

    return async function (event) {

        if (!event) {
            return;
        }

        const type =
            safeString(
                event.type
            );

        const threadID =
            safeString(
                event.threadID
            );

        const senderID =
            safeString(
                event.senderID
            );

        const logMessageType =
            safeString(
                event.logMessageType
            );

        // ========================================================
        // Debug
        // ========================================================

        if (
            global.config.DeveloperMode
        ) {

            console.log(
                "======================================"
            );

            console.log(
                "🔥 KIRA EVENT RECEIVED"
            );

            console.log(
                "TYPE:",
                type
            );

            console.log(
                "LOG TYPE:",
                logMessageType
            );

            console.log(
                "THREAD:",
                threadID
            );

            console.log(
                "SENDER:",
                senderID
            );

            console.log(
                "======================================"
            );

        }

        // ========================================================
        // تجاهل رسائل البوت نفسه
        // ========================================================

        if (
            isBotMessage(event)
        ) {

            return;

        }

        // ========================================================
        // الحظر
        // ========================================================

        if (
            isBanned(
                threadID,
                senderID
            )
        ) {

            // المطور يستطيع الاستمرار
            const admins =
                global.config.ADMINBOT ||
                [];

            if (
                !admins.includes(
                    senderID
                )
            ) {

                return;

            }

        }

        // ========================================================
        // الرسائل
        // ========================================================

        if (
            type === "message" ||
            type === "message_reply"
        ) {

            try {

                await handleCreateDatabase({
                    event
                });

            } catch (e) {

                console.error(
                    "CREATE DATABASE MESSAGE ERROR:",
                    e
                );

            }

            try {

                await handleCommand({
                    event
                });

            } catch (e) {

                console.error(
                    "HANDLE COMMAND ERROR:",
                    e
                );

            }

            try {

                await handleReply({
                    event
                });

            } catch (e) {

                console.error(
                    "HANDLE REPLY ERROR:",
                    e
                );

            }

            try {

                await handleCommandEvent({
                    event
                });

            } catch (e) {

                console.error(
                    "HANDLE COMMAND EVENT ERROR:",
                    e
                );

            }

            return;

        }

        // ========================================================
        // Reaction
        // ========================================================

        if (
            type === "message_reaction"
        ) {

            try {

                await handleReaction({
                    event
                });

            } catch (e) {

                console.error(
                    "HANDLE REACTION ERROR:",
                    e
                );

            }

            try {

                await handleEvent({
                    event
                });

            } catch (e) {

                console.error(
                    "HANDLE EVENT REACTION ERROR:",
                    e
                );

            }

            return;

        }

        // ========================================================
        // جميع أحداث المجموعة
        // ========================================================

        const isGroupEvent =
            type === "event" ||
            logMessageType === "log:subscribe" ||
            logMessageType === "log:unsubscribe" ||
            logMessageType === "log:thread-admins" ||
            logMessageType === "log:thread-name" ||
            logMessageType === "log:thread-icon" ||
            type === "change_thread_image";

        if (
            isGroupEvent
        ) {

            // ----------------------------------------------------
            // تحديث قاعدة البيانات
            // ----------------------------------------------------

            try {

                await handleCreateDatabase({
                    event
                });

            } catch (e) {

                console.error(
                    "CREATE DATABASE EVENT ERROR:",
                    e
                );

            }

            // ----------------------------------------------------
            // تشغيل Events
            // ----------------------------------------------------

            try {

                await handleEvent({
                    event
                });

            } catch (e) {

                console.error(
                    "HANDLE EVENT ERROR:",
                    e
                );

            }

            // ----------------------------------------------------
            // تحديث البيانات
            // ----------------------------------------------------

            try {

                await handleRefresh({
                    event
                });

            } catch (e) {

                console.error(
                    "HANDLE REFRESH ERROR:",
                    e
                );

            }

            // ----------------------------------------------------
            // عند دخول البوت للمجموعة
            // ----------------------------------------------------

            if (
                logMessageType ===
                "log:subscribe"
            ) {

                try {

                    const added =
                        event.logMessageData &&
                        Array.isArray(
                            event.logMessageData
                                .addedParticipants
                        )
                            ? event.logMessageData
                                .addedParticipants
                            : [];

                    const botID =
                        String(
                            api.getCurrentUserID()
                        );

                    const botAdded =
                        added.some(
                            participant =>
                                String(
                                    participant.userFbId
                                ) === botID
                        );

                    if (
                        botAdded &&
                        global.config.notiGroup
                    ) {

                        try {

                            await api.changeNickname(
                                `『 ${global.config.PREFIX} 』 • ${global.config.BOTNAME}`,
                                threadID,
                                botID
                            );

                        } catch (e) {}

                        try {

                            await api.sendMessage(
                                `◈ ───『 ${global.config.BOTNAME} 』─── ◈\n\n` +
                                `✅ تم الاتصال بنجاح!\n\n` +
                                `📋 البادئة: ${global.config.PREFIX}\n` +
                                `💡 اكتب ${global.config.PREFIX}أوامر\n\n` +
                                `◈ ────────────── ◈`,
                                threadID
                            );

                        } catch (e) {}

                    }

                } catch (e) {

                    console.error(
                        "BOT JOIN ERROR:",
                        e
                    );

                }

            }

            return;

        }

        // ========================================================
        // أي حدث غير معروف
        // ========================================================

        try {

            await handleEvent({
                event
            });

        } catch (e) {

            console.error(
                "UNKNOWN EVENT HANDLER ERROR:",
                e
            );

        }

    };
};