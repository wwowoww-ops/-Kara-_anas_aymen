/**
 * rooms.js
 * إدارة جروبات أدوار لعبة المافيا
 *
 * المافيا     : 1087576633812881
 * المحقق      : 2081907905748525
 * الطبيب      : 2990722987961601
 */

const ROOM_IDS = {
    mafia: "1087576633812881",
    detective: "2081907905748525",
    doctor: "2990722987961601"
};

// عدد محاولات الإضافة
const MAX_ADD_ATTEMPTS = 10;

// الفاصل بين المحاولات
const RETRY_DELAY = 500;

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * استدعاء API سواء كان callback أو Promise
 */
function apiCall(api, method, ...args) {
    return new Promise((resolve, reject) => {
        if (!api || typeof api[method] !== "function") {
            return reject(new Error(`API method غير موجود: ${method}`));
        }

        let finished = false;

        const done = (error, result) => {
            if (finished) return;
            finished = true;

            if (error) {
                return reject(error);
            }

            resolve(result);
        };

        try {
            const result = api[method](...args, done);

            if (result && typeof result.then === "function") {
                result
                    .then(data => done(null, data))
                    .catch(error => done(error));
            }
        } catch (error) {
            done(error);
        }
    });
}

/**
 * الحصول على معلومات المجموعة
 */
async function getThreadInfo(api, threadID) {
    return await apiCall(api, "getThreadInfo", threadID);
}

/**
 * التحقق هل اللاعب موجود داخل الغرفة
 */
async function isUserInRoom(api, userID, roomID) {
    try {
        const info = await getThreadInfo(api, roomID);

        if (!info) return false;

        const participants = Array.isArray(info.participantIDs)
            ? info.participantIDs
            : [];

        return participants.some(
            id => String(id) === String(userID)
        );
    } catch (error) {
        return false;
    }
}

/**
 * محاولة إضافة لاعب إلى غرفة
 */
async function addUserOnce(api, userID, roomID) {
    if (await isUserInRoom(api, userID, roomID)) {
        return true;
    }

    try {
        await apiCall(
            api,
            "addUserToGroup",
            String(userID),
            String(roomID)
        );

        // نتأكد فعلياً أن الإضافة نجحت
        await wait(250);

        return await isUserInRoom(
            api,
            userID,
            roomID
        );
    } catch (error) {
        return false;
    }
}

/**
 * إضافة اللاعب مع إعادة المحاولة بسرعة
 */
async function addUserWithRetry(api, userID, roomID) {
    userID = String(userID);
    roomID = String(roomID);

    for (let attempt = 1; attempt <= MAX_ADD_ATTEMPTS; attempt++) {

        const success = await addUserOnce(
            api,
            userID,
            roomID
        );

        if (success) {
            return {
                success: true,
                userID,
                roomID,
                attempts: attempt
            };
        }

        if (attempt < MAX_ADD_ATTEMPTS) {
            await wait(RETRY_DELAY);
        }
    }

    return {
        success: false,
        userID,
        roomID,
        attempts: MAX_ADD_ATTEMPTS
    };
}

/**
 * إضافة لاعب حسب دوره
 */
async function addPlayerToRoleRoom(api, userID, role) {

    const roomID = ROOM_IDS[role];

    if (!roomID) {
        return {
            success: false,
            userID: String(userID),
            role,
            reason: "لا توجد غرفة لهذا الدور"
        };
    }

    const result = await addUserWithRetry(
        api,
        userID,
        roomID
    );

    return {
        ...result,
        role
    };
}

/**
 * تجهيز جميع أصحاب الأدوار الخاصة
 *
 * هذه الدالة لا تعتبر التجهيز ناجحاً
 * إلا إذا نجحت كل الإضافات.
 */
async function prepareRoleRooms(api, players) {

    const results = [];

    for (const player of players) {

        if (!player || !player.id) continue;

        const role = String(player.role || "");

        // المواطنون لا يحتاجون غرفة خاصة
        if (
            role !== "mafia" &&
            role !== "doctor" &&
            role !== "detective"
        ) {
            continue;
        }

        const result = await addPlayerToRoleRoom(
            api,
            player.id,
            role
        );

        results.push({
            ...result,
            name: player.name || "لاعب"
        });

        // لا نوقف بقية المحاولات
        // حتى نعرف جميع اللاعبين الذين فشلت إضافتهم
    }

    const failed = results.filter(
        result => !result.success
    );

    return {
        success: failed.length === 0,
        results,
        failed
    };
}

/**
 * طرد لاعب من غرفة دوره
 */
async function removePlayerFromRoleRoom(api, userID, role) {

    const roomID = ROOM_IDS[role];

    if (!roomID) return false;

    try {
        const exists = await isUserInRoom(
            api,
            userID,
            roomID
        );

        if (!exists) return true;

        await apiCall(
            api,
            "removeUserFromGroup",
            String(userID),
            String(roomID)
        );

        return true;

    } catch (error) {
        console.error(
            "[MAFIA ROOMS] فشل طرد اللاعب:",
            userID,
            role,
            error
        );

        return false;
    }
}

/**
 * طرد لاعب من غرفته بناءً على دوره
 */
async function removePlayer(api, player) {

    if (!player || !player.id || !player.role) {
        return false;
    }

    return await removePlayerFromRoleRoom(
        api,
        player.id,
        player.role
    );
}

/**
 * تنظيف جميع غرف اللعبة
 *
 * مخصص للاستخدام عند انتهاء اللعبة.
 */
async function cleanupRoleRooms(api, players) {

    const results = [];

    for (const player of players) {

        if (!player || !player.id) continue;

        if (
            player.role !== "mafia" &&
            player.role !== "doctor" &&
            player.role !== "detective"
        ) {
            continue;
        }

        const success = await removePlayer(
            api,
            player
        );

        results.push({
            userID: String(player.id),
            role: player.role,
            success
        });
    }

    return results;
}

module.exports = {
    ROOM_IDS,

    MAX_ADD_ATTEMPTS,
    RETRY_DELAY,

    isUserInRoom,
    addUserOnce,
    addUserWithRetry,

    addPlayerToRoleRoom,
    prepareRoleRooms,

    removePlayerFromRoleRoom,
    removePlayer,

    cleanupRoleRooms
};

مهم: هذا الملف وحده لا يبدأ اللعبة.
هو فقط يضمن أن تجهيز الغرف يرجع:

success: true

إذا نجحت كل الإضافات المطلوبة.

وفي الملف الرئيسي سنجعل الشرط:

if (!roomPreparation.success) {
    // لا تبدأ اللعبة
    // لا ترسل رسالة بدأ اللعبة
    return;
}

// هنا فقط
// إرسال رسالة بدأ اللعبة
// ثم بدء أول ليلة