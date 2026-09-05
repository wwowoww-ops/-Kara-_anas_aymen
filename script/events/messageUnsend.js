const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(
    __dirname,
    "../../data"
);

const CONFIG_FILE = path.join(
    DATA_DIR,
    "deletedMessagesConfig.json"
);

const CACHE_FILE = path.join(
    DATA_DIR,
    "deletedMessages.json"
);

const MAX_MESSAGES = 2000;
const MATCH_WINDOW = 60 * 1000;

// ==================================================
// إعداد المجلد
// ==================================================

function ensureDataDir() {

    if (!fs.existsSync(DATA_DIR)) {

        fs.mkdirSync(
            DATA_DIR,
            {
                recursive: true
            }
        );

    }

}

// ==================================================
// تحميل الإعدادات
// ==================================================

function loadConfig() {

    try {

        ensureDataDir();

        if (!fs.existsSync(CONFIG_FILE)) {
            return {};
        }

        return JSON.parse(
            fs.readFileSync(
                CONFIG_FILE,
                "utf8"
            )
        );

    } catch (error) {

        console.error(
            "[محذوف] CONFIG LOAD ERROR:",
            error.message
        );

        return {};
    }

}

// ==================================================
// تحميل الرسائل
// ==================================================

function loadCache() {

    try {

        ensureDataDir();

        if (!fs.existsSync(CACHE_FILE)) {
            return [];
        }

        const data =
            JSON.parse(
                fs.readFileSync(
                    CACHE_FILE,
                    "utf8"
                )
            );

        return Array.isArray(data)
            ? data
            : [];

    } catch (error) {

        console.error(
            "[محذوف] CACHE LOAD ERROR:",
            error.message
        );

        return [];
    }

}

// ==================================================
// حفظ الرسائل
// ==================================================

function saveCache(messages) {

    try {

        ensureDataDir();

        fs.writeFileSync(
            CACHE_FILE,
            JSON.stringify(
                messages,
                null,
                2
            ),
            "utf8"
        );

    } catch (error) {

        console.error(
            "[محذوف] CACHE SAVE ERROR:",
            error.message
        );

    }

}

// ==================================================
// تنظيف المرفقات
// ==================================================

function cleanAttachments(
    attachments
) {

    if (
        !Array.isArray(attachments)
    ) {
        return [];
    }

    return attachments
        .map(
            attachment => {

                if (!attachment) {
                    return null;
                }

                return {
                    type:
                        attachment.type ||
                        null,

                    url:
                        attachment.url ||
                        attachment.href ||
                        null,

                    filename:
                        attachment.filename ||
                        attachment.name ||
                        null
                };

            }
        )
        .filter(
            attachment =>
                attachment &&
                attachment.url
        );

}

// ==================================================
// اسم المستخدم
// ==================================================

async function getUserName(
    Users,
    userID
) {

    try {

        if (
            Users &&
            typeof Users.getName ===
                "function"
        ) {

            const name =
                await Users.getName(
                    String(userID)
                );

            if (name) {
                return String(name);
            }

        }

    } catch (_) {}

    return String(userID);

}

// ==================================================
// إرسال المرفقات
// ==================================================

async function sendAttachments(
    api,
    threadID,
    attachments
) {

    if (
        !Array.isArray(attachments) ||
        !attachments.length
    ) {
        return;
    }

    for (
        const attachment
        of attachments
    ) {

        try {

            if (
                !attachment ||
                !attachment.url
            ) {
                continue;
            }

            await new Promise(
                resolve => {

                    api.sendMessage(
                        {
                            attachment:
                                attachment.url
                        },
                        threadID,
                        error => {

                            if (error) {

                                console.error(
                                    "[محذوف] ATTACHMENT ERROR:",
                                    error.message ||
                                    error
                                );

                            }

                            resolve();

                        }
                    );

                }
            );

        } catch (error) {

            console.error(
                "[محذوف] ATTACHMENT SEND ERROR:",
                error.message ||
                error
            );

        }

    }

}

// ==================================================
// EVENT
// ==================================================

module.exports.config = {

    name: "messageUnsend",

    eventType: [
        "message",
        "message_unsend"
    ],

    version: "6.0.0",

    credits: "أبو هريرة",

    description:
        "حفظ واسترجاع الرسائل المحذوفة",

    category: "events"
};

// ==================================================
// HANDLE EVENT
// ==================================================

