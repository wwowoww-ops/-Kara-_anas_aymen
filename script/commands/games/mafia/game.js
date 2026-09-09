/**
 * game.js
 * المحرك الأساسي للعبة المافيا
 *
 * مسؤول عن:
 * - إنشاء الألعاب
 * - تسجيل اللاعبين
 * - حفظ حالة اللعبة
 * - تحميل الحالة بعد إعادة التشغيل
 * - إدارة مراحل اللعبة
 * - إدارة حالة اللاعبين
 * - إنهاء اللعبة
 *
 * لا يقوم هذا الملف بـ:
 * - توزيع الأدوار
 * - إضافة اللاعبين للجروبات
 * - تنفيذ تصرفات المافيا والطبيب والمحقق
 * - التصويت
 *
 * هذه الوظائف موجودة في الملفات الأخرى.
 */

const fs = require("fs-extra");
const path = require("path");

const {
    assignRoles,
    getAlivePlayers,
    getMafia,
    getDoctor,
    getDetective,
    getCitizens
} = require("./roles.js");

// ==================================================
// الإعدادات
// ==================================================

const DATA_DIR = path.join(
    process.cwd(),
    "data"
);

const DATA_FILE = path.join(
    DATA_DIR,
    "mafia.json"
);

const MIN_PLAYERS = 8;
const MAX_PLAYERS = 50;

// ==================================================
// حالات اللعبة
// ==================================================

const PHASES = {
    REGISTRATION: "registration",
    STARTING: "starting",
    DAY: "day",
    NIGHT: "night",
    VOTING: "voting",
    ENDED: "ended"
};

// ==================================================
// إنشاء مجلد البيانات
// ==================================================

function ensureDataDirectory() {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.ensureDirSync(DATA_DIR);
        }
    } catch (error) {
        console.error(
            "[MAFIA GAME] فشل إنشاء مجلد البيانات:",
            error
        );
    }
}

// ==================================================
// قراءة البيانات
// ==================================================

function readData() {

    ensureDataDirectory();

    try {

        if (!fs.existsSync(DATA_FILE)) {
            fs.writeJsonSync(
                DATA_FILE,
                {},
                {
                    spaces: 4
                }
            );

            return {};
        }

        const data = fs.readJsonSync(
            DATA_FILE
        );

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
            "[MAFIA GAME] فشل قراءة البيانات:",
            error
        );

        return {};
    }
}

// ==================================================
// حفظ البيانات
// ==================================================

function writeData(data) {

    ensureDataDirectory();

    try {

        fs.writeJsonSync(
            DATA_FILE,
            data,
            {
                spaces: 4
            }
        );

        return true;

    } catch (error) {

        console.error(
            "[MAFIA GAME] فشل حفظ البيانات:",
            error
        );

        return false;
    }
}

// ==================================================
// تحميل جميع الألعاب
// ==================================================

const games = new Map();

function loadGames() {

    const data = readData();

    games.clear();

    for (
        const [threadID, game] of Object.entries(data)
    ) {

        if (
            !game ||
            typeof game !== "object"
        ) {
            continue;
        }

        game.threadID = String(
            game.threadID || threadID
        );

        game.players =
            Array.isArray(game.players)
                ? game.players
                : [];

        game.createdAt =
            Number(game.createdAt) ||
            Date.now();

        game.updatedAt =
            Number(game.updatedAt) ||
            Date.now();

        games.set(
            String(threadID),
            game
        );
    }

    return games;
}

// تحميل البيانات عند تشغيل الملف
loadGames();

// ==================================================
// حفظ الألعاب
// ==================================================

function saveGames() {

    const data = {};

    for (
        const [threadID, game] of games.entries()
    ) {

        data[String(threadID)] = game;
    }

    return writeData(data);
}

// ==================================================
// تحديث اللعبة
// ==================================================

function touchGame(game) {

    if (!game) return;

    game.updatedAt = Date.now();
}

// ==================================================
// إنشاء كائن لاعب
// ==================================================

function createPlayer({
    userID,
    name = "لاعب"
}) {

    return {
        id: String(userID),
        name: String(name || "لاعب"),

        role: null,

        alive: true,

        eliminated: false,

        eliminatedBy: null,

        eliminatedAt: null,

        joinedAt: Date.now()
    };
}

// ==================================================
// إنشاء لعبة جديدة
// ==================================================

