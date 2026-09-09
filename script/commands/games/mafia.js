/**
 * mafia.js
 * الأمر الرئيسي للعبة المافيا
 *
 * الأوامر:
 *
 * مافيا
 * مافيا بدء
 * مافيا إيقاف
 *
 * الانضمام:
 * 👍 على رسالة التسجيل
 *
 * ملاحظات:
 * - إنشاء وإيقاف اللعبة للأدمن فقط
 * - بدء اللعبة للأدمن فقط
 * - الحد الأدنى 8 لاعبين
 * - الحد الأقصى 50 لاعب
 * - التسجيل مستقل لكل مجموعة
 * - يعتمد على UID وليس الاسم
 */

const game = require("./mafia/game.js");
const roles = require("./mafia/roles.js");
const rooms = require("./mafia/rooms.js");
const actions = require("./mafia/actions.js");

// ==================================================
// الإعدادات
// ==================================================

const MIN_PLAYERS = 8;
const MAX_PLAYERS = 50;

// ==================================================
// أدوات عامة
// ==================================================

function sendMessage(api, body, threadID, replyTo = null) {

    return new Promise(resolve => {

        try {

            if (replyTo) {

                api.sendMessage(
                    body,
                    threadID,
                    replyTo,
                    () => resolve()
                );

            } else {

                api.sendMessage(
                    body,
                    threadID,
                    () => resolve()
                );
            }

        } catch (error) {

            console.error(
                "[MAFIA] SEND ERROR:",
                error
            );

            resolve();
        }
    });
}

// ==================================================
// الحصول على ID البوت
// ==================================================

function getBotID(api) {

    try {

        if (
            api &&
            typeof api.getCurrentUserID === "function"
        ) {

            return String(
                api.getCurrentUserID()
            );
        }

    } catch (error) {

        console.error(
            "[MAFIA] BOT ID ERROR:",
            error
        );
    }

    return "";
}

// ==================================================
// معلومات المجموعة
// ==================================================

async function getThreadInfo(
    api,
    Threads,
    threadID
) {

    threadID =
        String(threadID || "");

    if (!threadID) {
        return null;
    }

    // ==================================================
    // Threads Controller
    // ==================================================

    try {

        if (
            Threads &&
            typeof Threads.getInfo ===
            "function"
        ) {

            const result =
                Threads.getInfo(
                    threadID
                );

            if (
                result &&
                typeof result.then ===
                "function"
            ) {

                const info =
                    await Promise.race([

                        result.catch(
                            () => null
                        ),

                        new Promise(
                            resolve =>
                                setTimeout(
                                    () =>
                                        resolve(null),
                                    5000
                                )
                        )

                    ]);

                if (info) {
                    return info;
                }
            }

        }

    } catch (error) {

        console.error(
            "[MAFIA] THREADS INFO ERROR:",
            error.message
        );
    }

    // ==================================================
    // API
    // ==================================================

    try {

        if (
            !api ||
            typeof api.getThreadInfo !==
            "function"
        ) {

            return null;
        }

        return await new Promise(resolve => {

            let finished = false;

            const done = (
                error,
                info
            ) => {

                if (finished) {
                    return;
                }

                finished = true;

                if (error) {
                    return resolve(null);
                }

                resolve(
                    info || null
                );
            };

            try {

                const result =
                    api.getThreadInfo(
                        threadID,
                        done
                    );

                // دعم Promise
                if (
                    result &&
                    typeof result.then ===
                    "function"
                ) {

                    result
                        .then(
                            info =>
                                done(
                                    null,
                                    info
                                )
                        )
                        .catch(
                            error =>
                                done(
                                    error,
                                    null
                                )
                        );
                }

            } catch (error) {

                done(
                    error,
                    null
                );
            }

            // حماية من التعليق
            setTimeout(
                () => {

                    if (!finished) {

                        finished = true;

                        resolve(null);
                    }

                },
                5000
            );

        });

    } catch (error) {

        console.error(
            "[MAFIA] API THREAD INFO ERROR:",
            error.message
        );

        return null;
    }
}

