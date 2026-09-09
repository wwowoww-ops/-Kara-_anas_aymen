/**
 * actions.js
 * نظام أفعال لعبة المافيا
 *
 * مسؤول عن:
 * - أفعال المافيا
 * - فعل الطبيب
 * - فعل المحقق
 * - تسلسل الليل
 * - معالجة نتائج الليل
 * - التصويت
 * - إقصاء اللاعب
 * - الانتقال بين الليل والنهار
 * - فحص الفائز
 *
 * يعتمد على:
 * game.js
 * roles.js
 * rooms.js
 *
 * ويستخدم:
 * global.client.handleReply
 */

// ==================================================
// الملفات
// ==================================================

const game = require("./game.js");
const roles = require("./roles.js");
const rooms = require("./rooms.js");

// ==================================================
// الإعدادات
// ==================================================

const NIGHT_REPLY_TYPE = "mafia-night";
const VOTE_REPLY_TYPE = "mafia-vote";

const ACTION_TIMEOUT = 60000;

// ==================================================
// أدوات مساعدة
// ==================================================

function wait(ms) {
    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );
}

// ==================================================
// إرسال رسالة بأمان
// ==================================================

function sendMessage(
    api,
    body,
    threadID,
    replyTo = null
) {

    return new Promise(resolve => {

        try {

            if (!api || !threadID) {
                return resolve(null);
            }

            const callback = (
                error,
                info
            ) => {

                if (error) {

                    console.error(
                        "[MAFIA ACTIONS] SEND ERROR:",
                        error
                    );

                    return resolve(null);
                }

                resolve(info || null);
            };

            if (replyTo) {

                api.sendMessage(
                    body,
                    threadID,
                    replyTo,
                    callback
                );

            } else {

                api.sendMessage(
                    body,
                    threadID,
                    callback
                );
            }

        } catch (error) {

            console.error(
                "[MAFIA ACTIONS] sendMessage:",
                error
            );

            resolve(null);
        }

    });
}

// ==================================================
// تسجيل HandleReply
// ==================================================

function registerReply({
    name,
    messageID,
    threadID,
    author = null,
    type,
    data = {}
}) {

    if (!messageID || !threadID) {
        return false;
    }

    if (!global.client) {
        global.client = {};
    }

    if (
        !Array.isArray(
            global.client.handleReply
        )
    ) {

        global.client.handleReply = [];
    }

    global.client.handleReply =
        global.client.handleReply.filter(
            item =>
                !(
                    String(item.messageID || "") ===
                    String(messageID)
                )
        );

    global.client.handleReply.push({

        name: String(name || "مافيا"),

        messageID:
            String(messageID),

        threadID:
            String(threadID),

        author:
            author
                ? String(author)
                : null,

        type,

        data

    });

    return true;
}

// ==================================================
// إزالة HandleReply بواسطة الرسالة
// ==================================================

function removeReply(messageID) {

    if (
        !global.client ||
        !Array.isArray(
            global.client.handleReply
        )
    ) {

        return;
    }

    global.client.handleReply =
        global.client.handleReply.filter(
            item =>
                String(
                    item.messageID || ""
                ) !==
                String(
                    messageID || ""
                )
        );
}

// ==================================================
// إزالة كل Replies الخاصة بلعبة معينة
// ==================================================

function removeGameReplies(threadID) {

    if (
        !global.client ||
        !Array.isArray(
            global.client.handleReply
        )
    ) {

        return;
    }

    threadID =
        String(threadID || "");

    global.client.handleReply =
        global.client.handleReply.filter(
            item =>
                String(
                    item.threadID || ""
                ) !== threadID
        );
}

// ==================================================
// الحصول على لاعب
// ==================================================

function getPlayer(
    gameData,
    userID
) {

    try {

        return game.getPlayer(
            gameData,
            String(userID)
        );

    } catch (error) {

        return null;
    }
}

// ==================================================
// التحقق من اللاعب الحي
// ==================================================

function isAlive(
    gameData,
    userID
) {

    const player =
        getPlayer(
            gameData,
            userID
        );

    return Boolean(
        player &&
        player.alive !== false
    );
}

// ==================================================
// إنشاء قائمة اللاعبين
// ==================================================

function buildPlayerList(
    gameData,
    options = {}
) {

    const {
        excludeMafia = false,
        excludeSelf = null
    } = options;

    const alive =
        roles.getAlivePlayers(
            gameData.players
        );

    return alive.filter(
        player => {

            if (
                excludeSelf !== null &&
                String(player.id) ===
                String(excludeSelf)
            ) {

                return false;
            }

            if (
                excludeMafia &&
                player.role === "mafia"
            ) {

                return false;
            }

            return true;
        }
    );
}