function createGame(threadID) {

    threadID = String(threadID);

    if (!threadID) {
        throw new Error(
            "threadID غير صالح"
        );
    }

    if (games.has(threadID)) {
        return games.get(threadID);
    }

    const game = {

        threadID,

        phase:
            PHASES.REGISTRATION,

        players: [],

        round: 0,

        night: 0,

        day: 0,

        currentAction: null,

        registrationMessageID: null,

        votingMessageID: null,

        createdAt: Date.now(),

        updatedAt: Date.now(),

        startedAt: null,

        endedAt: null,

        winner: null,

        winnerReason: null,

        nightData: {

            mafiaTarget: null,

            doctorTarget: null,

            detectiveTarget: null,

            resolved: false
        },

        voting: {

            active: false,

            votes: {},

            messageID: null
        }
    };

    games.set(
        threadID,
        game
    );

    saveGames();

    return game;
}

// ==================================================
// الحصول على لعبة
// ==================================================

function getGame(threadID) {

    return games.get(
        String(threadID)
    ) || null;
}

// ==================================================
// التحقق من وجود لعبة
// ==================================================

function hasGame(threadID) {

    return games.has(
        String(threadID)
    );
}

// ==================================================
// حذف لعبة
// ==================================================

function deleteGame(threadID) {

    threadID = String(threadID);

    const deleted =
        games.delete(threadID);

    saveGames();

    return deleted;
}

// ==================================================
// عدد اللاعبين
// ==================================================

function getPlayerCount(game) {

    if (
        !game ||
        !Array.isArray(game.players)
    ) {
        return 0;
    }

    return game.players.length;
}

// ==================================================
// الحصول على لاعب
// ==================================================

function getPlayer(game, userID) {

    if (
        !game ||
        !Array.isArray(game.players)
    ) {
        return null;
    }

    userID = String(userID);

    return game.players.find(
        player =>
            String(player.id) === userID
    ) || null;
}

// ==================================================
// التحقق من تسجيل اللاعب
// ==================================================

function hasPlayer(game, userID) {

    return Boolean(
        getPlayer(
            game,
            userID
        )
    );
}

// ==================================================
// إضافة لاعب
// ==================================================

function addPlayer(
    game,
    userID,
    name = "لاعب"
) {

    if (!game) {
        return {
            success: false,
            reason: "GAME_NOT_FOUND"
        };
    }

    userID = String(userID);

    if (!userID) {
        return {
            success: false,
            reason: "INVALID_USER"
        };
    }

    if (
        game.phase !==
        PHASES.REGISTRATION
    ) {
        return {
            success: false,
            reason: "REGISTRATION_CLOSED"
        };
    }

    if (
        hasPlayer(
            game,
            userID
        )
    ) {
        return {
            success: false,
            reason: "ALREADY_JOINED"
        };
    }

    if (
        getPlayerCount(game) >=
        MAX_PLAYERS
    ) {
        return {
            success: false,
            reason: "GAME_FULL"
        };
    }

    const player = createPlayer({
        userID,
        name
    });

    game.players.push(
        player
    );

    touchGame(game);

    saveGames();

    return {
        success: true,
        player
    };
}

// ==================================================
// إزالة لاعب من التسجيل
// ==================================================

function removePlayer(
    game,
    userID
) {

    if (!game) {
        return {
            success: false,
            reason: "GAME_NOT_FOUND"
        };
    }

    userID = String(userID);

    if (
        game.phase !==
        PHASES.REGISTRATION
    ) {
        return {
            success: false,
            reason: "REGISTRATION_CLOSED"
        };
    }

    const index =
        game.players.findIndex(
            player =>
                String(player.id) ===
                userID
        );

    if (index === -1) {
        return {
            success: false,
            reason: "PLAYER_NOT_FOUND"
        };
    }

    const [player] =
        game.players.splice(
            index,
            1
        );

    touchGame(game);

    saveGames();

    return {
        success: true,
        player
    };
}

// ==================================================
// تثبيت الأدوار
// ==================================================

function assignGameRoles(game) {

    if (!game) {
        throw new Error(
            "GAME_NOT_FOUND"
        );
    }

    if (
        !Array.isArray(game.players)
    ) {
        throw new Error(
            "قائمة اللاعبين غير صحيحة"
        );
    }

    if (
        game.players.length <
        MIN_PLAYERS
    ) {
        throw new Error(
            `يجب أن يكون هناك ${MIN_PLAYERS} لاعبين على الأقل`
        );
    }

    const playersWithRoles =
        assignRoles(
            game.players
        );

    game.players =
        playersWithRoles;

    touchGame(game);

    saveGames();

    return game.players;
}