// ==================================================
// التحقق من أدمن المجموعة
// ==================================================

async function isGroupAdmin(
    api,
    Threads,
    threadID,
    userID
) {

    const info =
        await getThreadInfo(
            api,
            Threads,
            threadID
        );

    if (!info) {

        console.error(
            "[MAFIA] تعذر الحصول على معلومات المجموعة:",
            threadID
        );

        return false;
    }

    const admins =
        Array.isArray(
            info.adminIDs
        )
            ? info.adminIDs
            : [];

    return admins.some(admin => {

        if (
            typeof admin ===
            "object" &&
            admin !== null
        ) {

            return (
                String(
                    admin.id ||
                    admin.userFbId ||
                    admin.userID ||
                    ""
                ) ===
                String(userID)
            );
        }

        return (
            String(admin) ===
            String(userID)
        );
    });
}

// ==================================================
// التحقق من أن البوت أدمن
// ==================================================

async function isBotAdmin(
    api,
    Threads,
    threadID
) {

    const botID =
        getBotID(api);

    if (!botID) {
        return false;
    }

    return isGroupAdmin(
        api,
        Threads,
        threadID,
        botID
    );
}

// ==================================================
// إرسال رسالة التسجيل
// ==================================================

async function createRegistrationMessage({
    api,
    gameData
}) {

    const body =
`╭───〔 لعبة المافيا 〕───╮

بدأ التسجيل في لعبة المافيا

عدد اللاعبين:
${gameData.players.length}/${MAX_PLAYERS}

الحد الأدنى:
${MIN_PLAYERS} لاعبين

طريقة الدخول:
اضغط 👍 على هذه الرسالة

بعد اكتمال العدد يبدأ المطور أو أدمن المجموعة اللعبة

╰──────────────────╯`;

    const sent =
        await new Promise(resolve => {

            try {

                api.sendMessage(
                    body,
                    gameData.threadID,
                    (error, info) => {

                        if (error) {

                            console.error(
                                "[MAFIA] REGISTRATION SEND ERROR:",
                                error
                            );

                            return resolve(null);
                        }

                        resolve(info);
                    }
                );

            } catch (error) {

                console.error(
                    "[MAFIA] REGISTRATION ERROR:",
                    error
                );

                resolve(null);
            }
        });

    if (!sent) {
        return null;
    }

    const messageID =
        String(
            sent.messageID ||
            sent
        );

    game.setRegistrationMessage(
        gameData,
        messageID
    );

    // ==================================================
    // تسجيل HandleReaction
    // ==================================================

    if (!global.client) {
        global.client = {};
    }

    if (
        !Array.isArray(
            global.client.handleReaction
        )
    ) {

        global.client.handleReaction = [];
    }

    global.client.handleReaction =
        global.client.handleReaction.filter(
            item =>
                String(
                    item.messageID
                ) !== messageID
        );

    global.client.handleReaction.push({

        name: "مافيا",

        messageID,

        threadID:
            String(
                gameData.threadID
            ),

        type:
            "mafia-registration"
    });

    return messageID;
}

// ==================================================
// تحديث رسالة التسجيل
// ==================================================

async function updateRegistrationMessage({
    api,
    gameData
}) {

    if (
        !gameData ||
        !gameData.registrationMessageID
    ) {

        return false;
    }

    const messageID =
        String(
            gameData.registrationMessageID
        );

    const body =
`╭───〔 لعبة المافيا 〕───╮

التسجيل مفتوح

اللاعبون:
${gameData.players.length}/${MAX_PLAYERS}

الحد الأدنى للبدء:
${MIN_PLAYERS}

اضغط 👍 للانضمام

${
    gameData.players.length >= MIN_PLAYERS
        ? "العدد أصبح كافيًا لبدء اللعبة"
        : `نحتاج ${MIN_PLAYERS - gameData.players.length} لاعبين إضافيين`
}

╰──────────────────╯`;

    try {

        if (
            typeof api.editMessage !==
            "function"
        ) {

            return false;
        }

        await new Promise(resolve => {

            api.editMessage(
                body,
                messageID,
                () => resolve()
            );

        });

        return true;

    } catch (error) {

        console.error(
            "[MAFIA] UPDATE REGISTRATION ERROR:",
            error
        );

        return false;
    }
}