// ==================================================
// قائمة مرقمة
// ==================================================

function numberedPlayers(
    players
) {

    return players
        .map(
            (player, index) =>
                `${index + 1}. ${player.name || "لاعب"}`
        )
        .join("\n");
}

// ==================================================
// استخراج رقم الاختيار
// ==================================================

function parseChoice(body) {

    const text =
        String(body || "")
            .trim();

    const match =
        text.match(/^(\d+)$/);

    if (!match) {
        return null;
    }

    const number =
        Number(match[1]);

    if (
        !Number.isInteger(number) ||
        number < 1
    ) {

        return null;
    }

    return number;
}

// ==================================================
// البحث عن لاعب بالرقم
// ==================================================

function playerFromChoice(
    players,
    choice
) {

    if (!Array.isArray(players)) {
        return null;
    }

    if (
        choice < 1 ||
        choice > players.length
    ) {

        return null;
    }

    return players[
        choice - 1
    ] || null;
}

// ==================================================
// إخراج لاعب من غرفة دوره
// ==================================================

async function removePlayerFromRoleRoom(
    api,
    player
) {

    if (
        !player ||
        !player.id ||
        !player.role
    ) {

        return false;
    }

    const role =
        String(player.role);

    if (
        role !== "mafia" &&
        role !== "doctor" &&
        role !== "detective"
    ) {

        return false;
    }

    const roomID =
        rooms.ROOM_IDS[role];

    if (!roomID) {
        return false;
    }

    try {

        /*
         * rooms.removePlayer يعتمد على UID
         * والدور لتحديد الغرفة.
         */

        const result =
            await rooms.removePlayer(
                api,
                {
                    ...player,
                    id:
                        String(
                            player.id
                        ),
                    role
                }
            );

        return result !== false;

    } catch (error) {

        console.error(
            `[MAFIA] فشل إزالة ${player.id} من غرفة ${role}:`,
            error
        );

        /*
         * محاولة مباشرة كخطة احتياطية
         */

        try {

            if (
                typeof rooms.removePlayerFromRoleRoom ===
                "function"
            ) {

                await rooms.removePlayerFromRoleRoom(
                    api,
                    String(player.id),
                    role
                );

                return true;
            }

        } catch (fallbackError) {

            console.error(
                "[MAFIA] FALLBACK REMOVE ERROR:",
                fallbackError
            );
        }

        return false;
    }
}

// ==================================================
// تنظيف غرف الأدوار بالكامل
// ==================================================

async function cleanupAllRoleRooms(
    api,
    gameData
) {

    if (
        !gameData ||
        !Array.isArray(
            gameData.players
        )
    ) {

        return {
            success: false,
            removed: [],
            failed: []
        };
    }

    const removed = [];
    const failed = [];

    /*
     * نستخدم لاعبي اللعبة فقط
     * حتى لا يتم طرد أعضاء عاديين
     * موجودين في الغرف.
     */

    const rolePlayers =
        gameData.players.filter(
            player =>
                player &&
                (
                    player.role === "mafia" ||
                    player.role === "doctor" ||
                    player.role === "detective"
                )
        );

    for (
        const player
        of rolePlayers
    ) {

        const success =
            await removePlayerFromRoleRoom(
                api,
                player
            );

        if (success) {

            removed.push(
                String(player.id)
            );

        } else {

            failed.push(
                String(player.id)
            );
        }

        await wait(300);
    }

    /*
     * محاولة ثانية للاعبين الذين فشلت إزالتهم
     */

    if (failed.length > 0) {

        await wait(700);

        const retryFailed = [];

        for (
            const player
            of rolePlayers
        ) {

            if (
                !failed.includes(
                    String(player.id)
                )
            ) {

                continue;
            }

            const success =
                await removePlayerFromRoleRoom(
                    api,
                    player
                );

            if (success) {

                removed.push(
                    String(player.id)
                );

            } else {

                retryFailed.push(
                    String(player.id)
                );
            }

            await wait(300);
        }

        return {
            success:
                retryFailed.length === 0,
            removed,
            failed:
                retryFailed
        };
    }

    return {
        success: true,
        removed,
        failed
    };
}

// ==================================================
// التحقق من غرفة الدور
// ==================================================

async function verifyRoleRoom(
    api,
    player
) {

    if (
        !player ||
        !player.role
    ) {

        return false;
    }

    if (
        player.role !== "mafia" &&
        player.role !== "doctor" &&
        player.role !== "detective"
    ) {

        return false;
    }

    try {

        return await rooms.isUserInRoom(
            api,
            String(player.id),
            rooms.ROOM_IDS[player.role]
        );

    } catch (error) {

        return false;
    }
}

