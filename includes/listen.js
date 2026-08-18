/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║                  KIRA LISTEN.JS — FIXED                      ║
 * ║              Central Event & Command Router                   ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

module.exports = function ({ api, models }) {

    const logger = require("../utils/log.js");

    // ============================================================
    // Controllers
    // ============================================================

    const Users = require("./controllers/users")({
        models,
        api
    });

    const Threads = require("./controllers/threads")({
        models,
        api
    });

    const Currencies = require("./controllers/currencies")({
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
    // تحميل قاعدة البيانات
    // ============================================================

    (async function () {

        try {

            logger(
                "📊 جاري تحميل قاعدة البيانات...",
                "[ DATABASE ]"
            );

            // ----------------------------------------------------
            // Threads
            // ----------------------------------------------------

            try {

                const threads =
                    await Threads.getAll([
                        "threadID",
                        "data",
                        "threadInfo"
                    ]);

                for (const thread of threads) {

                    const tid =
                        String(thread.threadID);

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
                                    thread.data.reason || "",

                                dateAdded:
                                    thread.data.dateAdded ||
                                    Date.now()
                            }
                        );

                    }

                    // حظر أوامر
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

            } catch (error) {

                console.error(
                    "THREAD DATABASE ERROR:",
                    error
                );

            }

            // ----------------------------------------------------
            // Users
            // ----------------------------------------------------

            try {

                const users =
                    await Users.getAll([
                        "userID",
                        "name",
                        "data"
                    ]);

                for (const user of users) {

                    const uid =
                        String(user.userID);

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

                    // حظر المستخدم
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
                                    user.data.reason || "",

                                dateAdded:
                                    user.data.dateAdded ||
                                    Date.now()
                            }
                        );

                    }

                    // حظر الأوامر
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

            } catch (error) {

                console.error(
                    "USER DATABASE ERROR:",
                    error
                );

            }

            // ----------------------------------------------------
            // Currencies
            // ----------------------------------------------------

            try {

                const currencies =
                    await Currencies.getAll([
                        "userID"
                    ]);

                for (
                    const currency of currencies
                ) {

                    const uid =
                        String(currency.userID);

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

            } catch (error) {

                console.error(
                    "CURRENCY DATABASE ERROR:",
                    error
                );

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

        }

    })();

    // ============================================================
    // Startup
    // ============================================================

    logger(
`
╔═══════════════════════════════════════════════════════════════╗
║                    KIRA SYSTEM ONLINE                        ║
║───────────────────────────────────────────────────────────────║
║ PREFIX: ${global.config.PREFIX || "."}
║ STATUS: 🟢 ONLINE
╚═══════════════════════════════════════════════════════════════╝
`,
        "[ SYSTEM ]"
    );

    // ============================================================
    // Statistics
    // ============================================================

    setInterval(() => {

        try {

            logger(
                `📊 ${global.data.allThreadID.length} Groups | ` +
                `${global.data.allUserID.length} Users | ` +
                `${global.client.commands.size} Commands | ` +
                `${global.client.events.size} Events`,
                "[ STATS ]"
            );

        } catch (e) {}

    }, 1800000);

    // ============================================================
    // Notifications
    // ============================================================

    if (global.config.NOTIFICATION) {

        setInterval(() => {

            try {

                if (typeof handleNotification === "function") {

                    handleNotification({
                        api
                    });

                }

            } catch (error) {

                console.error(
                    "NOTIFICATION ERROR:",
                    error
                );

            }

        }, 60000);

    }

    // ============================================================
    // MAIN LISTENER
    // ============================================================

    return async function (event) {

        if (!event) {
            return;
        }

        // ========================================================
        // IDs
        // ========================================================

        const threadID =
            String(event.threadID || "");

        const senderID =
            String(event.senderID || "");

        const type =
            String(event.type || "");

        const logMessageType =
            String(
                event.logMessageType || ""
            );

        // ========================================================
        // Developer Debug
        // ========================================================

        if (
            global.config.DeveloperMode
        ) {

            console.log(
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            );

            console.log(
                "📡 KIRA EVENT RECEIVED"
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
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            );

        }

        // ========================================================
        // Inbox
        // ========================================================

        if (
            global.config.allowInbox === false &&
            senderID === threadID
        ) {

            return;

        }

        // ========================================================
        // الحظر
        // ========================================================

        try {

            if (
                global.data.userBanned &&
                global.data.userBanned.has(
                    senderID
                )
            ) {

                return;

            }

            if (
                global.data.threadBanned &&
                global.data.threadBanned.has(
                    threadID
                )
            ) {

                return;

            }

        } catch (e) {}

        // ========================================================
        // MAIN
        // ========================================================

        try {

            // ====================================================
            // 1. MESSAGE
            // ====================================================

            if (
                type === "message" ||
                type === "message_reply"
            ) {

                // تحديث قاعدة البيانات
                await handleCreateDatabase({
                    event
                });

                // تشغيل الأوامر
                await handleCommand({
                    event
                });

                // تشغيل الردود
                await handleReply({
                    event
                });

                // تشغيل command events
                await handleCommandEvent({
                    event
                });

                // مهم جدًا
                // تشغيل جميع Events على الرسائل
                await handleEvent({
                    event
                });

                return;
            }

            // ====================================================
            // 2. REACTION
            // ====================================================

            if (
                type === "message_reaction"
            ) {

                await handleReaction({
                    event
                });

                await handleEvent({
                    event
                });

                return;
            }

            // ====================================================
            // 3. JOIN
            // ====================================================

            if (
                logMessageType ===
                "log:subscribe"
            ) {

                await handleCreateDatabase({
                    event
                });

                await handleEvent({
                    event
                });

                await handleRefresh({
                    event
                });

                // ----------------------------------------------
                // إذا كان البوت هو الذي تمت إضافته
                // ----------------------------------------------

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
                                `『 ${global.config.PREFIX} 』• ${global.config.BOTNAME}`,
                                threadID,
                                botID
                            );

                        } catch (e) {}

                        try {

                            await api.sendMessage(
`
◈ ───『 ${global.config.BOTNAME || "KIRA"} 』─── ◈

✅ تم الاتصال بنجاح!

📋 البادئة:
${global.config.PREFIX}

💡 اكتب:
${global.config.PREFIX}أوامر

◈ ───────────────── ◈
`,
                                threadID
                            );

                        } catch (e) {}

                    }

                } catch (error) {

                    console.error(
                        "BOT JOIN MESSAGE ERROR:",
                        error
                    );

                }

                return;
            }

            // ====================================================
            // 4. LEAVE
            // ====================================================

            if (
                logMessageType ===
                "log:unsubscribe"
            ) {

                await handleEvent({
                    event
                });

                await handleRefresh({
                    event
                });

                return;
            }

            // ====================================================
            // 5. ADMIN CHANGE
            // ====================================================

            if (
                logMessageType ===
                "log:thread-admins"
            ) {

                await handleEvent({
                    event
                });

                await handleRefresh({
                    event
                });

                return;
            }

            // ====================================================
            // 6. GROUP NAME
            // ====================================================

            if (
                logMessageType ===
                "log:thread-name"
            ) {

                await handleRefresh({
                    event
                });

                await handleEvent({
                    event
                });

                return;
            }

            // ====================================================
            // 7. GROUP IMAGE / ICON
            // ====================================================

            if (
                logMessageType ===
                "log:thread-icon" ||
                type === "change_thread_image"
            ) {

                await handleEvent({
                    event
                });

                await handleRefresh({
                    event
                });

                return;
            }

            // ====================================================
            // 8. GENERAL EVENT
            // ====================================================

            if (
                type === "event"
            ) {

                await handleCreateDatabase({
                    event
                });

                await handleEvent({
                    event
                });

                await handleRefresh({
                    event
                });

                return;
            }

            // ====================================================
            // 9. ANY UNKNOWN EVENT
            // ====================================================

            await handleEvent({
                event
            });

        } catch (error) {

            // ====================================================
            // ERROR
            // ====================================================

            console.error(
                "═══════════════════════════════════════"
            );

            console.error(
                "❌ KIRA LISTEN ERROR"
            );

            console.error(
                "TYPE:",
                type
            );

            console.error(
                "LOG TYPE:",
                logMessageType
            );

            console.error(
                "THREAD:",
                threadID
            );

            console.error(
                "SENDER:",
                senderID
            );

            console.error(
                "ERROR:",
                error
            );

            console.error(
                "═══════════════════════════════════════"
            );

            try {

                logger(
                    `❌ LISTEN ERROR
TYPE: ${type}
LOG TYPE: ${logMessageType}
THREAD: ${threadID}
ERROR: ${error.message}`,
                    "error"
                );

            } catch (e) {}

            // ====================================================
            // إرسال الخطأ للمطور
            // ====================================================

            if (
                global.config.DeveloperMode &&
                Array.isArray(
                    global.config.ADMINBOT
                ) &&
                global.config.ADMINBOT[0]
            ) {

                try {

                    await api.sendMessage(
                        `⚠️ KIRA LISTEN ERROR

TYPE:
${type}

LOG:
${logMessageType}

ERROR:
${error.message}`,
                        global.config.ADMINBOT[0]
                    );

                } catch (e) {}

            }

        }

    };

};