// ==================================================
// بدء مرحلة تجهيز اللعبة
// ==================================================

function prepareGame(game) {

    if (!game) {
        return false;
    }

    if (
        game.phase !==
        PHASES.REGISTRATION
    ) {
        return false;
    }

    if (
        getPlayerCount(game) <
        MIN_PLAYERS
    ) {
        return false;
    }

    game.phase =
        PHASES.STARTING;

    game.round = 0;

    game.night = 0;

    game.day = 0;

    game.startedAt = null;

    game.winner = null;

    game.winnerReason = null;

    game.currentAction = null;

    game.nightData = {

        mafiaTarget: null,

        doctorTarget: null,

        detectiveTarget: null,

        resolved: false
    };

    game.voting = {

        active: false,

        votes: {},

        messageID: null
    };

    touchGame(game);

    saveGames();

    return true;
}

// ==================================================
// تأكيد نجاح التجهيز
// ==================================================

function confirmGameStarted(game) {

    if (!game) {
        return false;
    }

    if (
        game.phase !==
        PHASES.STARTING
    ) {
        return false;
    }

    // لا يتم استدعاء هذه الدالة إلا بعد:
    // 1. توزيع الأدوار
    // 2. نجاح إضافة جميع أصحاب الأدوار الخاصة
    //
    // لذلك هذه الدالة هي نقطة البداية الفعلية.

    game.phase =
        PHASES.NIGHT;

    game.startedAt = Date.now();

    game.round = 1;

    game.night = 1;

    game.currentAction = "mafia";

    game.nightData = {

        mafiaTarget: null,

        doctorTarget: null,

        detectiveTarget: null,

        resolved: false
    };

    touchGame(game);

    saveGames();

    return true;
}

// ==================================================
// الانتقال إلى النهار
// ==================================================

function startDay(game) {

    if (!game) return false;

    game.phase =
        PHASES.DAY;

    game.day++;

    game.currentAction = null;

    touchGame(game);

    saveGames();

    return true;
}

// ==================================================
// بدء التصويت
// ==================================================

function startVoting(game) {

    if (!game) return false;

    if (
        game.phase !==
        PHASES.DAY
    ) {
        return false;
    }

    game.phase =
        PHASES.VOTING;

    game.voting = {

        active: true,

        votes: {},

        messageID: null
    };

    game.currentAction = "voting";

    touchGame(game);

    saveGames();

    return true;
}

// ==================================================
// تسجيل تصويت
// ==================================================

function registerVote(
    game,
    voterID,
    targetID
) {

    if (!game) {
        return {
            success: false,
            reason: "GAME_NOT_FOUND"
        };
    }

    if (
        game.phase !==
        PHASES.VOTING
    ) {
        return {
            success: false,
            reason: "VOTING_NOT_ACTIVE"
        };
    }

    voterID = String(voterID);
    targetID = String(targetID);

    const voter =
        getPlayer(
            game,
            voterID
        );

    const target =
        getPlayer(
            game,
            targetID
        );

    if (!voter) {
        return {
            success: false,
            reason: "VOTER_NOT_FOUND"
        };
    }

    if (!voter.alive) {
        return {
            success: false,
            reason: "VOTER_DEAD"
        };
    }

    if (!target) {
        return {
            success: false,
            reason: "TARGET_NOT_FOUND"
        };
    }

    if (!target.alive) {
        return {
            success: false,
            reason: "TARGET_DEAD"
        };
    }

    if (
        game.voting.votes[voterID]
    ) {
        return {
            success: false,
            reason: "ALREADY_VOTED"
        };
    }

    game.voting.votes[voterID] =
        targetID;

    touchGame(game);

    saveGames();

    return {
        success: true,
        voter,
        target
    };
}

// ==================================================
// عدد الأصوات
// ==================================================

function getVoteCount(game) {

    if (
        !game ||
        !game.voting ||
        !game.voting.votes
    ) {
        return 0;
    }

    return Object.keys(
        game.voting.votes
    ).length;
}

// ==================================================
// عدد المصوتين المطلوب
// ==================================================

function getRequiredVotes(game) {

    return getAlivePlayers(
        game.players
    ).length;
}