// ==================================================
// بدء فعل المافيا
// ==================================================

async function startMafiaAction({
    api,
    gameData
}) {

    try {

        if (!gameData) {
            return false;
        }

        if (
            gameData.phase !==
            game.PHASES.NIGHT
        ) {

            return false;
        }

        const mafia =
            roles.getMafia(
                gameData.players
            );

        const aliveMafia =
            mafia.filter(
                player =>
                    player.alive !== false
            );

        if (!aliveMafia.length) {

            return startDoctorAction({
                api,
                gameData
            });
        }

        gameData.currentAction =
            "mafia";

        gameData.nightData.mafiaTarget =
            null;

        game.saveGames();

        const targets =
            buildPlayerList(
                gameData,
                {
                    excludeMafia: true
                }
            );

        if (!targets.length) {

            return startDoctorAction({
                api,
                gameData
            });
        }

        const body =
`ليلة ${gameData.night}

دور المافيا

اختاروا اللاعب الذي تريدون استهدافه

${numberedPlayers(targets)}

أرسل رقم اللاعب فقط`;

        const sent =
            await sendMessage(
                api,
                body,
                rooms.ROOM_IDS.mafia
            );

        if (!sent) {

            console.error(
                "[MAFIA] فشل إرسال دور المافيا"
            );

            return false;
        }

        const messageID =
            String(
                sent.messageID ||
                ""
            );

        if (!messageID) {

            console.error(
                "[MAFIA] لم يتم الحصول على messageID"
            );

            return false;
        }

        registerReply({

            name: "مافيا",

            messageID,

            threadID:
                gameData.threadID,

            type:
                NIGHT_REPLY_TYPE,

            data: {

                action: "mafia",

                players: targets

            }

        });

        return true;

    } catch (error) {

        console.error(
            "[MAFIA] START MAFIA ERROR:",
            error
        );

        return false;
    }
}

// ==================================================
// بدء فعل الطبيب
// ==================================================

async function startDoctorAction({
    api,
    gameData
}) {

    try {

        if (!gameData) {
            return false;
        }

        const doctor =
            roles.getDoctor(
                gameData.players
            )[0];

        if (
            !doctor ||
            doctor.alive === false
        ) {

            gameData.nightData.doctorTarget =
                null;

            game.saveGames();

            return startDetectiveAction({
                api,
                gameData
            });
        }

        gameData.currentAction =
            "doctor";

        gameData.nightData.doctorTarget =
            null;

        game.saveGames();

        const targets =
            buildPlayerList(
                gameData
            );

        if (!targets.length) {

            return startDetectiveAction({
                api,
                gameData
            });
        }

        const body =
`ليلة ${gameData.night}

دور الطبيب

اختر اللاعب الذي تريد حمايته الليلة

${numberedPlayers(targets)}

أرسل رقم اللاعب فقط`;

        const sent =
            await sendMessage(
                api,
                body,
                rooms.ROOM_IDS.doctor
            );

        if (!sent) {

            console.error(
                "[MAFIA DOCTOR] فشل إرسال الدور"
            );

            return false;
        }

        const messageID =
            String(
                sent.messageID ||
                ""
            );

        if (!messageID) {
            return false;
        }

        registerReply({

            name: "مافيا",

            messageID,

            threadID:
                gameData.threadID,

            author:
                doctor.id,

            type:
                NIGHT_REPLY_TYPE,

            data: {

                action: "doctor",

                players: targets

            }

        });

        return true;

    } catch (error) {

        console.error(
            "[MAFIA DOCTOR] START ERROR:",
            error
        );

        return false;
    }
}

// ==================================================
// بدء فعل المحقق
// ==================================================

async function startDetectiveAction({
    api,
    gameData
}) {

    try {

        if (!gameData) {
            return false;
        }

        const detective =
            roles.getDetective(
                gameData.players
            )[0];

        if (
            !detective ||
            detective.alive === false
        ) {

            gameData.nightData.detectiveTarget =
                null;

            game.saveGames();

            return resolveNight({
                api,
                gameData
            });
        }

        gameData.currentAction =
            "detective";

        gameData.nightData.detectiveTarget =
            null;

        game.saveGames();

        const targets =
            buildPlayerList(
                gameData,
                {
                    excludeSelf:
                        detective.id
                }
            );

        if (!targets.length) {

            return resolveNight({
                api,
                gameData
            });
        }

        const body =
`ليلة ${gameData.night}

دور المحقق

اختر اللاعب الذي تريد التحقيق بشأنه

${numberedPlayers(targets)}

أرسل رقم اللاعب فقط`;

        const sent =
            await sendMessage(
                api,
                body,
                rooms.ROOM_IDS.detective
            );

        if (!sent) {

            console.error(
                "[MAFIA DETECTIVE] فشل إرسال الدور"
            );

            return false;
        }

        const messageID =
            String(
                sent.messageID ||
                ""
            );

        if (!messageID) {
            return false;
        }

        registerReply({

            name: "مافيا",

            messageID,

            threadID:
                gameData.threadID,

            author:
                detective.id,

            type:
                NIGHT_REPLY_TYPE,

            data: {

                action: "detective",

                players: targets

            }

        });

        return true;

    } catch (error) {

        console.error(
            "[MAFIA DETECTIVE] START ERROR:",
            error
        );

        return false;
    }
}

