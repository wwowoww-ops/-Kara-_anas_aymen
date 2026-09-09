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
                "[MAFIA ACTIONS] sendMessage:",
                error
            );

            resolve();
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
    author,
    type,
    data = {}
}) {

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
                    String(item.messageID) ===
                    String(messageID)
                )
        );

    global.client.handleReply.push({

        name,

        messageID,

        threadID:
            String(threadID),

        author:
            author
                ? String(author)
                : null,

        type,

        data
    });
}

// ==================================================
// إزالة HandleReply
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
                String(item.messageID) !==
                String(messageID)
        );
}

// ==================================================
// الحصول على لاعب
// ==================================================

function getPlayer(gameData, userID) {

    return game.getPlayer(
        gameData,
        String(userID)
    );
}

// ==================================================
// التحقق من اللاعب الحي
// ==================================================

function isAlive(gameData, userID) {

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

    return alive.filter(player => {

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
    });
}

// ==================================================
// قائمة مرقمة
// ==================================================

function numberedPlayers(players) {

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
// البحث عن لاعب بواسطة الرقم
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
// هل المستخدم موجود في غرفة الدور؟
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
            player.id,
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

    if (!gameData) return false;

    const mafia =
        roles.getMafia(
            gameData.players
        );

    if (!mafia.length) {
        return resolveNight({
            api,
            gameData
        });
    }

    const aliveMafia =
        mafia.filter(
            player =>
                player.alive !== false
        );

    if (!aliveMafia.length) {
        return resolveNight({
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
        return resolveNight({
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

    const roomID =
        rooms.ROOM_IDS.mafia;

    const sent =
        await new Promise(resolve => {

            try {

                api.sendMessage(
                    body,
                    roomID,
                    (error, info) => {

                        if (error) {
                            console.error(
                                "[MAFIA] فشل إرسال اختيار المافيا:",
                                error
                            );

                            return resolve(null);
                        }

                        resolve(info);
                    }
                );

            } catch (error) {

                console.error(
                    "[MAFIA] خطأ:",
                    error
                );

                resolve(null);
            }
        });

    if (!sent) {
        return false;
    }

    const messageID =
        String(
            sent.messageID ||
            sent
        );

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
}

// ==================================================
// بدء فعل الطبيب
// ==================================================

async function startDoctorAction({
    api,
    gameData
}) {

    if (!gameData) return false;

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

    const body =
`دور الطبيب

اختر اللاعب الذي تريد حمايته الليلة

${numberedPlayers(targets)}

أرسل رقم اللاعب فقط`;

    const roomID =
        rooms.ROOM_IDS.doctor;

    const sent =
        await new Promise(resolve => {

            try {

                api.sendMessage(
                    body,
                    roomID,
                    (error, info) => {

                        if (error) {
                            console.error(
                                "[MAFIA DOCTOR] فشل إرسال الرسالة:",
                                error
                            );

                            return resolve(null);
                        }

                        resolve(info);
                    }
                );

            } catch (error) {

                resolve(null);
            }
        });

    if (!sent) {
        return false;
    }

    const messageID =
        String(
            sent.messageID ||
            sent
        );

    registerReply({

        name: "مافيا",

        messageID,

        threadID:
            gameData.threadID,

        type:
            NIGHT_REPLY_TYPE,

        data: {
            action: "doctor",
            players: targets
        }
    });

    return true;
}

// ==================================================
// بدء فعل المحقق
// ==================================================

async function startDetectiveAction({
    api,
    gameData
}) {

    if (!gameData) return false;

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

        gameData.nightData.resolved =
            false;

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
`دور المحقق

اختر اللاعب الذي تريد التحقيق بشأنه

${numberedPlayers(targets)}

أرسل رقم اللاعب فقط`;

    const roomID =
        rooms.ROOM_IDS.detective;

    const sent =
        await new Promise(resolve => {

            try {

                api.sendMessage(
                    body,
                    roomID,
                    (error, info) => {

                        if (error) {
                            console.error(
                                "[MAFIA DETECTIVE] فشل إرسال الرسالة:",
                                error
                            );

                            return resolve(null);
                        }

                        resolve(info);
                    }
                );

            } catch (error) {

                resolve(null);
            }
        });

    if (!sent) {
        return false;
    }

    const messageID =
        String(
            sent.messageID ||
            sent
        );

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

    const senderID =
        String(
            event.senderID || ""
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
        target.role === "mafia"
    ) {
        return sendMessage(
            api,
            "لا يمكنك استهداف أحد أفراد المافيا",
            event.threadID,
            event.messageID
        );
    }

    game.setNightTarget(
        gameData,
        "mafia",
        target.id
    );

    removeReply(
        handleReply.messageID
    );

    gameData.currentAction =
        "doctor";

    game.saveGames();

    await sendMessage(
        api,
        `تم تسجيل اختيار المافيا`,
        event.threadID
    );

    await startDoctorAction({
        api,
        gameData
    });
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

    const senderID =
        String(
            event.senderID || ""
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
        "doctor",
        target.id
    );

    removeReply(
        handleReply.messageID
    );

    gameData.currentAction =
        "detective";

    game.saveGames();

    await sendMessage(
        api,
        "تم تسجيل حماية الطبيب",
        event.threadID
    );

    await startDetectiveAction({
        api,
        gameData
    });
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

    const senderID =
        String(
            event.senderID || ""
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
        target.id
    );

    removeReply(
        handleReply.messageID
    );

    gameData.currentAction =
        null;

    gameData.nightData.resolved =
        false;

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

    await resolveNight({
        api,
        gameData
    });
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

    if (!gameData) return;

    if (
        gameData.phase !==
        game.PHASES.NIGHT
    ) {
        return;
    }

    const action =
        handleReply?.data?.action;

    if (!action) return;

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
}

// ==================================================
// حل نتيجة الليل
// ==================================================

async function resolveNight({
    api,
    gameData
}) {

    if (!gameData) return false;

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

    if (
        mafiaTarget &&
        String(mafiaTarget) !==
        String(doctorTarget)
    ) {

        const result =
            game.eliminatePlayer(
                gameData,
                mafiaTarget,
                "mafia"
            );

        if (result.success) {

            eliminatedPlayer =
                result.player;

            try {

                await rooms.removePlayer(
                    api,
                    eliminatedPlayer
                );

            } catch (error) {

                console.error(
                    "[MAFIA] فشل إخراج اللاعب من غرفة دوره:",
                    error
                );
            }
        }
    }

    const winner =
        game.checkWinner(
            gameData
        );

    if (winner.ended) {

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
}

// ==================================================
// بدء التصويت
// ==================================================

async function startVoting({
    api,
    gameData
}) {

    if (!gameData) return false;

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
        await new Promise(resolve => {

            try {

                api.sendMessage(
                    body,
                    gameData.threadID,
                    (error, info) => {

                        if (error) {
                            console.error(
                                "[MAFIA VOTE] فشل إرسال التصويت:",
                                error
                            );

                            return resolve(null);
                        }

                        resolve(info);
                    }
                );

            } catch (error) {

                resolve(null);
            }
        });

    if (!sent) {
        return false;
    }

    const messageID =
        String(
            sent.messageID ||
            sent
        );

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

    if (!gameData) return;

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
}

// ==================================================
// حل التصويت
// ==================================================

async function resolveVoting({
    api,
    gameData
}) {

    if (!gameData) return false;

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
                result.eliminatedID,
                "vote"
            );

        if (eliminated.success) {

            eliminatedPlayer =
                eliminated.player;

            try {

                await rooms.removePlayer(
                    api,
                    eliminatedPlayer
                );

            } catch (error) {}
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

    if (winner.ended) {

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
}

// ==================================================
// بدء ليلة جديدة
// ==================================================

async function startNextNight({
    api,
    gameData
}) {

    if (!gameData) return false;

    gameData.round++;

    gameData.night++;

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

    return startMafiaAction({
        api,
        gameData
    });
}

// ==================================================
// إعلان الفائز
// ==================================================

async function announceWinner({
    api,
    gameData
}) {

    if (!gameData) return false;

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

    const body =
`انتهت لعبة المافيا

${winnerText}

${gameData.winnerReason || ""}`;

    await sendMessage(
        api,
        body,
        gameData.threadID
    );

    // تنظيف غرف الأدوار
    try {

        await rooms.cleanupRoleRooms(
            api,
            gameData.players
        );

    } catch (error) {

        console.error(
            "[MAFIA] فشل تنظيف غرف الأدوار:",
            error
        );
    }

    game.saveGames();

    return true;
}

// ==================================================
// بدء اللعبة بعد نجاح التجهيز
// ==================================================

async function startGameAfterPreparation({
    api,
    gameData
}) {

    if (!gameData) return false;

    /*
     * لا تبدأ اللعبة إلا إذا:
     *
     * 1. تم توزيع الأدوار
     * 2. تم تجهيز جميع الغرف بنجاح
     */

    if (
        gameData.phase !==
        game.PHASES.STARTING
    ) {
        return false;
    }

    const preparation =
        await rooms.prepareRoleRooms(
            api,
            gameData.players
        );

    if (
        !preparation.success
    ) {

        console.error(
            "[MAFIA] فشل تجهيز غرف اللاعبين"
        );

        return {
            success: false,
            preparation
        };
    }

    // جميع الغرف جاهزة
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

    // الإعلان لا يرسل إلا هنا
    await sendMessage(
        api,
        `بدأت لعبة المافيا

تم توزيع الأدوار وتجهيز الغرف بنجاح

الليلة الأولى تبدأ الآن`,
        gameData.threadID
    );

    await wait(1000);

    await startMafiaAction({
        api,
        gameData
    });

    return {
        success: true
    };
}

// ==================================================
// HandleReply الرئيسي
// ==================================================

async function handleReply({
    api,
    event,
    handleReply
}) {

    if (!event || !handleReply) {
        return;
    }

    const threadID =
        String(
            event.threadID || ""
        );

    const gameData =
        game.getGame(
            threadID
        );

    if (!gameData) {
        return;
    }

    if (
        String(
            handleReply.threadID
        ) !== threadID
    ) {
        return;
    }

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
}

// ==================================================
// تصدير
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

    // التصويت
    startVoting,
    handleVoteReply,
    resolveVoting,

    // الليل والنهار
    resolveNight,
    startNextNight,

    // البداية والنهاية
    startGameAfterPreparation,
    announceWinner,

    // HandleReply
    handleReply,

    // أدوات
    registerReply,
    removeReply,
    buildPlayerList,
    numberedPlayers
};