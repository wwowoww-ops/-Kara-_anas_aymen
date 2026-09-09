/**
 * roles.js
 * نظام توزيع أدوار لعبة المافيا
 *
 * الأدوار الحالية:
 * mafia      = المافيا
 * doctor     = الطبيب
 * detective  = المحقق
 * citizen    = مواطن
 */

// عدد المافيا حسب عدد اللاعبين
function getMafiaCount(playerCount) {
    if (playerCount >= 40) return 8;
    if (playerCount >= 30) return 6;
    if (playerCount >= 20) return 4;
    if (playerCount >= 15) return 3;
    if (playerCount >= 10) return 2;

    // الحد الأدنى للعبة 8 لاعبين
    return 2;
}

/**
 * خلط مصفوفة اللاعبين
 */
function shuffle(array) {
    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {
        const random = Math.floor(Math.random() * (i + 1));

        [result[i], result[random]] = [
            result[random],
            result[i]
        ];
    }

    return result;
}

/**
 * توزيع الأدوار
 */
function assignRoles(players) {

    if (!Array.isArray(players)) {
        throw new Error("قائمة اللاعبين غير صحيحة");
    }

    if (players.length < 8) {
        throw new Error("يجب أن يكون هناك 8 لاعبين على الأقل");
    }

    const shuffled = shuffle(players);

    const mafiaCount = getMafiaCount(shuffled.length);

    const roles = [];

    // المافيا
    for (let i = 0; i < mafiaCount; i++) {
        roles.push("mafia");
    }

    // طبيب واحد
    roles.push("doctor");

    // محقق واحد
    roles.push("detective");

    // الباقي مواطنون
    while (roles.length < shuffled.length) {
        roles.push("citizen");
    }

    // خلط الأدوار مرة أخرى
    const shuffledRoles = shuffle(roles);

    return shuffled.map((player, index) => ({
        ...player,
        role: shuffledRoles[index],
        alive: true,
        eliminated: false
    }));
}

/**
 * الحصول على اللاعبين حسب دور معين
 */
function getPlayersByRole(players, role) {
    if (!Array.isArray(players)) return [];

    return players.filter(
        player =>
            player &&
            player.role === role &&
            player.alive !== false
    );
}

/**
 * الحصول على المافيا
 */
function getMafia(players) {
    return getPlayersByRole(players, "mafia");
}

/**
 * الحصول على الطبيب
 */
function getDoctor(players) {
    return getPlayersByRole(players, "doctor");
}

/**
 * الحصول على المحقق
 */
function getDetective(players) {
    return getPlayersByRole(players, "detective");
}

/**
 * الحصول على المواطنين
 */
function getCitizens(players) {
    return getPlayersByRole(players, "citizen");
}

/**
 * الحصول على اللاعبين الأحياء
 */
function getAlivePlayers(players) {
    if (!Array.isArray(players)) return [];

    return players.filter(
        player =>
            player &&
            player.alive !== false
    );
}

/**
 * الحصول على عدد اللاعبين الأحياء
 */
function getAliveCount(players) {
    return getAlivePlayers(players).length;
}

/**
 * التحقق من وجود دور معين
 */
function hasRole(players, role) {
    return getPlayersByRole(players, role).length > 0;
}

/**
 * تحويل اسم الدور للعربي
 */
function roleName(role) {
    const names = {
        mafia: "المافيا",
        doctor: "الطبيب",
        detective: "المحقق",
        citizen: "المواطن"
    };

    return names[role] || "مجهول";
}

module.exports = {
    getMafiaCount,
    shuffle,
    assignRoles,

    getPlayersByRole,
    getMafia,
    getDoctor,
    getDetective,
    getCitizens,

    getAlivePlayers,
    getAliveCount,

    hasRole,
    roleName
};