// ==================================================
// معالجة فعل المافيا
// ==================================================

async function handleMafiaAction({
    api,
    gameData,
    event,
    replyData,
    handleReply
}) {

    try {

        const senderID =
            String(
                event?.senderID ||
                ""
            );

        const player =
            getPlayer(
                gameData,
                senderID
            );

        if (
            !player ||
            player.role !== "mafia" ||
            player.alive === false
        ) {

            return;
        }

        /*
         * إذا كانت المافيا اختارت بالفعل
         * لا نقبل اختيارًا ثانيًا.
         */

        if (
            gameData.nightData.mafiaTarget
        ) {

            return;
        }

        const choice =
            parseChoice(
                event.body
            );

        if (choice === null) {

            return sendMessage(
                api,
                "أرسل رقم اللاعب فقط",
                event.threadID,
                event.messageID
            );
        }

        const targets =
            Array.isArray(
                replyData?.players
            )
                ? replyData.players
                : [];

        const target =
            playerFromChoice(
                targets,
                choice
            );

        if (!target) {

            return sendMessage(
                api,
                "هذا الرقم غير موجود في القائمة",
                event.threadID,
                event.messageID
            );
        }

        const targetPlayer =
            getPlayer(
                gameData,
                target.id
            );

        if (
            !targetPlayer ||
            targetPlayer.alive === false
        ) {

            return sendMessage(
                api,
                "هذا اللاعب لم يعد حيًا",
                event.threadID,
                event.messageID
            );
        }

        if (
            targetPlayer.role === "mafia"
        ) {

            return sendMessage(
                api,
                "لا يمكنك استهداف أحد أفراد المافيا",
                event.threadID,
                event.messageID
            );
        }

        /*
         * حفظ الهدف
         */

        game.setNightTarget(
            gameData,
            "mafia",
            String(targetPlayer.id)
        );

        /*
         * حذف الرد الحالي قبل الانتقال
         */

        if (handleReply?.messageID) {

            removeReply(
                handleReply.messageID
            );
        }

        gameData.currentAction =
            "doctor";

        game.saveGames();

        await sendMessage(
            api,
            "تم تسجيل اختيار المافيا",
            event.threadID
        );

        /*
         * الانتقال للطبيب
         */

        return startDoctorAction({
            api,
            gameData
        });

    } catch (error) {

        console.error(
            "[MAFIA] HANDLE MAFIA ERROR:",
            error
        );

        /*
         * لا نسمح للخطأ بأن يتحول إلى executeError
         * ونوقف اللعبة بالكامل.
         */

        return sendMessage(
            api,
            "حدث خطأ أثناء تسجيل اختيار المافيا",
            event.threadID
        );
    }
}

// ==================================================
// معالجة فعل الطبيب
// ==================================================

async function handleDoctorAction({
    api,
    gameData,
    event,
    replyData,
    handleReply
}) {

    try {

        const senderID =
            String(
                event?.senderID ||
                ""
            );

        const doctor =
            roles.getDoctor(
                gameData.players
            )[0];

        if (
            !doctor ||
            doctor.alive === false ||
            String(doctor.id) !== senderID
        ) {

            return;
        }

        if (
            gameData.nightData.doctorTarget
        ) {

            return;
        }

        const choice =
            parseChoice(
                event.body
            );

        if (choice === null) {

            return sendMessage(
                api,
                "أرسل رقم اللاعب فقط",
                event.threadID,
                event.messageID
            );
        }

        const targets =
            Array.isArray(
                replyData?.players
            )
                ? replyData.players
                : [];

        const target =
            playerFromChoice(
                targets,
                choice
            );

        if (!target) {

            return sendMessage(
                api,
                "هذا الرقم غير موجود في القائمة",
                event.threadID,
                event.messageID
            );
        }

        if (
            !isAlive(
                gameData,
                target.id
            )
        ) {

            return sendMessage(
                api,
                "هذا اللاعب لم يعد حيًا",
                event.threadID
            );
        }

        game.setNightTarget(
            gameData,
            "doctor",
            String(target.id)
        );

        if (handleReply?.messageID) {

            removeReply(
                handleReply.messageID
            );
        }

        gameData.currentAction =
            "detective";

        game.saveGames();

        await sendMessage(
            api,
            "تم تسجيل حماية الطبيب",
            event.threadID
        );

        return startDetectiveAction({
            api,
            gameData
        });

    } catch (error) {

        console.error(
            "[MAFIA] HANDLE DOCTOR ERROR:",
            error
        );

        return sendMessage(
            api,
            "حدث خطأ أثناء تسجيل اختيار الطبيب",
            event.threadID
        );
    }
}