// ==================================================
// هل اكتمل التصويت؟
// ==================================================

function isVotingComplete(game) {

    if (!game) return false;

    return (
        getVoteCount(game) >=
        getRequiredVotes(game)
    );
}

// ==================================================
// تحديد نتيجة التصويت
// ==================================================

function getVotingResult(game) {

    if (!game) {
        return {
            eliminatedID: null,
            tied: false,
            counts: {}
        };
    }

    const counts = {};

    const votes =
        game.voting?.votes || {};

    for (
        const targetID of Object.values(votes)
    ) {

        const id =
            String(targetID);

        counts[id] =
            (counts[id] || 0) + 1;
    }

    let highest = 0;

    let winners = [];

    for (
        const [userID, count]
        of Object.entries(counts)
    ) {

        if (count > highest) {

            highest = count;

            winners = [
                userID
            ];

        } else if (
            count === highest
        ) {

            winners.push(
                userID
            );
        }
    }

    // تعادل = لا أحد يخرج
    if (
        winners.length !== 1
    ) {

        return {
            eliminatedID: null,
            tied: true,
            highest,
            counts
        };
    }

    return {
        eliminatedID:
            winners[0],

        tied: false,

        highest,

        counts
    };
}

// ==================================================
// إقصاء لاعب
// ==================================================

function eliminatePlayer(
    game,
    userID,
    reason = "vote"
) {

    if (!game) {
        return {
            success: false,
            reason: "GAME_NOT_FOUND"
        };
    }

    userID = String(userID);

    const player =
        getPlayer(
            game,
            userID
        );

    if (!player) {
        return {
            success: false,
            reason: "PLAYER_NOT_FOUND"
        };
    }

    if (!player.alive) {
        return {
            success: false,
            reason: "ALREADY_DEAD"
        };
    }

    player.alive = false;

    player.eliminated = true;

    player.eliminatedBy =
        String(reason);

    player.eliminatedAt =
        Date.now();

    touchGame(game);

    saveGames();

    return {
        success: true,
        player
    };
}

// ==================================================
// الحصول على حالة اللاعبين
// ==================================================

function getAlive(game) {

    if (!game) return [];

    return getAlivePlayers(
        game.players
    );
}

// ==================================================
// التحقق من نهاية اللعبة
// ==================================================

function checkWinner(game) {

    if (!game) {
        return {
            ended: false,
            winner: null,
            reason: null
        };
    }

    const alive =
        getAlivePlayers(
            game.players
        );

    const mafia =
        getMafia(
            game.players
        );

    const aliveMafia =
        mafia.filter(
            player =>
                player.alive !== false
        );

    const aliveNonMafia =
        alive.filter(
            player =>
                player.role !== "mafia"
        );

    // لا توجد مافيا
    if (
        aliveMafia.length === 0
    ) {

        return {
            ended: true,
            winner: "citizens",
            reason:
                "تم القضاء على جميع أفراد المافيا"
        };
    }

    // المافيا أصبحت مساوية أو أكثر
    // من بقية اللاعبين الأحياء
    if (
        aliveMafia.length >=
        aliveNonMafia.length
    ) {

        return {
            ended: true,
            winner: "mafia",
            reason:
                "أصبحت المافيا مسيطرة على اللعبة"
        };
    }

    return {
        ended: false,
        winner: null,
        reason: null
    };
}

// ==================================================
// إنهاء اللعبة
// ==================================================

function endGame(
    game,
    winner = null,
    reason = null
) {

    if (!game) {
        return false;
    }

    game.phase =
        PHASES.ENDED;

    game.currentAction = null;

    game.endedAt = Date.now();

    game.winner =
        winner;

    game.winnerReason =
        reason;

    if (game.voting) {
        game.voting.active = false;
    }

    touchGame(game);

    saveGames();

    return true;
}

// ==================================================
// إعادة اللعبة إلى التسجيل
// ==================================================

function resetGame(game) {

    if (!game) return false;

    game.phase =
        PHASES.REGISTRATION;

    game.players = [];

    game.round = 0;

    game.night = 0;

    game.day = 0;

    game.currentAction = null;

    game.registrationMessageID = null;

    game.votingMessageID = null;

    game.startedAt = null;

    game.endedAt = null;

    game.winner = null;

    game.winnerReason = null;

    game.nightData = {

        mafiaTarget: null,

        doctorTarget: null,

        detectiveTarget: null,

        resolved: false
    };

    game.voting = {

        active: false,

        votes: {},

        messageID: null
    };

    touchGame(game);

    saveGames();

    return true;
}