// ==================================================
// حذف HandleReaction
// ==================================================

function removeRegistrationReaction(
    messageID
) {

    if (
        !global.client ||
        !Array.isArray(
            global.client.handleReaction
        )
    ) {

        return;
    }

    global.client.handleReaction =
        global.client.handleReaction.filter(
            item =>
                !(
                    String(
                        item.messageID
                    ) ===
                    String(
                        messageID
                    )
                )
        );
}

// ==================================================
// الحصول على اسم المستخدم
// ==================================================

async function getUserName(
    api,
    userID
) {

    try {

        if (
            typeof api.getUserInfo ===
            "function"
        ) {

            const info =
                await new Promise(resolve => {

                    api.getUserInfo(
                        String(userID),
                        (
                            error,
                            data
                        ) => {

                            if (error) {
                                return resolve(null);
                            }

                            resolve(data);
                        }
                    );

                });

            if (
                info &&
                info[userID]
            ) {

                return String(
                    info[userID].name ||
                    info[userID].fullName ||
                    "لاعب"
                );
            }
        }

    } catch (error) {}

    return "لاعب";
}

// ==================================================
// إضافة لاعب
// ==================================================

async function addReactionPlayer({
    api,
    gameData,
    userID
}) {

    userID =
        String(
            userID || ""
        );

    if (!userID) {

        return {
            success: false,
            reason: "INVALID_USER"
        };
    }

    // ==================================================
    // البوت لا يدخل اللعبة
    // ==================================================

    const botID =
        getBotID(api);

    if (
        botID &&
        userID === botID
    ) {

        return {
            success: false,
            reason: "BOT"
        };
    }

    // ==================================================
    // اللعبة يجب أن تكون في التسجيل
    // ==================================================

    if (
        gameData.phase !==
        game.PHASES.REGISTRATION
    ) {

        return {
            success: false,
            reason:
                "REGISTRATION_CLOSED"
        };
    }

    // ==================================================
    // الاسم للعرض فقط
    // الهوية الحقيقية UID
    // ==================================================

    const name =
        await getUserName(
            api,
            userID
        );

    return game.addPlayer(
        gameData,
        userID,
        name
    );
}

// ==================================================
// إزالة لاعب من التسجيل
// ==================================================

function removeReactionPlayer({
    gameData,
    userID
}) {

    return game.removePlayer(
        gameData,
        String(userID)
    );
}

// ==================================================
// بدء اللعبة
// ==================================================