// ==================================================
// معالجة فعل المحقق
// ==================================================

async function handleDetectiveAction({
    api,
    gameData,
    event,
    replyData,
    handleReply
}) {

    try {

        const senderID =
            String(
                event?.senderID ||
                ""
            );

        const detective =
            roles.getDetective(
                gameData.players
            )[0];

        if (
            !detective ||
            detective.alive === false ||
            String(detective.id) !== senderID
        ) {

            return;
        }

        if (
            gameData.nightData.detectiveTarget
        ) {

            return;
        }

        const choice =
            parseChoice(
                event.body
            );

        if (choice === null) {

            return sendMessage(
                api,
                "أرسل رقم اللاعب فقط",
                event.threadID,
                event.messageID
            );
        }

        const targets =
            Array.isArray(
                replyData?.players
            )
                ? replyData.players
                : [];

        const target =
            playerFromChoice(
                targets,
                choice
            );

        if (!target) {

            return sendMessage(
                api,
                "هذا الرقم غير موجود في القائمة",
                event.threadID,
                event.messageID
            );
        }

        game.setNightTarget(
            gameData,
            "detective",
            String(target.id)
        );

        if (handleReply?.messageID) {

            removeReply(
                handleReply.messageID
            );
        }

        gameData.currentAction =
            null;

        game.saveGames();

        const result =
            target.role === "mafia"
                ? "هذا اللاعب من المافيا"
                : "هذا اللاعب ليس من المافيا";

        await sendMessage(
            api,
            `نتيجة التحقيق:\n${result}`,
            event.threadID
        );

        return resolveNight({
            api,
            gameData
        });

    } catch (error) {

        console.error(
            "[MAFIA] HANDLE DETECTIVE ERROR:",
            error
        );

        return sendMessage(
            api,
            "حدث خطأ أثناء التحقيق",
            event.threadID
        );
    }
}

// ==================================================
// معالجة ردود الليل
// ==================================================

async function handleNightReply({
    api,
    gameData,
    event,
    handleReply
}) {

    try {

        if (!gameData || !event) {
            return;
        }

        if (
            gameData.phase !==
            game.PHASES.NIGHT
        ) {

            return;
        }

        const action =
            String(
                handleReply?.data?.action ||
                ""
            );

        if (!action) {
            return;
        }

        /*
         * حماية إضافية:
         * لا نعالج ردًا قديمًا بعد انتقال المرحلة.
         */

        if (
            action === "mafia" &&
            gameData.currentAction !==
            "mafia"
        ) {

            return;
        }

        if (
            action === "doctor" &&
            gameData.currentAction !==
            "doctor"
        ) {

            return;
        }

        if (
            action === "detective" &&
            gameData.currentAction !==
            "detective"
        ) {

            return;
        }

        if (action === "mafia") {

            return handleMafiaAction({
                api,
                gameData,
                event,
                replyData:
                    handleReply.data,
                handleReply
            });
        }

        if (action === "doctor") {

            return handleDoctorAction({
                api,
                gameData,
                event,
                replyData:
                    handleReply.data,
                handleReply
            });
        }

        if (action === "detective") {

            return handleDetectiveAction({
                api,
                gameData,
                event,
                replyData:
                    handleReply.data,
                handleReply
            });
        }

    } catch (error) {

        console.error(
            "[MAFIA] NIGHT REPLY ERROR:",
            error
        );
    }
}

// ==================================================
// حل نتيجة الليل
// ==================================================