// ==================================================
// إحصائيات اللعبة
// ==================================================

function getStats(game) {

    if (!game) return null;

    const players =
        Array.isArray(game.players)
            ? game.players
            : [];

    const alive =
        getAlivePlayers(
            players
        );

    const mafia =
        getMafia(
            players
        );

    const doctor =
        getDoctor(
            players
        );

    const detective =
        getDetective(
            players
        );

    const citizens =
        getCitizens(
            players
        );

    return {

        total:
            players.length,

        alive:
            alive.length,

        eliminated:
            players.filter(
                player =>
                    player.alive === false
            ).length,

        mafia:
            mafia.length,

        aliveMafia:
            mafia.filter(
                player =>
                    player.alive !== false
            ).length,

        doctor:
            doctor.length,

        detective:
            detective.length,

        citizens:
            citizens.length,

        phase:
            game.phase,

        round:
            game.round,

        day:
            game.day,

        night:
            game.night
    };
}

// ==================================================
// تغيير المرحلة
// ==================================================

function setPhase(
    game,
    phase
) {

    if (!game) return false;

    const validPhases =
        Object.values(
            PHASES
        );

    if (
        !validPhases.includes(
            phase
        )
    ) {
        return false;
    }

    game.phase = phase;

    touchGame(game);

    saveGames();

    return true;
}

// ==================================================
// تعيين رسالة التسجيل
// ==================================================

function setRegistrationMessage(
    game,
    messageID
) {

    if (!game) return false;

    game.registrationMessageID =
        String(messageID || "");

    touchGame(game);

    saveGames();

    return true;
}

// ==================================================
// تعيين رسالة التصويت
// ==================================================

function setVotingMessage(
    game,
    messageID
) {

    if (!game) return false;

    game.votingMessageID =
        String(messageID || "");

    if (!game.voting) {
        game.voting = {
            active: true,
            votes: {},
            messageID: null
        };
    }

    game.voting.messageID =
        String(messageID || "");

    touchGame(game);

    saveGames();

    return true;
}

// ==================================================
// تنظيف بيانات الليل
// ==================================================

function resetNightData(game) {

    if (!game) return false;

    game.nightData = {

        mafiaTarget: null,

        doctorTarget: null,

        detectiveTarget: null,

        resolved: false
    };

    touchGame(game);

    saveGames();

    return true;
}

// ==================================================
// تعيين هدف الليل
// ==================================================

function setNightTarget(
    game,
    action,
    userID
) {

    if (!game) return false;

    userID =
        userID === null ||
        userID === undefined
            ? null
            : String(userID);

    if (
        action === "mafia"
    ) {

        game.nightData.mafiaTarget =
            userID;

    } else if (
        action === "doctor"
    ) {

        game.nightData.doctorTarget =
            userID;

    } else if (
        action === "detective"
    ) {

        game.nightData.detectiveTarget =
            userID;

    } else {

        return false;
    }

    touchGame(game);

    saveGames();

    return true;
}

// ==================================================
// تصدير الوظائف
// ==================================================

module.exports = {

    // البيانات
    games,
    PHASES,

    MIN_PLAYERS,
    MAX_PLAYERS,

    DATA_DIR,
    DATA_FILE,

    // إدارة الألعاب
    loadGames,
    saveGames,
    createGame,
    getGame,
    hasGame,
    deleteGame,

    // اللاعبين
    createPlayer,
    getPlayer,
    hasPlayer,
    getPlayerCount,

    addPlayer,
    removePlayer,

    // البداية
    assignGameRoles,
    prepareGame,
    confirmGameStarted,

    // المراحل
    startDay,
    startVoting,
    setPhase,

    // التصويت
    registerVote,
    getVoteCount,
    getRequiredVotes,
    isVotingComplete,
    getVotingResult,

    // اللاعبين الأحياء
    getAlive,

    // الإقصاء
    eliminatePlayer,

    // الفوز والنهاية
    checkWinner,
    endGame,
    resetGame,

    // الإحصائيات
    getStats,

    // الرسائل
    setRegistrationMessage,
    setVotingMessage,

    // الليل
    resetNightData,
    setNightTarget
};