async function startGame({
    api,
    gameData
}) {

    if (!gameData) {

        return {
            success: false,
            reason:
                "GAME_NOT_FOUND"
        };
    }

    if (
        gameData.phase !==
        game.PHASES.REGISTRATION
    ) {

        return {
            success: false,
            reason:
                "INVALID_PHASE"
        };
    }

    if (
        gameData.players.length <
        MIN_PLAYERS
    ) {

        return {
            success: false,
            reason:
                "NOT_ENOUGH_PLAYERS",
            count:
                gameData.players.length
        };
    }

    // ==================================================
    // توزيع الأدوار
    // ==================================================

    try {

        game.assignGameRoles(
            gameData
        );

    } catch (error) {

        console.error(
            "[MAFIA] ROLE ASSIGN ERROR:",
            error
        );

        return {
            success: false,
            reason:
                "ROLE_ASSIGN_FAILED",
            error
        };
    }

    // ==================================================
    // STARTING
    // ==================================================

    if (
        !game.prepareGame(
            gameData
        )
    ) {

        return {
            success: false,
            reason:
                "PREPARE_FAILED"
        };
    }

    // ==================================================
    // إزالة تسجيل التفاعل
    // ==================================================

    if (
        gameData.registrationMessageID
    ) {

        removeRegistrationReaction(
            gameData.registrationMessageID
        );
    }

    // ==================================================
    // تجهيز غرف الأدوار
    // ==================================================

    const result =
        await actions.startGameAfterPreparation({
            api,
            gameData
        });

    // ==================================================
    // فشل تجهيز الغرف
    // ==================================================

    if (
        !result ||
        !result.success
    ) {

        gameData.phase =
            game.PHASES.REGISTRATION;

        gameData.currentAction =
            null;

        game.saveGames();

        // ==================================================
        // إعادة HandleReaction
        // ==================================================

        if (
            gameData.registrationMessageID
        ) {

            if (!global.client) {
                global.client = {};
            }

            if (
                !Array.isArray(
                    global.client.handleReaction
                )
            ) {

                global.client.handleReaction = [];
            }

            const exists =
                global.client.handleReaction
                    .some(
                        item =>
                            String(
                                item.messageID
                            ) ===
                            String(
                                gameData.registrationMessageID
                            )
                    );

            if (!exists) {

                global.client.handleReaction.push({

                    name: "مافيا",

                    messageID:
                        String(
                            gameData.registrationMessageID
                        ),

                    threadID:
                        String(
                            gameData.threadID
                        ),

                    type:
                        "mafia-registration"
                });
            }
        }

        return {
            success: false,
            reason:
                "ROLE_ROOMS_FAILED",
            details:
                result
        };
    }

    return {
        success: true
    };
}

// ==================================================
// إيقاف اللعبة
// ==================================================

async function stopGame({
    api,
    gameData
}) {

    if (!gameData) {
        return false;
    }

    // ==================================================
    // تنظيف غرف الأدوار
    // ==================================================

    if (
        gameData.phase !==
        game.PHASES.REGISTRATION
    ) {

        try {

            await rooms.cleanupRoleRooms(
                api,
                gameData.players
            );

        } catch (error) {

            console.error(
                "[MAFIA] CLEANUP ERROR:",
                error
            );
        }
    }

    // ==================================================
    // إزالة Reaction handler
    // ==================================================

    if (
        gameData.registrationMessageID
    ) {

        removeRegistrationReaction(
            gameData.registrationMessageID
        );
    }

    // ==================================================
    // حذف اللعبة
    // ==================================================

    game.deleteGame(
        gameData.threadID
    );

    return true;
}

// ==================================================
// HandleReaction
// ==================================================

