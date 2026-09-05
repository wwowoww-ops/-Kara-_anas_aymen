const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const autoReactions =
    require("./autoReactions");

module.exports = function ({
    api,
    models,
    Users,
    Threads,
    Currencies
}) {

    const logger =
        require("../../utils/log.js");

    // ==================================================
    // 🛡️ Controller الحماية
    // ==================================================

    const Protection =
        require("../controllers/protection")({
            models
        });

    // ==================================================
    // 🤖 ID البوت واستثناء البوت من جميع الحمايات
    // ==================================================

    let botIDCache = null;

    function getBotID() {

        try {

            if (botIDCache) {
                return botIDCache;
            }

            if (
                api &&
                typeof api.getCurrentUserID === "function"
            ) {

                const result =
                    api.getCurrentUserID();

                if (
                    result &&
                    typeof result !== "object"
                ) {

                    botIDCache =
                        String(result);

                    return botIDCache;

                }

            }

        } catch (error) {

            console.error(
                "[PROTECTION] فشل الحصول على ID البوت:",
                error.message || error
            );

        }

        return "";

    }

    function isBotUser(userID) {

        const botID =
            getBotID();

        if (
            !botID ||
            !userID
        ) {

            return false;

        }

        return (
            String(userID) ===
            botID
        );

    }

    function isBotEvent(event) {

        if (!event) {
            return false;
        }

        const botID =
            getBotID();

        if (!botID) {
            return false;
        }

        const data =
            event.logMessageData ||
            {};

        const possibleIDs = [

            event.senderID,
            event.authorID,
            event.authorId,
            event.actorID,
            event.actorId,

            data.author_id,
            data.authorID,
            data.authorId,

            data.actor_id,
            data.actorID,
            data.actorId

        ];

        return possibleIDs.some(
            id =>
                id !== undefined &&
                id !== null &&
                String(id) === botID
        );

    }

    // ==================================================
    // 🤖 تغييرات البوت المسموح بها
    // ==================================================

    const botChanges =
        new Map();

    const BOT_CHANGE_TIMEOUT =
        15000;

    function makeBotChangeKey(
        type,
        threadID,
        userID = ""
    ) {

        return (
            `${type}:${String(threadID)}:${String(userID)}`
        );

    }

    function markBotChange(
        type,
        threadID,
        userID = ""
    ) {

        if (!type || !threadID) {
            return;
        }

        const key =
            makeBotChangeKey(
                type,
                threadID,
                userID
            );

        botChanges.set(
            key,
            Date.now()
        );

        setTimeout(
            () => {

                const time =
                    botChanges.get(
                        key
                    );

                if (
                    time &&
                    Date.now() - time >=
                    BOT_CHANGE_TIMEOUT
                ) {

                    botChanges.delete(
                        key
                    );

                }

            },
            BOT_CHANGE_TIMEOUT + 1000
        );

    }

    function isBotChange(
        type,
        threadID,
        userID = ""
    ) {

        if (!type || !threadID) {
            return false;
        }

        const key =
            makeBotChangeKey(
                type,
                threadID,
                userID
            );

        const time =
            botChanges.get(
                key
            );

        if (!time) {
            return false;
        }

        if (
            Date.now() - time >
            BOT_CHANGE_TIMEOUT
        ) {

            botChanges.delete(
                key
            );

            return false;

        }

        botChanges.delete(
            key
        );

        return true;

    }

    global.HINA_MARK_BOT_CHANGE =
        markBotChange;

    // ==================================================
    // 📊 إعدادات نشاط الأعضاء
    // ==================================================

    const ACTIVITY_DIR =
        path.join(
            process.cwd(),
            "data",
            "groupActivity"
        );

    const MAX_ACTIVITY_MEMBERS = 5000;

    try {

        if (
            !fs.existsSync(
                ACTIVITY_DIR
            )
        ) {

            fs.mkdirSync(
                ACTIVITY_DIR,
                {
                    recursive: true
                }
            );

        }

    } catch (error) {

        console.error(
            "[ACTIVITY] فشل إنشاء مجلد النشاط:",
            error.message
        );

    }

    // ==================================================
    // 📁 مجلد صور الحماية المؤقتة
    // ==================================================

    const PROTECTION_IMAGE_DIR =
        path.join(
            process.cwd(),
            "data",
            "protectionImages"
        );

    try {

        if (
            !fs.existsSync(
                PROTECTION_IMAGE_DIR
            )
        ) {

            fs.mkdirSync(
                PROTECTION_IMAGE_DIR,
                {
                    recursive: true
                }
            );

        }

    } catch (error) {

        console.error(
            "[PROTECTION IMAGE] فشل إنشاء المجلد:",
            error.message
        );

    }

    // ==================================================
    // 🔒 منع الحماية من الدخول في Loop
    // ==================================================

    const protectionLocks =
        new Map();

    function isProtectionLocked(
        threadID,
        type
    ) {

        const key =
            `${String(threadID)}:${type}`;

        return protectionLocks.has(
            key
        );

    }

    function lockProtection(
        threadID,
        type,
        duration = 5000
    ) {

        const key =
            `${String(threadID)}:${type}`;

        protectionLocks.set(
            key,
            Date.now()
        );

        setTimeout(
            () => {

                protectionLocks.delete(
                    key
                );

            },
            duration
        );

    }

    // ==================================================
    // 📁 الحصول على ملف نشاط المجموعة
    // ==================================================

    function getActivityFile(
        threadID
    ) {

        return path.join(
            ACTIVITY_DIR,
            `${String(threadID)}.json`
        );

    }

    // ==================================================
    // 📖 قراءة نشاط المجموعة
    // ==================================================

    function loadActivity(
        threadID
    ) {

        const file =
            getActivityFile(
                threadID
            );

        try {

            if (
                !fs.existsSync(file)
            ) {

                return {};

            }

            const content =
                fs.readFileSync(
                    file,
                    "utf8"
                );

            if (
                !content.trim()
            ) {

                return {};

            }

            const data =
                JSON.parse(
                    content
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
                `[ACTIVITY] فشل قراءة ${threadID}:`,
                error.message
            );

            return {};

        }

    }

    // ==================================================
    // 💾 حفظ نشاط المجموعة
    // ==================================================

    function saveActivity(
        threadID,
        activity
    ) {

        try {

            const file =
                getActivityFile(
                    threadID
                );

            fs.writeFileSync(
                file,
                JSON.stringify(
                    activity,
                    null,
                    2
                ),
                "utf8"
            );

        } catch (error) {

            console.error(
                `[ACTIVITY] فشل حفظ ${threadID}:`,
                error.message
            );

        }

    }

    // ==================================================
    // 📈 تسجيل نشاط العضو
    // ==================================================

    function registerActivity(
        threadID,
        senderID
    ) {

        if (
            !threadID ||
            !senderID
        ) {

            return;

        }

        if (
            String(threadID) ===
            String(senderID)
        ) {

            return;

        }

        if (
            isBotUser(senderID)
        ) {

            return;

        }

        try {

            const activity =
                loadActivity(
                    threadID
                );

            const uid =
                String(senderID);

            if (
                !activity[uid]
            ) {

                activity[uid] = {

                    messages: 0,

                    lastMessage: 0

                };

            }

            activity[uid].messages =
                Number(
                    activity[uid].messages ||
                    0
                ) + 1;

            activity[uid].lastMessage =
                Date.now();

            const users =
                Object.keys(
                    activity
                );

            if (
                users.length >
                MAX_ACTIVITY_MEMBERS
            ) {

                users.sort(
                    (a, b) => {

                        const countA =
                            Number(
                                activity[a]?.messages ||
                                0
                            );

                        const countB =
                            Number(
                                activity[b]?.messages ||
                                0
                            );

                        return countB - countA;

                    }
                );

                const keep =
                    users.slice(
                        0,
                        MAX_ACTIVITY_MEMBERS
                    );

                const cleaned = {};

                for (
                    const uid of keep
                ) {

                    cleaned[uid] =
                        activity[uid];

                }

                saveActivity(
                    threadID,
                    cleaned
                );

                return;

            }

            saveActivity(
                threadID,
                activity
            );

        } catch (error) {

            console.error(
                "[ACTIVITY ERROR]",
                error
            );

        }

    }

    // ==================================================
    // 🛡️ Promise لـ API
    // ==================================================

    function apiCall(
        method,
        ...args
    ) {

        return new Promise(
            resolve => {

                try {

                    if (
                        !api ||
                        typeof api[method] !==
                        "function"
                    ) {

                        return resolve({
                            error: new Error(
                                `API method غير موجود: ${method}`
                            ),
                            result: null
                        });

                    }

                    let finished =
                        false;

                    const callback =
                        function (
                            error,
                            result
                        ) {

                            if (finished) return;

                            finished = true;

                            resolve({
                                error,
                                result
                            });

                        };

                    const result =
                        api[method](
                            ...args,
                            callback
                        );

                    if (
                        result &&
                        typeof result.then ===
                        "function"
                    ) {

                        result
                            .then(
                                value => {

                                    if (finished) return;

                                    finished = true;

                                    resolve({
                                        error: null,
                                        result: value
                                    });

                                }
                            )
                            .catch(
                                error => {

                                    if (finished) return;

                                    finished = true;

                                    resolve({
                                        error,
                                        result: null
                                    });

                                }
                            );

                    }

                } catch (error) {

                    resolve({
                        error,
                        result: null
                    });

                }

            }
        );

    }

    // ==================================================
    // 📖 الحصول على معلومات المجموعة
    // ==================================================

    function getThreadInfo(
        threadID
    ) {

        return new Promise(
            resolve => {

                try {

                    api.getThreadInfo(
                        String(threadID),
                        (
                            error,
                            info
                        ) => {

                            if (error) {

                                return resolve(
                                    null
                                );

                            }

                            resolve(
                                info ||
                                null
                            );

                        }
                    );

                } catch (error) {

                    console.error(
                        "[PROTECTION] getThreadInfo:",
                        error.message ||
                        error
                    );

                    resolve(
                        null
                    );

                }

            }
        );

    }

    // ==================================================
    // 🖼️ تحميل صورة مؤقتة
    // ==================================================

    function downloadFile(
        url,
        destination
    ) {

        return new Promise(
            (resolve, reject) => {

                try {

                    if (
                        !url ||
                        typeof url !==
                        "string"
                    ) {

                        return reject(
                            new Error(
                                "رابط الصورة غير صالح"
                            )
                        );

                    }

                    const protocol =
                        url.startsWith(
                            "https://"
                        )
                            ? https
                            : http;

                    const request =
                        protocol.get(
                            url,
                            {
                                headers: {
                                    "User-Agent":
                                        "Mozilla/5.0"
                                }
                            },
                            response => {

                                if (
                                    response.statusCode >= 300 &&
                                    response.statusCode < 400 &&
                                    response.headers.location
                                ) {

                                    response.resume();

                                    return downloadFile(
                                        response.headers.location,
                                        destination
                                    )
                                        .then(resolve)
                                        .catch(reject);

                                }

                                if (
                                    response.statusCode !==
                                    200
                                ) {

                                    response.resume();

                                    return reject(
                                        new Error(
                                            `HTTP ${response.statusCode}`
                                        )
                                    );

                                }

                                const file =
                                    fs.createWriteStream(
                                        destination
                                    );

                                response.pipe(
                                    file
                                );

                                file.on(
                                    "finish",
                                    () => {

                                        file.close(
                                            () => resolve(
                                                destination
                                            )
                                        );

                                    }
                                );

                                file.on(
                                    "error",
                                    error => {

                                        try {
                                            file.close();
                                        } catch (e) {}

                                        reject(
                                            error
                                        );

                                    }
                                );

                            }
                        );

                    request.on(
                        "error",
                        reject
                    );

                    request.setTimeout(
                        30000,
                        () => {

                            request.destroy(
                                new Error(
                                    "انتهى وقت تحميل الصورة"
                                )
                            );

                        }
                    );

                } catch (error) {

                    reject(
                        error
                    );

                }

            }
        );

    }

    // ==================================================
    // 🛡️ حماية اسم المجموعة
    // ==================================================

    async function protectGroupName(
        event,
        protection
    ) {

        if (
            isBotEvent(event)
        ) {

            return;

        }

        if (
            !protection.enabled.groupName
        ) {

            return;

        }

        const eventType =
            String(
                event.logMessageType ||
                event.eventType ||
                ""
            );

        if (
            eventType !==
                "log:thread-name" &&
            eventType !==
                "change_thread_name"
        ) {

            return;

        }

        const savedName =
            protection.saved.name;

        if (
            savedName === null ||
            savedName === undefined
        ) {

            return;

        }

        const threadID =
            String(event.threadID);

        if (
            isBotChange(
                "groupName",
                threadID
            )
        ) {

            return;

        }

        const data =
            event.logMessageData ||
            {};

        const newName =
            data.name ||
            data.threadName ||
            data.thread_name ||
            event.threadName ||
            event.newName ||
            event.name ||
            event.logMessageBody ||
            "";

        if (
            String(newName) ===
            String(savedName)
        ) {

            return;

        }

        if (
            isProtectionLocked(
                threadID,
                "groupName"
            )
        ) {

            return;

        }

        lockProtection(
            threadID,
            "groupName"
        );

        const result =
            await apiCall(
                "setTitle",
                String(savedName),
                threadID
            );

        if (
            result.error
        ) {

            console.error(
                "[PROTECTION NAME ERROR]",
                result.error.message ||
                result.error
            );

            return;

        }

        console.log(
            `[PROTECTION] تم استرجاع اسم المجموعة ${threadID}`
        );

    }

    // ==================================================
    // 🛡️ حماية السمة
    // ==================================================

    async function protectTheme(
        event,
        protection
    ) {

        if (
            isBotEvent(event)
        ) {

            return;

        }

        if (
            !protection.enabled.theme
        ) {

            return;

        }

        const eventType =
            String(
                event.logMessageType ||
                event.eventType ||
                event.type ||
                ""
            );

        const isThemeEvent =
            eventType ===
                "log:thread-color" ||
            eventType ===
                "change_thread_color" ||
            eventType ===
                "change_thread_theme" ||
            eventType ===
                "thread_color" ||
            eventType ===
                "thread_theme";

        if (
            !isThemeEvent
        ) {

            return;

        }

        const savedTheme =
            protection.saved.theme;

        if (
            savedTheme === null ||
            savedTheme === undefined ||
            String(savedTheme).trim() === ""
        ) {

            return;

        }

        const threadID =
            String(event.threadID);

        if (
            isBotChange(
                "theme",
                threadID
            )
        ) {

            return;

        }

        if (
            isProtectionLocked(
                threadID,
                "theme"
            )
        ) {

            return;

        }

        lockProtection(
            threadID,
            "theme"
        );

        const result =
            await apiCall(
                "changeThreadColor",
                String(savedTheme),
                threadID
            );

        if (
            result.error
        ) {

            console.error(
                "[PROTECTION THEME ERROR]",
                result.error.message ||
                result.error
            );

            return;

        }

        console.log(
            `[PROTECTION] تم استرجاع سمة المجموعة ${threadID}`
        );

    }

    // ==================================================
    // 🛡️ حماية الإيموجي
    // ==================================================

    async function protectEmoji(
        event,
        protection
    ) {

        if (
            isBotEvent(event)
        ) {

            return;

        }

        if (
            !protection.enabled.emoji
        ) {

            return;

        }

        const eventType =
            String(
                event.logMessageType ||
                event.eventType ||
                event.type ||
                ""
            );

        const isEmojiEvent =
            eventType ===
                "log:thread-icon" ||
            eventType ===
                "change_thread_icon" ||
            eventType ===
                "change_thread_emoji" ||
            eventType ===
                "thread_icon" ||
            eventType ===
                "thread_emoji";

        if (
            !isEmojiEvent
        ) {

            return;

        }

        const savedEmoji =
            protection.saved.emoji;

        if (
            savedEmoji === null ||
            savedEmoji === undefined ||
            String(savedEmoji).trim() === ""
        ) {

            return;

        }

        const threadID =
            String(event.threadID);

        if (
            isBotChange(
                "emoji",
                threadID
            )
        ) {

            return;

        }

        if (
            isProtectionLocked(
                threadID,
                "emoji"
            )
        ) {

            return;

        }

        lockProtection(
            threadID,
            "emoji"
        );

        const result =
            await apiCall(
                "changeThreadEmoji",
                String(savedEmoji),
                threadID
            );

        if (
            result.error
        ) {

            console.error(
                "[PROTECTION EMOJI ERROR]",
                result.error.message ||
                result.error
            );

            return;

        }

        console.log(
            `[PROTECTION] تم استرجاع إيموجي المجموعة ${threadID}`
        );

    }

    // ==================================================
    // 🛡️ استخراج ID العضو
    // ==================================================

    function extractNicknameUserID(
        event
    ) {

        const data =
            event.logMessageData ||
            {};

        const possibleIDs = [

            data.participant_id,
            data.participantID,
            data.userFbId,
            data.userID,
            data.user_id,
            data.uid,
            data.target_id,
            data.changed_user_id

        ];

        for (
            const id of possibleIDs
        ) {

            if (
                id !== undefined &&
                id !== null &&
                String(id).trim()
            ) {

                return String(id);

            }

        }

        return "";

    }

    // ==================================================
    // 🛡️ حماية الكنيات
    // ==================================================

    async function protectNickname(
        event,
        protection
    ) {

        if (
            isBotEvent(event)
        ) {

            return;

        }

        if (
            !protection.enabled.nicknames
        ) {

            return;

        }

        if (
            event.logMessageType !==
            "log:user-nickname"
        ) {

            return;

        }

        const userID =
            extractNicknameUserID(
                event
            );

        if (
            !userID
        ) {

            console.log(
                "[PROTECTION NICKNAME] لم يتم العثور على ID العضو"
            );

            return;

        }

        if (
            isBotUser(userID)
        ) {

            return;

        }

        const threadID =
            String(event.threadID);

        if (
            isBotChange(
                "nickname",
                threadID,
                userID
            )
        ) {

            return;

        }

        if (
            !protection.saved
        ) {

            return;

        }

        if (
            !protection.saved.nicknames ||
            typeof protection.saved.nicknames !==
            "object"
        ) {

            return;

        }

        const nicknames =
            protection.saved.nicknames;

        if (
            !Object.prototype.hasOwnProperty.call(
                nicknames,
                userID
            )
        ) {

            const info =
                await getThreadInfo(
                    event.threadID
                );

            if (!info) return;

            const currentNicknames =
                extractNicknames(
                    info
                );

            if (
                !Object.prototype.hasOwnProperty.call(
                    currentNicknames,
                    userID
                )
            ) {

                return;

            }

            nicknames[userID] =
                currentNicknames[userID] ||
                "";

            protection.saved.nicknames =
                nicknames;

            await Protection.saveProtection(
                String(event.threadID),
                protection
            );

            console.log(
                `[PROTECTION] تم تسجيل كنية العضو الجديد ${userID}`
            );

            return;

        }

        const savedNickname =
            nicknames[userID] ||
            "";

        if (
            isProtectionLocked(
                threadID,
                `nickname:${userID}`
            )
        ) {

            return;

        }

        lockProtection(
            threadID,
            `nickname:${userID}`
        );

        const result =
            await apiCall(
                "changeNickname",
                String(savedNickname),
                threadID,
                userID
            );

        if (
            result.error
        ) {

            console.error(
                "[PROTECTION NICKNAME ERROR]",
                result.error.message ||
                result.error
            );

            return;

        }

        console.log(
            `[PROTECTION] تم استرجاع كنية ${userID}`
        );

    }

    // ==================================================
    // 🛡️ استخراج الكنيات
    // ==================================================

    function extractNicknames(
        info
    ) {

        const result = {};

        if (
            !info ||
            !info.nicknames
        ) {

            return result;

        }

        if (
            typeof info.nicknames ===
            "object" &&
            !Array.isArray(
                info.nicknames
            )
        ) {

            for (
                const [
                    uid,
                    nickname
                ]
                of Object.entries(
                    info.nicknames
                )
            ) {

                result[
                    String(uid)
                ] =
                    nickname ||
                    "";

            }

            return result;

        }

        if (
            Array.isArray(
                info.nicknames
            )
        ) {

            for (
                const item
                of info.nicknames
            ) {

                if (
                    !item ||
                    typeof item !==
                    "object"
                ) {

                    continue;

                }

                const uid =
                    item.userFbId ||
                    item.userID ||
                    item.userid ||
                    item.user_id ||
                    item.id;

                if (
                    !uid
                ) {

                    continue;

                }

                result[
                    String(uid)
                ] =
                    item.nickname ||
                    "";

            }

        }

        return result;

    }

    // ==================================================
    // 🖼️ استخراج صورة المجموعة
    // ==================================================

    function extractImage(
        info
    ) {

        if (!info) return null;

        return (
            info.imageSrc ||
            info.image ||
            info.threadImage ||
            info.thread_image ||
            null
        );

    }

    // ==================================================
    // 🎨 استخراج السمة
    // ==================================================

    function extractTheme(
        info
    ) {

        if (!info) return null;

        return (
            info.color ||
            info.threadColor ||
            info.thread_color ||
            null
        );

    }

    // ==================================================
    // 🧩 استخراج الإيموجي
    // ==================================================

    function extractEmoji(
        info
    ) {

        if (!info) return null;

        if (
            info.emoji &&
            typeof info.emoji ===
            "object"
        ) {

            return (
                info.emoji.emoji ||
                info.emoji.value ||
                null
            );

        }

        return (
            info.emoji ||
            info.threadEmoji ||
            info.thread_emoji ||
            null
        );

    }

    // ==================================================
    // 🛡️ حماية صورة المجموعة
    // ==================================================

    async function protectGroupImage(
        event,
        protection
    ) {

        if (
            isBotEvent(event)
        ) {

            return;

        }

        if (
            !protection.enabled.image
        ) {

            return;

        }

        const isImageEvent =
            event.logMessageType ===
                "log:thread-image" ||
            event.eventType ===
                "change_thread_image" ||
            event.type ===
                "change_thread_image";

        if (
            !isImageEvent
        ) {

            return;

        }

        const savedImage =
            protection.saved.image;

        if (
            !savedImage
        ) {

            return;

        }

        if (
            typeof api.changeGroupImage !==
            "function"
        ) {

            console.error(
                "[PROTECTION IMAGE] changeGroupImage غير موجود في API"
            );

            return;

        }

        const threadID =
            String(event.threadID);

        if (
            isBotChange(
                "image",
                threadID
            )
        ) {

            return;

        }

        if (
            isProtectionLocked(
                threadID,
                "image"
            )
        ) {

            return;

        }

        lockProtection(
            threadID,
            "image",
            8000
        );

        const extension =
            savedImage.includes(
                ".png"
            )
                ? ".png"
                : ".jpg";

        const filePath =
            path.join(
                PROTECTION_IMAGE_DIR,
                `${threadID}${extension}`
            );

        try {

            await downloadFile(
                savedImage,
                filePath
            );

            const result =
                await apiCall(
                    "changeGroupImage",
                    fs.createReadStream(
                        filePath
                    ),
                    threadID
                );

            if (
                result.error
            ) {

                console.error(
                    "[PROTECTION IMAGE ERROR]",
                    result.error.message ||
                    result.error
                );

                return;

            }

            console.log(
                `[PROTECTION] تم استرجاع صورة المجموعة ${threadID}`
            );

        } catch (error) {

            console.error(
                "[PROTECTION IMAGE ERROR]",
                error.message ||
                error
            );

        } finally {

            setTimeout(
                () => {

                    try {

                        if (
                            fs.existsSync(
                                filePath
                            )
                        ) {

                            fs.unlinkSync(
                                filePath
                            );

                        }

                    } catch (error) {}

                },
                3000
            );

        }

    }

    // ==================================================
    // 🛡️ تسجيل كنية عضو جديد
    // ==================================================

    async function registerNewMemberNickname(
        event,
        protection
    ) {

        if (
            !protection.enabled.nicknames
        ) {

            return;

        }

        if (
            event.logMessageType !==
            "log:subscribe"
        ) {

            return;

        }

        const data =
            event.logMessageData ||
            {};

        const userIDs = [];

        if (
            Array.isArray(
                data.addedParticipants
            )
        ) {

            for (
                const participant
                of data.addedParticipants
            ) {

                if (
                    !participant
                ) {

                    continue;

                }

                const uid =
                    participant.userFbId ||
                    participant.userID ||
                    participant.userid ||
                    participant.id;

                if (
                    uid &&
                    !isBotUser(uid)
                ) {

                    userIDs.push(
                        String(uid)
                    );

                }

            }

        }

        if (
            data.participant_id &&
            !isBotUser(
                data.participant_id
            )
        ) {

            userIDs.push(
                String(
                    data.participant_id
                )
            );

        }

        if (
            data.participantID &&
            !isBotUser(
                data.participantID
            )
        ) {

            userIDs.push(
                String(
                    data.participantID
                )
            );

        }

        const uniqueUserIDs =
            [
                ...new Set(
                    userIDs
                )
            ];

        if (
            uniqueUserIDs.length ===
            0
        ) {

            return;

        }

        const info =
            await getThreadInfo(
                event.threadID
            );

        if (!info) return;

        const currentNicknames =
            extractNicknames(
                info
            );

        if (
            !protection.saved
        ) {

            protection.saved = {};

        }

        if (
            !protection.saved.nicknames ||
            typeof protection.saved.nicknames !==
            "object"
        ) {

            protection.saved.nicknames =
                {};

        }

        let changed =
            false;

        for (
            const userID
            of uniqueUserIDs
        ) {

            if (
                isBotUser(userID)
            ) {

                continue;

            }

            if (
                Object.prototype.hasOwnProperty.call(
                    protection.saved.nicknames,
                    userID
                )
            ) {

                continue;

            }

            if (
                !Object.prototype.hasOwnProperty.call(
                    currentNicknames,
                    userID
                )
            ) {

                protection.saved.nicknames[
                    userID
                ] = "";

                changed = true;

                continue;

            }

            protection.saved.nicknames[
                userID
            ] =
                currentNicknames[
                    userID
                ] || "";

            changed = true;

        }

        if (
            changed
        ) {

            await Protection.saveProtection(
                String(event.threadID),
                protection
            );

            console.log(
                `[PROTECTION] تم حفظ كنيات الأعضاء الجدد في ${event.threadID}`
            );

        }

    }

    // ==================================================
    // 🛡️ حماية المجموعة
    // ==================================================

    async function handleProtection(
        event
    ) {

        if (
            !event ||
            !event.threadID
        ) {

            return;

        }

        const threadID =
            String(
                event.threadID
            );

        const protection =
            await Protection.getProtection(
                threadID
            );

        if (
            !protection ||
            !protection.enabled
        ) {

            return;

        }

        if (
            isBotEvent(event)
        ) {

            return;

        }

        await registerNewMemberNickname(
            event,
            protection
        );

        await protectGroupName(
            event,
            protection
        );

        await protectTheme(
            event,
            protection
        );

        await protectEmoji(
            event,
            protection
        );

        await protectNickname(
            event,
            protection
        );

        await protectGroupImage(
            event,
            protection
        );

    }

    // ==================================================
    // 🚀 Handle Event
    // ==================================================

    return async function ({
        event
    }) {

        try {

            if (!event) {

                return;

            }

            // ==================================================
            // 🛡️ نظام حماية المجموعة
            // ==================================================

            try {

                await handleProtection(
                    event
                );

            } catch (error) {

                console.error(
                    "[PROTECTION ERROR]",
                    error
                );

            }

            // ==================================================
            // 🦧🦊🦋👽🦌🐇🐈‍⬛🦍 التفاعل التلقائي
            // ==================================================

            try {

                autoReactions({
                    api,
                    event,
                    isBotUser
                });

            } catch (error) {

                console.error(
                    "[HINA REACTION ERROR]",
                    error.message ||
                    error
                );

            }

            // ==================================================
            // 📊 تسجيل نشاط الرسائل
            // ==================================================

            if (
                event.type === "message" &&
                event.threadID &&
                event.senderID &&
                !isBotUser(event.senderID)
            ) {

                registerActivity(
                    String(
                        event.threadID
                    ),
                    String(
                        event.senderID
                    )
                );

            }

            // ==================================================
            // ⚙️ الإعدادات
            // ==================================================

            const {
                allowInbox
            } =
                global.config;

            // ==================================================
            // 🚫 المحظورون
            // ==================================================

            const {
                userBanned,
                threadBanned
            } = global.data;

            // ==================================================
            // 📦 أوامر البوت
            // ==================================================

            const {
                commands
            } =
                global.client;

            // ==================================================
            // 🆔 IDs
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
            // 🚫 منع المستخدم المحظور
            // ==================================================

            if (
                userBanned &&
                typeof userBanned.has ===
                    "function" &&
                userBanned.has(
                    senderID
                )
            ) {

                return;

            }

            // ==================================================
            // 🚫 منع المجموعة المحظورة
            // ==================================================

            if (
                threadBanned &&
                typeof threadBanned.has ===
                    "function" &&
                threadBanned.has(
                    threadID
                )
            ) {

                return;

            }

            // ==================================================
            // 🚫 منع الخاص
            // ==================================================

            if (
                allowInbox === false &&
                senderID === threadID
            ) {

                return;

            }

            // ==================================================
            // 📋 الحصول على Events
            // ==================================================

            let registeredEvents =
                [];

            if (
                global.client.events &&
                global.client.events instanceof Map
            ) {

                registeredEvents =
                    Array.from(
                        global.client.events.entries()
                    );

            }

            // ==================================================
            // دعم eventRegistered
            // ==================================================

            if (
                Array.isArray(
                    global.client.eventRegistered
                ) &&
                global.client.eventRegistered.length > 0
            ) {

                const oldEvents =
                    [];

                for (
                    const eventName
                    of global.client.eventRegistered
                ) {

                    try {

                        const eventModule =
                            global.client.events?.get(
                                eventName
                            );

                        if (
                            eventModule
                        ) {

                            oldEvents.push([
                                eventName,
                                eventModule
                            ]);

                        }

                    } catch (
                        error
                    ) {

                        console.error(
                            `[EVENT REGISTER ERROR] ${eventName}`,
                            error.message
                        );

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
                registeredEvents.length ===
                0
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

                if (
                    !eventModule
                ) {

                    continue;

                }

                // ==================================================
                // التأكد من handleEvent
                // ==================================================

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
                        function (
                            ...values
                        ) {

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
                                    ] ||
                                    "";

                                for (
                                    let i = 1;
                                    i < values.length;
                                    i++
                                ) {

                                    const regex =
                                        new RegExp(
                                            "%" + i,
                                            "g"
                                        );

                                    text =
                                        text.replace(
                                            regex,
                                            String(
                                                values[i]
                                            )
                                        );

                                }

                                return text;

                            } catch (
                                error
                            ) {

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

                } catch (
                    error
                ) {

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

                    } catch (
                        e
                    ) {}

                }

            }

        } catch (
            error
        ) {

            // ==================================================
            // ❌ خطأ عام
            // ==================================================

            console.error(
                "❌ HANDLE EVENT ERROR:",
                error
            );

            try {

                logger(
                    `❌ HandleEvent Error: ${error.message}`,
                    "error"
                );

            } catch (
                e
            ) {}

        }

    };

};