async function resolveNight({
    api,
    gameData
}) {

    try {

        if (!gameData) {
            return false;
        }

        if (
            gameData.phase !==
            game.PHASES.NIGHT
        ) {

            return false;
        }

        if (
            gameData.nightData.resolved
        ) {

            return false;
        }

        gameData.nightData.resolved =
            true;

        gameData.currentAction =
            null;

        game.saveGames();

        const mafiaTarget =
            gameData.nightData.mafiaTarget;

        const doctorTarget =
            gameData.nightData.doctorTarget;

        let eliminatedPlayer = null;

        /*
         * إذا استهدفت المافيا لاعبًا
         * والطبيب لم يحمِه
         */

        if (
            mafiaTarget &&
            String(mafiaTarget) !==
            String(doctorTarget)
        ) {

            const result =
                game.eliminatePlayer(
                    gameData,
                    String(mafiaTarget),
                    "mafia"
                );

            if (result?.success) {

                eliminatedPlayer =
                    result.player;

                /*
                 * طرد اللاعب المقتول من غرفة دوره
                 */

                await removePlayerFromRoleRoom(
                    api,
                    eliminatedPlayer
                );
            }
        }

        const winner =
            game.checkWinner(
                gameData
            );

        if (winner?.ended) {

            game.endGame(
                gameData,
                winner.winner,
                winner.reason
            );

            return announceWinner({
                api,
                gameData
            });
        }

        game.startDay(
            gameData
        );

        let message =
`انتهت الليلة ${gameData.night}

`;

        if (eliminatedPlayer) {

            message +=
                `تم إخراج لاعب من اللعبة خلال الليل\n`;

        } else if (
            mafiaTarget &&
            String(mafiaTarget) ===
            String(doctorTarget)
        ) {

            message +=
                `الطبيب نجح في حماية الهدف\n`;

        } else {

            message +=
                `لم يخرج أحد خلال هذه الليلة\n`;
        }

        message +=
            `\nبدأ النهار`;

        await sendMessage(
            api,
            message,
            gameData.threadID
        );

        return startVoting({
            api,
            gameData
        });

    } catch (error) {

        console.error(
            "[MAFIA] RESOLVE NIGHT ERROR:",
            error
        );

        return false;
    }
}

// ==================================================
// بدء التصويت
// ==================================================

async function startVoting({
    api,
    gameData
}) {

    try {

        if (!gameData) {
            return false;
        }

        game.startVoting(
            gameData
        );

        const targets =
            roles.getAlivePlayers(
                gameData.players
            );

        if (!targets.length) {

            return false;
        }

        const body =
`التصويت

اختاروا اللاعب الذي تريدون إخراجه

${numberedPlayers(targets)}

كل لاعب حي يصوت مرة واحدة

أرسل رقم اللاعب فقط`;

        const sent =
            await sendMessage(
                api,
                body,
                gameData.threadID
            );

        if (!sent) {
            return false;
        }

        const messageID =
            String(
                sent.messageID ||
                ""
            );

        if (!messageID) {
            return false;
        }

        game.setVotingMessage(
            gameData,
            messageID
        );

        registerReply({

            name: "مافيا",

            messageID,

            threadID:
                gameData.threadID,

            type:
                VOTE_REPLY_TYPE,

            data: {

                action: "vote",

                players: targets

            }

        });

        return true;

    } catch (error) {

        console.error(
            "[MAFIA] START VOTING ERROR:",
            error
        );

        return false;
    }
}

// ==================================================
// معالجة التصويت
// ==================================================

async function handleVoteReply({
    api,
    gameData,
    event,
    handleReply
}) {

    try {

        if (!gameData) {
            return;
        }

        if (
            gameData.phase !==
            game.PHASES.VOTING
        ) {

            return;
        }

        const voterID =
            String(
                event.senderID || ""
            );

        const voter =
            getPlayer(
                gameData,
                voterID
            );

        if (
            !voter ||
            voter.alive === false
        ) {

            return sendMessage(
                api,
                "لا يمكنك التصويت لأنك خارج اللعبة",
                event.threadID
            );
        }

        const choice =
            parseChoice(
                event.body
            );

        if (choice === null) {

            return sendMessage(
                api,
                "أرسل رقم اللاعب فقط",
                event.threadID,
                event.messageID
            );
        }

        const targets =
            Array.isArray(
                handleReply?.data?.players
            )
                ? handleReply.data.players
                : [];

        const target =
            playerFromChoice(
                targets,
                choice
            );

        if (!target) {

            return sendMessage(
                api,
                "هذا الرقم غير موجود في القائمة",
                event.threadID
            );
        }

        if (
            !isAlive(
                gameData,
                target.id
            )
        ) {

            return sendMessage(
                api,
                "هذا اللاعب خرج من اللعبة",
                event.threadID
            );
        }

        const result =
            game.registerVote(
                gameData,
                voterID,
                target.id
            );

        if (!result.success) {

            const errors = {

                ALREADY_VOTED:
                    "لقد سجلت تصويتك بالفعل",

                VOTER_DEAD:
                    "لا يمكنك التصويت لأنك خارج اللعبة",

                TARGET_DEAD:
                    "هذا اللاعب خرج من اللعبة",

                VOTING_NOT_ACTIVE:
                    "التصويت انتهى"

            };

            return sendMessage(
                api,
                errors[result.reason] ||
                    "تعذر تسجيل التصويت",
                event.threadID
            );
        }

        await sendMessage(
            api,
            "تم تسجيل تصويتك",
            event.threadID
        );

        if (
            game.isVotingComplete(
                gameData
            )
        ) {

            removeReply(
                handleReply.messageID
            );

            return resolveVoting({
                api,
                gameData
            });
        }

    } catch (error) {

        console.error(
            "[MAFIA] VOTE ERROR:",
            error
        );
    }
}