module.exports.handleReaction =
async function ({
    api,
    event,
    handleReaction
}) {

    try {

        if (!event) {
            return;
        }

        const senderID =
            String(
                event.senderID ||
                event.userID ||
                event.author ||
                ""
            );

        const threadID =
            String(
                event.threadID ||
                ""
            );

        const messageID =
            String(
                event.messageID ||
                ""
            );

        if (
            !senderID ||
            !threadID ||
            !messageID
        ) {

            return;
        }

        // ==================================================
        // التأكد من الرسالة
        // ==================================================

        if (
            handleReaction &&
            handleReaction.messageID &&
            String(
                handleReaction.messageID
            ) !== messageID
        ) {

            return;
        }

        const gameData =
            game.getGame(
                threadID
            );

        if (!gameData) {
            return;
        }

        if (
            gameData.phase !==
            game.PHASES.REGISTRATION
        ) {

            return;
        }

        if (
            String(
                gameData.registrationMessageID
            ) !== messageID
        ) {

            return;
        }

        // ==================================================
        // نوع التفاعل
        // ==================================================

        const reaction =
            String(
                event.reaction ||
                event.reactionType ||
                ""
            );

        const isJoinReaction =
            reaction === "👍" ||
            reaction === "like" ||
            reaction === "LIKE";

        if (!isJoinReaction) {
            return;
        }

        // ==================================================
        // إضافة اللاعب
        // ==================================================

        const result =
            await addReactionPlayer({
                api,
                gameData,
                userID:
                    senderID
            });

        if (
            !result.success
        ) {

            const messages = {

                ALREADY_JOINED:
                    "أنت داخل اللعبة أصلًا",

                GAME_FULL:
                    "اللعبة اكتملت، لا يمكن دخول لاعبين إضافيين",

                REGISTRATION_CLOSED:
                    "التسجيل انتهى",

                BOT:
                    "البوت ما يلعب معكم '-'"
            };

            if (
                messages[result.reason]
            ) {

                await sendMessage(
                    api,
                    messages[result.reason],
                    threadID
                );
            }

            return;
        }

        // ==================================================
        // تأكيد الدخول
        // ==================================================

        await sendMessage(
            api,
            `تم تسجيلك في اللعبة\nعدد اللاعبين الآن: ${gameData.players.length}/${MAX_PLAYERS}`,
            threadID
        );

        // ==================================================
        // تحديث التسجيل
        // ==================================================

        await updateRegistrationMessage({
            api,
            gameData
        });

    } catch (error) {

        console.error(
            "[MAFIA] HANDLE REACTION ERROR:",
            error
        );
    }
};

// ==================================================
// الأمر الرئيسي
// ==================================================

