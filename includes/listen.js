/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║                 KIRA — LISTEN SYSTEM                         ║
 * ║              Event Router — Stable Version                   ║
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

    const handleCommand = require("./handle/handleCommand")({
        api,
        models,
        Users,
        Threads,
        Currencies
    });

    const handleCommandEvent = require("./handle/handleCommandEvent")({
        api,
        models,
        Users,
        Threads,
        Currencies
    });

    const handleReply = require("./handle/handleReply")({
        api,
        models,
        Users,
        Threads,
        Currencies
    });

    const handleReaction = require("./handle/handleReaction")({
        api,
        models,
        Users,
        Threads,
        Currencies
    });

    const handleEvent = require("./handle/handleEvent")({
        api,
        models,
        Users,
        Threads,
        Currencies
    });

    const handleRefresh = require("./handle/handleRefresh")({
        api,
        models,
        Users,
        Threads,
        Currencies
    });

    const handleCreateDatabase = require("./handle/handleCreateDatabase")({
        api,
        Threads,
        Users,
        Currencies,
        models
    });

    const handleNotification = require("./handle/handleNotification")({
        api
    });

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

            const threads = await Threads.getAll([
                "threadID",
                "data",
                "threadInfo"
            ]);

            for (const thread of threads) {

                const tid =
                    String(thread.threadID);

                if (
                    !global.data.allThreadID.includes(tid)
                ) {

                    global.data.allThreadID.push(tid);

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
                    thread.data.banned == 1
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
                        !global.data.threadAllowNSFW.includes(tid)
                    ) {

                        global.data.threadAllowNSFW.push(tid);

                    }
                }
            }

            // ----------------------------------------------------
            // Users
            // ----------------------------------------------------

            const users = await Users.getAll([
                "userID",
                "name",
                "data"
            ]);

            for (const user of users) {

                const uid =
                    String(user.userID);

                if (
                    !global.data.allUserID.includes(uid)
                ) {

                    global.data.allUserID.push(uid);

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
                    user.data.banned == 1
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

            // ----------------------------------------------------
            // Currencies
            // ----------------------------------------------------

            const currencies =
                await Currencies.getAll([
                    "userID"
                ]);

            for (const currency of currencies) {

                const uid =
                    String(currency.userID);

                if (
                    !global.data.allCurrenciesID.includes(uid)
                ) {

                    global.data.allCurrenciesID.push(uid);

                }
            }

            logger(
                "✅ اكتمل تحميل قاعدة البيانات",
                "[ DATABASE ]"
            );

        } catch (error) {

            console.error(
                "❌ DATABASE LOAD ERROR:",
                error
            );

            logger(
                `❌ فشل تحميل قاعدة البيانات: ${error.message}`,
                "error"
            );
        }

    })();

    // ============================================================
    // Startup
    // ============================================================

    logger(
`
╔═══════════════════════════════════════════════════════════════╗
║                  ${global.config.BOTNAME || "KIRA"} SYSTEM
║───────────────────────────────────────────────────────────────║
║ PREFIX : ${global.config.PREFIX || "."}
║ STATUS : ONLINE
║ COMMANDS: ${global.client.commands.size}
║ EVENTS  : ${global.client.events.size}
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

        } catch (error) {}

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

            } catch (error) {}

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
        // حماية
        // ========================================================

        try {

            if (
                global.data.userBanned &&
                global.data.userBanned.has(senderID)
            ) {

                // يسمح للمطور بالمرور
                const admins =
                    global.config.ADMINBOT || [];

                if (
                    !admins.includes(senderID)
                ) {

                    return;
                }
            }

            if (
                global.data.threadBanned &&
                global.data.threadBanned.has(threadID)
            ) {

                const admins =
                    global.config.ADMINBOT || [];

                if (
                    !admins.includes(senderID)
                ) {

                    return;
                }
            }

            // ====================================================
            // منع الخاص
            // ====================================================

            if (
                global.config.allowInbox === false &&
                senderID === threadID
            ) {

                return;
            }

        } catch (error) {

            console.error(
                "❌ LISTEN FILTER ERROR:",
                error
            );
        }

        // ============================================================
        // DEBUG
        // ============================================================

        if (
            global.config.DeveloperMode
        ) {

            console.log(
                `[LISTEN] type=${type} log=${logMessageType} thread=${threadID} sender=${senderID}`
            );
        }

        // ============================================================
        // MESSAGE
        // ============================================================

        if (
            type === "message" ||
            type === "message_reply"
        ) {

            try {

                // إنشاء/تحديث قاعدة البيانات
                await handleCreateDatabase({
                    event
                });

            } catch (error) {

                console.error(
                    "❌ handleCreateDatabase:",
                    error
                );
            }

            // ----------------------------------------------------
            // الأوامر
            // ----------------------------------------------------

            try {

                await handleCommand({
                    event
                });

            } catch (error) {

                console.error(
                    "❌ handleCommand:",
                    error
                );
            }

            // ----------------------------------------------------
            // Replies
            // ----------------------------------------------------

            try {

                await handleReply({
                    event
                });

            } catch (error) {

                console.error(
                    "❌ handleReply:",
                    error
                );
            }

            // ----------------------------------------------------
            // Command Events
            // ----------------------------------------------------

            try {

                await handleCommandEvent({
                    event
                });

            } catch (error) {

                console.error(
                    "❌ handleCommandEvent:",
                    error
                );
            }

            // ----------------------------------------------------
            // IMPORTANT
            // Events على الرسائل
            //
            // هنا يتم تشغيل:
            // منع الكلام
            // مراقبة الرسائل
            // anti-spam
            // وغيرها
            // ----------------------------------------------------

            try {

                await handleEvent({
                    event
                });

            } catch (error) {

                console.error(
                    "❌ handleEvent MESSAGE:",
                    error
                );
            }

            return;
        }

        // ============================================================
        // REACTION
        // ============================================================

        if (
            type === "message_reaction"
        ) {

            try {

                await handleReaction({
                    event
                });

            } catch (error) {

                console.error(
                    "❌ handleReaction:",
                    error
                );
            }

            // السماح أيضًا للإيفنتات التي تعتمد على reaction
            try {

                await handleEvent({
                    event
                });

            } catch (error) {

                console.error(
                    "❌ handleEvent REACTION:",
                    error
                );
            }

            return;
        }

        // ============================================================
        // JOIN
        // ============================================================

        if (
            logMessageType ===
            "log:subscribe"
        ) {

            try {

                await handleCreateDatabase({
                    event
                });

            } catch (error) {

                console.error(
                    "❌ Database JOIN:",
                    error
                );
            }

            // تشغيل Events
            try {

                await handleEvent({
                    event
                });

            } catch (error) {

                console.error(
                    "❌ handleEvent JOIN:",
                    error
                );
            }

            // تحديث البيانات
            try {

                await handleRefresh({
                    event
                });

            } catch (error) {

                console.error(
                    "❌ handleRefresh JOIN:",
                    error
                );
            }

            // ----------------------------------------------------
            // رسالة دخول البوت
            // ----------------------------------------------------

            try {

                if (
                    global.config.notiGroup
                ) {

                    const added =
                        event.logMessageData &&
                        Array.isArray(
                            event.logMessageData.addedParticipants
                        )
                            ? event.logMessageData.addedParticipants
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

                    if (botAdded) {

                        await api.changeNickname(
                            `『 ${global.config.PREFIX} 』• ${global.config.BOTNAME}`,
                            threadID,
                            botID
                        );

                        await api.sendMessage(
`
◈ ───『 ✨ ${global.config.BOTNAME} ✨ 』─── ◈

✅ تم الاتصال بنجاح!

📋 البادئة:
${global.config.PREFIX}

💡 اكتب:
${global.config.PREFIX}أوامر

◈ ────────────── ◈
`,
                            threadID
                        );
                    }
                }

            } catch (error) {

                console.error(
                    "❌ BOT JOIN MESSAGE:",
                    error
                );
            }

            return;
        }

        // ============================================================
        // LEAVE
        // ============================================================

        if (
            logMessageType ===
            "log:unsubscribe"
        ) {

            try {

                await handleEvent({
                    event
                });

            } catch (error) {

                console.error(
                    "❌ handleEvent LEAVE:",
                    error
                );
            }

            try {

                await handleRefresh({
                    event
                });

            } catch (error) {

                console.error(
                    "❌ handleRefresh LEAVE:",
                    error
                );
            }

            return;
        }

        // ============================================================
        // THREAD ADMINS
        // ============================================================

        if (
            logMessageType ===
            "log:thread-admins"
        ) {

            try {

                await handleEvent({
                    event
                });

            } catch (error) {

                console.error(
                    "❌ handleEvent ADMINS:",
                    error
                );
            }

            try {

                await handleRefresh({
                    event
                });

            } catch (error) {

                console.error(
                    "❌ handleRefresh ADMINS:",
                    error
                );
            }

            return;
        }

        // ============================================================
        // THREAD NAME
        // ============================================================

        if (
            logMessageType ===
            "log:thread-name"
        ) {

            try {

                await handleRefresh({
                    event
                });

            } catch (error) {

                console.error(
                    "❌ handleRefresh NAME:",
                    error
                );
            }

            try {

                await handleEvent({
                    event
                });

            } catch (error) {

                console.error(
                    "❌ handleEvent NAME:",
                    error
                );
            }

            return;
        }

        // ============================================================
        // THREAD IMAGE / ICON
        // ============================================================

        if (
            logMessageType ===
            "log:thread-icon" ||
            type === "change_thread_image"
        ) {

            try {

                await handleEvent({
                    event
                });

            } catch (error) {

                console.error(
                    "❌ handleEvent IMAGE:",
                    error
                );
            }

            try {

                await handleRefresh({
                    event
                });

            } catch (error) {

                console.error(
                    "❌ handleRefresh IMAGE:",
                    error
                );
            }

            return;
        }

        // ============================================================
        // GENERIC EVENT
        // ============================================================

        if (
            type === "event"
        ) {

            try {

                await handleCreateDatabase({
                    event
                });

            } catch (error) {

                console.error(
                    "❌ Database EVENT:",
                    error
                );
            }

            try {

                await handleEvent({
                    event
                });

            } catch (error) {

                console.error(
                    "❌ handleEvent EVENT:",
                    error
                );
            }

            try {

                await handleRefresh({
                    event
                });

            } catch (error) {

                console.error(
                    "❌ handleRefresh EVENT:",
                    error
                );
            }

            return;
        }

        // ============================================================
        // أي Event غير معروف
        // ============================================================

        try {

            await handleEvent({
                event
            });

        } catch (error) {

            console.error(
                "❌ handleEvent UNKNOWN:",
                error
            );
        }

    };
};