// ==================================================
// حل التصويت
// ==================================================

async function resolveVoting({
    api,
    gameData
}) {

    try {

        if (!gameData) {
            return false;
        }

        const result =
            game.getVotingResult(
                gameData
            );

        let eliminatedPlayer = null;

        if (
            result.eliminatedID
        ) {

            const eliminated =
                game.eliminatePlayer(
                    gameData,
                    String(
                        result.eliminatedID
                    ),
                    "vote"
                );

            if (eliminated?.success) {

                eliminatedPlayer =
                    eliminated.player;

                /*
                 * إزالة اللاعب من غرفة دوره
                 */

                await removePlayerFromRoleRoom(
                    api,
                    eliminatedPlayer
                );
            }
        }

        gameData.voting.active =
            false;

        game.saveGames();

        let message;

        if (result.tied) {

            message =
`انتهى التصويت

حدث تعادل في الأصوات

لم يخرج أحد هذه الجولة`;

        } else if (eliminatedPlayer) {

            message =
`انتهى التصويت

تم إخراج لاعب من اللعبة`;

        } else {

            message =
`انتهى التصويت

لم يتم إخراج أي لاعب`;
        }

        await sendMessage(
            api,
            message,
            gameData.threadID
        );

        const winner =
            game.checkWinner(
                gameData
            );

        if (winner?.ended) {

            game.endGame(
                gameData,
                winner.winner,
                winner.reason
            );

            return announceWinner({
                api,
                gameData
            });
        }

        await wait(1500);

        return startNextNight({
            api,
            gameData
        });

    } catch (error) {

        console.error(
            "[MAFIA] RESOLVE VOTE ERROR:",
            error
        );

        return false;
    }
}

// ==================================================
// بدء ليلة جديدة
// ==================================================

async function startNextNight({
    api,
    gameData
}) {

    try {

        if (!gameData) {
            return false;
        }

        gameData.round =
            Number(
                gameData.round || 0
            ) + 1;

        gameData.night =
            Number(
                gameData.night || 0
            ) + 1;

        game.resetNightData(
            gameData
        );

        game.setPhase(
            gameData,
            game.PHASES.NIGHT
        );

        gameData.currentAction =
            "mafia";

        game.saveGames();

        await sendMessage(
            api,
            `بدأت الليلة ${gameData.night}`,
            gameData.threadID
        );

        await wait(1000);

        return startMafiaAction({
            api,
            gameData
        });

    } catch (error) {

        console.error(
            "[MAFIA] NEXT NIGHT ERROR:",
            error
        );

        return false;
    }
}

// ==================================================
// إعلان الفائز وتنظيف كل الغرف
// ==================================================

async function announceWinner({
    api,
    gameData
}) {

    try {

        if (!gameData) {
            return false;
        }

        let winnerText;

        if (
            gameData.winner ===
            "mafia"
        ) {

            winnerText =
                "فازت المافيا";

        } else if (
            gameData.winner ===
            "citizens"
        ) {

            winnerText =
                "فاز المواطنون";

        } else {

            winnerText =
                "انتهت اللعبة";
        }

        /*
         * أولًا نوقف جميع الردود القديمة
         */

        removeGameReplies(
            gameData.threadID
        );

        /*
         * إعلان النهاية
         */

        const body =
`انتهت لعبة المافيا

${winnerText}

${gameData.winnerReason || ""}`;

        await sendMessage(
            api,
            body,
            gameData.threadID
        );

        /*
         * تنظيف جميع غرف الأدوار
         *
         * المافيا
         * الطبيب
         * المحقق
         */

        const cleanup =
            await cleanupAllRoleRooms(
                api,
                gameData
            );

        console.log(
            "[MAFIA] ROLE ROOMS CLEANUP:",
            cleanup
        );

        /*
         * محاولة أخيرة بعد قليل
         * للاعبين الذين لم تتم إزالتهم
         */

        if (
            cleanup.failed &&
            cleanup.failed.length > 0
        ) {

            await wait(1500);

            await cleanupAllRoleRooms(
                api,
                gameData
            );
        }

        game.saveGames();

        return true;

    } catch (error) {

        console.error(
            "[MAFIA] ANNOUNCE WINNER ERROR:",
            error
        );

        /*
         * حتى لو فشل الإعلان
         * نحاول تنظيف الغرف
         */

        try {

            await cleanupAllRoleRooms(
                api,
                gameData
            );

        } catch (cleanupError) {

            console.error(
                "[MAFIA] FINAL CLEANUP ERROR:",
                cleanupError
            );
        }

        return false;
    }
}