module.exports.run =
async function ({
    api,
    event,
    args,
    Threads
}) {

    const threadID =
        String(
            event.threadID || ""
        );

    const senderID =
        String(
            event.senderID || ""
        );

    if (!threadID) {
        return;
    }

    const commandArgs =
        Array.isArray(args)
            ? args
                .map(
                    item =>
                        String(item)
                )
                .filter(Boolean)
            : [];

    const action =
        String(
            commandArgs[0] || ""
        )
            .toLowerCase()
            .trim();

    // ==================================================
    // التحقق من أدمن المجموعة
    // ==================================================

    const admin =
        await isGroupAdmin(
            api,
            Threads,
            threadID,
            senderID
        );

    // ==================================================
    // إيقاف اللعبة
    // ==================================================

    if (
        action === "إيقاف" ||
        action === "ايقاف" ||
        action === "stop" ||
        action === "off"
    ) {

        if (!admin) {

            return sendMessage(
                api,
                "هذا الأمر مخصص لأدمن المجموعة",
                threadID,
                event.messageID
            );
        }

        const gameData =
            game.getGame(
                threadID
            );

        if (!gameData) {

            return sendMessage(
                api,
                "لا توجد لعبة مافيا في هذه المجموعة",
                threadID,
                event.messageID
            );
        }

        await stopGame({
            api,
            gameData
        });

        return sendMessage(
            api,
            "تم إيقاف لعبة المافيا وتنظيف غرف الأدوار",
            threadID,
            event.messageID
        );
    }

    // ==================================================
    // بدء اللعبة
    // ==================================================

    if (
        action === "بدء" ||
        action === "ابدأ" ||
        action === "start"
    ) {

        if (!admin) {

            return sendMessage(
                api,
                "بدء اللعبة مخصص لأدمن المجموعة",
                threadID,
                event.messageID
            );
        }

        const gameData =
            game.getGame(
                threadID
            );

        if (!gameData) {

            return sendMessage(
                api,
                "لا توجد لعبة تسجيل حاليًا\nاستخدم مافيا أولًا",
                threadID,
                event.messageID
            );
        }

        if (
            gameData.phase !==
            game.PHASES.REGISTRATION
        ) {

            return sendMessage(
                api,
                "اللعبة بدأت بالفعل أو ليست في مرحلة التسجيل",
                threadID,
                event.messageID
            );
        }

        if (
            gameData.players.length <
            MIN_PLAYERS
        ) {

            return sendMessage(
                api,
                `لا يمكن بدء اللعبة الآن\nاللاعبون: ${gameData.players.length}/${MIN_PLAYERS}`,
                threadID,
                event.messageID
            );
        }

        // ==================================================
        // التأكد من أن البوت أدمن
        // ==================================================

        const botAdmin =
            await isBotAdmin(
                api,
                Threads,
                threadID
            );

        if (!botAdmin) {

            return sendMessage(
                api,
                "لا أستطيع بدء اللعبة لأنني لست أدمن في المجموعة",
                threadID,
                event.messageID
            );
        }

        await sendMessage(
            api,
            `جاري تجهيز اللعبة\nعدد اللاعبين: ${gameData.players.length}\nانتظر حتى يتم تجهيز غرف الأدوار`,
            threadID
        );

        const result =
            await startGame({
                api,
                gameData
            });

        if (!result.success) {

            if (
                result.reason ===
                "ROLE_ROOMS_FAILED"
            ) {

                return sendMessage(
                    api,
                    "لم تبدأ اللعبة\nفشل إضافة أحد اللاعبين إلى غرفة دوره\nتم إلغاء بدء اللعبة ويمكن المحاولة مرة أخرى",
                    threadID
                );
            }

            return sendMessage(
                api,
                "تعذر بدء لعبة المافيا",
                threadID
            );
        }

        return;
    }

    // ==================================================
    // إنشاء لعبة جديدة
    // ==================================================

    if (!admin) {

        return sendMessage(
            api,
            "إنشاء لعبة المافيا مخصص لأدمن المجموعة",
            threadID,
            event.messageID
        );
    }

    // ==================================================
    // منع وجود أكثر من لعبة
    // ==================================================

    const existing =
        game.getGame(
            threadID
        );

    if (existing) {

        if (
            existing.phase ===
            game.PHASES.REGISTRATION
        ) {

            return sendMessage(
                api,
                `التسجيل مفتوح بالفعل\nاللاعبون: ${existing.players.length}/${MAX_PLAYERS}\nاضغطوا 👍 على رسالة التسجيل\nوللبدء استخدم: مافيا بدء`,
                threadID,
                event.messageID
            );
        }

        return sendMessage(
            api,
            "هناك لعبة مافيا جارية بالفعل في هذه المجموعة",
            threadID,
            event.messageID
        );
    }

    // ==================================================
    // التأكد من أن البوت أدمن
    // ==================================================

    const botAdmin =
        await isBotAdmin(
            api,
            Threads,
            threadID
        );

    if (!botAdmin) {

        return sendMessage(
            api,
            "يجب أن أكون أدمن في المجموعة قبل إنشاء لعبة المافيا",
            threadID,
            event.messageID
        );
    }

    // ==================================================
    // إنشاء اللعبة
    // ==================================================

    const gameData =
        game.createGame(
            threadID
        );

    // ==================================================
    // إرسال رسالة التسجيل
    // ==================================================

    const messageID =
        await createRegistrationMessage({
            api,
            gameData
        });

    if (!messageID) {

        game.deleteGame(
            threadID
        );

        return sendMessage(
            api,
            "فشل إنشاء رسالة التسجيل",
            threadID,
            event.messageID
        );
    }

    return sendMessage(
        api,
        `تم فتح التسجيل\nالحد الأدنى ${MIN_PLAYERS} لاعبين\nالحد الأقصى ${MAX_PLAYERS} لاعب\nاضغط 👍 على رسالة التسجيل للدخول`,
        threadID
    );
};

// ==================================================
// إعدادات الأمر
// ==================================================

module.exports.config = {

    name: "مافيا",

    version: "1.0.0",

    hasPermssion: 0,

    credits: "أبو هريرة",

    description:
        "لعبة مافيا متعددة اللاعبين",

    commandCategory:
        "Games",

    usages:
        "مافيا | مافيا بدء | مافيا إيقاف",

    cooldowns: 5
};