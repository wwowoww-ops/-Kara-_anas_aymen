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

const CACHE_DIR = path.join(
    DATA_DIR,
    "deletedMessages"
);

function loadConfig() {

    try {

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
            "[messageUnsend] CONFIG ERROR:",
            error.message
        );

        return {};
    }
}

function getCacheFile(threadID) {

    return path.join(
        CACHE_DIR,
        `${threadID}.json`
    );
}

function loadCache(threadID) {

    try {

        const file =
            getCacheFile(threadID);

        if (!fs.existsSync(file)) {
            return {};
        }

        return JSON.parse(
            fs.readFileSync(
                file,
                "utf8"
            )
        );

    } catch (error) {

        console.error(
            "[messageUnsend] CACHE LOAD ERROR:",
            error.message
        );

        return {};
    }
}

function saveCache(
    threadID,
    cache
) {

    try {

        if (!fs.existsSync(CACHE_DIR)) {

            fs.mkdirSync(
                CACHE_DIR,
                {
                    recursive: true
                }
            );

        }

        fs.writeFileSync(
            getCacheFile(threadID),
            JSON.stringify(
                cache,
                null,
                2
            ),
            "utf8"
        );

    } catch (error) {

        console.error(
            "[messageUnsend] CACHE SAVE ERROR:",
            error.message
        );
    }
}

function getName(
    Users,
    userID
) {

    if (
        !Users ||
        typeof Users.getName !== "function"
    ) {
        return userID;
    }

    try {

        const name =
            Users.getName(userID);

        if (name) {
            return String(name);
        }

    } catch (_) {}

    return userID;
}

module.exports.config = {
    name: "messageUnsend",
    eventType: [
        "message",
        "message_unsend"
    ],
    version: "1.0.0",
    credits: "أبو هريرة",
    description: "حفظ الرسائل وإظهار الرسائل المحذوفة",
    category: "events"
};

module.exports.handleEvent = async function ({
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
        // إذا النظام غير مفعل
        // ==================================================

        if (
            config[threadID] !== true
        ) {
            return;
        }

        // ==================================================
        // رسالة جديدة
        // ==================================================

        if (
            event.type === "message"
        ) {

            const messageID =
                String(
                    event.messageID || ""
                );

            if (!messageID) {
                return;
            }

            const senderID =
                String(
                    event.senderID ||
                    event.authorID ||
                    ""
                );

            if (!senderID) {
                return;
            }

            // لا نحفظ رسائل البوت
            let botID = "";

            try {

                botID =
                    String(
                        api.getCurrentUserID()
                    );

            } catch (_) {}

            if (
                botID &&
                senderID === botID
            ) {
                return;
            }

            const cache =
                loadCache(threadID);

            cache[messageID] = {
                messageID,
                senderID,
                body: String(
                    event.body || ""
                ),
                attachments:
                    Array.isArray(
                        event.attachments
                    )
                        ? event.attachments
                        : [],
                timestamp:
                    Date.now()
            };

            // ==================================================
            // تنظيف الرسائل القديمة
            // ==================================================

            const entries =
                Object.entries(cache)
                    .sort(
                        (a, b) =>
                            Number(
                                b[1].timestamp || 0
                            ) -
                            Number(
                                a[1].timestamp || 0
                            )
                    );

            const limited =
                entries.slice(
                    0,
                    500
                );

            const newCache =
                Object.fromEntries(
                    limited
                );

            saveCache(
                threadID,
                newCache
            );

            return;
        }

        // ==================================================
        // رسالة محذوفة
        // ==================================================

        if (
            event.type !== "message_unsend"
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

        const cache =
            loadCache(threadID);

        const deleted =
            cache[messageID];

        if (!deleted) {

            return api.sendMessage(
                "⚠️ تم حذف رسالة لكن لم يتم العثور على محتواها في الذاكرة",
                threadID
            );
        }

        const senderName =
            getName(
                Users,
                deleted.senderID
            );

        const body =
            deleted.body &&
            deleted.body.trim()
                ? deleted.body
                : "رسالة بدون نص";

        const message =
`╭━━━━━━━━━━━━━━━━╮
       𝗛𝗜𝗡𝗔 〢 مـحـذوف
╰━━━━━━━━━━━━━━━━╯

✦ صاحب الرسالة
『 ${senderName} 』

✦ محتوى الرسالة
『 ${body} 』

╰━━━━━━━━━━━━━━━━╯`;

        api.sendMessage(
            message,
            threadID,
            error => {

                if (error) {

                    console.error(
                        "[messageUnsend] SEND ERROR:",
                        error
                    );

                }

            }
        );

        // ==================================================
        // حذفها من الكاش بعد إظهارها
        // ==================================================

        delete cache[messageID];

        saveCache(
            threadID,
            cache
        );

    } catch (error) {

        console.error(
            "❌ MESSAGE UNSEND ERROR:",
            error
        );

    }
};