module.exports.handleEvent =
async function ({
    api,
    event,
    Users
}) {

    try {

        if (!event) {
            return;
        }

        const threadID =
            String(
                event.threadID || ""
            );

        if (!threadID) {
            return;
        }

        const config =
            loadConfig();

        // ==================================================
        // الرسائل العادية
        // ==================================================

        if (
            event.type === "message"
        ) {

            const senderID =
                String(
                    event.senderID ||
                    event.authorID ||
                    ""
                );

            if (!senderID) {
                return;
            }

            let botID = "";

            try {

                botID =
                    String(
                        api.getCurrentUserID()
                    );

            } catch (_) {}

            // لا تحفظ رسائل البوت
            if (
                botID &&
                senderID === botID
            ) {
                return;
            }

            const messageID =
                String(
                    event.messageID || ""
                );

            if (!messageID) {
                return;
            }

            const body =
                String(
                    event.body || ""
                );

            const attachments =
                cleanAttachments(
                    event.attachments
                );

            const timestamp =
                Date.now();

            let cache =
                loadCache();

            // ==================================================
            // حفظ الرسالة
            // ==================================================

            cache.push({

                messageID,

                threadID,

                senderID,

                body,

                attachments,

                timestamp

            });

            // ==================================================
            // الاحتفاظ بآخر الرسائل
            // ==================================================

            if (
                cache.length >
                MAX_MESSAGES
            ) {

                cache =
                    cache.slice(
                        -MAX_MESSAGES
                    );

            }

            saveCache(cache);

            return;
        }

        // ==================================================
        // حدث حذف رسالة
        // ==================================================

        if (
            event.type !==
            "message_unsend"
        ) {
            return;
        }

        // ==================================================
        // التحقق من التفعيل
        // ==================================================

        if (
            config[threadID] !== true
        ) {
            return;
        }

        const deletedSenderID =
            String(
                event.senderID ||
                ""
            );

        if (!deletedSenderID) {
            return;
        }

        const deletionTime =
            Number(
                event.deletionTimestamp ||
                Date.now()
            );

        let cache =
            loadCache();

        // ==================================================
        // البحث عن الرسالة
        // ==================================================

        const candidates =
            cache
                .filter(
                    message =>
                        String(
                            message.threadID
                        ) === threadID &&
                        String(
                            message.senderID
                        ) ===
                            deletedSenderID &&
                        Number(
                            message.timestamp
                        ) <=
                            deletionTime
                )
                .sort(
                    (a, b) =>
                        Number(
                            b.timestamp
                        ) -
                        Number(
                            a.timestamp
                        )
                );

        let deleted =
            candidates.find(
                message =>
                    deletionTime -
                    Number(
                        message.timestamp
                    ) <=
                    MATCH_WINDOW
            );

        // ==================================================
        // إذا لم نجد ضمن الدقيقة
        // نأخذ آخر رسالة لنفس الشخص
        // ==================================================

        if (!deleted) {

            deleted =
                candidates[0];

        }

        // ==================================================
        // لم يتم العثور
        // ==================================================

        if (!deleted) {

            return api.sendMessage(
                "╭━━━━━━━━━━━━━━━━╮\n" +
                "       𝗛𝗜𝗡𝗔 〢 مـحـذوف\n" +
                "╰━━━━━━━━━━━━━━━━╯\n\n" +
                "⚠ لم أتمكن من استرجاع الرسالة المحذوفة",
                threadID
            );

        }

        // ==================================================
        // اسم صاحب الرسالة
        // ==================================================

        const senderName =
            await getUserName(
                Users,
                deleted.senderID
            );

        // ==================================================
        // محتوى الرسالة
        // ==================================================

        const body =
            deleted.body &&
            deleted.body.trim()
                ? deleted.body
                : "بدون نص";

        // ==================================================
        // معلومات المرفقات
        // ==================================================

        let attachmentText = "";

        if (
            deleted.attachments &&
            deleted.attachments.length
        ) {

            attachmentText =
                "\n\n✦ المرفقات\n" +
                `『 ${deleted.attachments.length} مرفق 』`;

        }

        // ==================================================
        // الرسالة
        // ==================================================

        const message =
`╭━━━━━━━━━━━━━━━━╮
       𝗛𝗜𝗡𝗔 〢 مـحـذوف
╰━━━━━━━━━━━━━━━━╯

✦ صاحب الرسالة
『 ${senderName} 』

✦ الرسالة المحذوفة
『 ${body} 』${attachmentText}

╰━━━━━━━━━━━━━━━━╯`;

        // ==================================================
        // إرسال النص
        // ==================================================

        await new Promise(
            resolve => {

                api.sendMessage(
                    message,
                    threadID,
                    error => {

                        if (error) {

                            console.error(
                                "[محذوف] MESSAGE SEND ERROR:",
                                error.message ||
                                error
                            );

                        }

                        resolve();

                    }
                );

            }
        );

        // ==================================================
        // إرسال المرفقات
        // ==================================================

        if (
            deleted.attachments &&
            deleted.attachments.length
        ) {

            await sendAttachments(
                api,
                threadID,
                deleted.attachments
            );

        }

        // ==================================================
        // حذف الرسالة من الكاش
        // ==================================================

        cache =
            cache.filter(
                message =>
                    message !== deleted
            );

        saveCache(cache);

    } catch (error) {

        console.error(
            "❌ MESSAGE UNSEND ERROR:",
            error
        );

    }

};