// ==================================================
// بدء اللعبة بعد نجاح تجهيز الغرف
// ==================================================

async function startGameAfterPreparation({
    api,
    gameData
}) {

    try {

        if (!gameData) {
            return {
                success: false
            };
        }

        if (
            gameData.phase !==
            game.PHASES.STARTING
        ) {

            return {
                success: false,
                reason:
                    "INVALID_PHASE"
            };
        }

        /*
         * تجهيز الغرف
         *
         * إذا فشل لاعب واحد
         * لا تبدأ اللعبة.
         */

        const preparation =
            await rooms.prepareRoleRooms(
                api,
                gameData.players
            );

        if (
            !preparation ||
            !preparation.success
        ) {

            console.error(
                "[MAFIA] ROLE ROOM PREPARATION FAILED:",
                preparation
            );

            return {
                success: false,
                reason:
                    "ROLE_ROOMS_FAILED",
                preparation
            };
        }

        /*
         * هنا فقط تصبح اللعبة Started
         */

        const started =
            game.confirmGameStarted(
                gameData
            );

        if (!started) {

            return {
                success: false,
                reason:
                    "GAME_START_FAILED"
            };
        }

        await sendMessage(
            api,
            `بدأت لعبة المافيا

تم توزيع الأدوار وتجهيز الغرف بنجاح

الليلة الأولى تبدأ الآن`,
            gameData.threadID
        );

        await wait(1000);

        /*
         * بداية الليل
         */

        const mafiaStarted =
            await startMafiaAction({
                api,
                gameData
            });

        if (!mafiaStarted) {

            console.error(
                "[MAFIA] فشل بدء دور المافيا"
            );

            return {
                success: false,
                reason:
                    "MAFIA_ACTION_FAILED"
            };
        }

        return {
            success: true
        };

    } catch (error) {

        console.error(
            "[MAFIA] START GAME ERROR:",
            error
        );

        return {
            success: false,
            reason:
                "START_GAME_ERROR",
            error
        };
    }
}

// ==================================================
// HandleReply الرئيسي
// ==================================================

async function handleReply({
    api,
    event,
    handleReply
}) {

    try {

        if (
            !event ||
            !handleReply
        ) {

            return;
        }

        const threadID =
            String(
                event.threadID ||
                ""
            );

        if (!threadID) {
            return;
        }

        const gameData =
            game.getGame(
                threadID
            );

        if (!gameData) {
            return;
        }

        /*
         * التأكد أن الرد يخص نفس المجموعة
         */

        if (
            String(
                handleReply.threadID ||
                ""
            ) !== threadID
        ) {

            return;
        }

        /*
         * ==================================================
         * الليل
         * ==================================================
         */

        if (
            handleReply.type ===
            NIGHT_REPLY_TYPE
        ) {

            return handleNightReply({
                api,
                gameData,
                event,
                handleReply
            });
        }

        /*
         * ==================================================
         * التصويت
         * ==================================================
         */

        if (
            handleReply.type ===
            VOTE_REPLY_TYPE
        ) {

            return handleVoteReply({
                api,
                gameData,
                event,
                handleReply
            });
        }

    } catch (error) {

        console.error(
            "[MAFIA] HANDLE REPLY ERROR:",
            error
        );

        /*
         * مهم:
         * لا نرمي الخطأ مرة أخرى
         * حتى لا يظهر executeError للمستخدم.
         */

        return;
    }
}

// ==================================================
// التصدير
// ==================================================

module.exports = {

    // أفعال الليل

    startMafiaAction,

    startDoctorAction,

    startDetectiveAction,

    handleMafiaAction,

    handleDoctorAction,

    handleDetectiveAction,

    handleNightReply,

    resolveNight,

    // التصويت

    startVoting,

    handleVoteReply,

    resolveVoting,

    // الانتقال

    startNextNight,

    // البداية والنهاية

    startGameAfterPreparation,

    announceWinner,

    // HandleReply

    handleReply,

    // أدوات

    registerReply,

    removeReply,

    removeGameReplies,

    buildPlayerList,

    numberedPlayers,

    // تنظيف الغرف

    removePlayerFromRoleRoom,

    cleanupAllRoleRooms

};