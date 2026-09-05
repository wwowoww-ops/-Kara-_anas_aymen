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

// ==================================================
// قراءة الإعدادات
// ==================================================

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
            "[محذوف] CONFIG ERROR:",
            error.message
        );

        return {};
    }
}

// ==================================================
// قراءة الكاش
// ==================================================

function loadCache() {

    try {

        if (!fs.existsSync(CACHE_FILE)) {
            return {};
        }

        return JSON.parse(
            fs.readFileSync(
                CACHE_FILE,
                "utf8"
            )
        );

    } catch (error) {

        console.error(
            "[محذوف] CACHE ERROR:",
            error.message
        );

        return {};
    }
}

// ==================================================
// حفظ الكاش
// ==================================================

function saveCache(cache) {

    try {

        if (!fs.existsSync(DATA_DIR)) {

            fs.mkdirSync(
                DATA_DIR,
                {
                    recursive: true
                }
            );

        }

        fs.writeFileSync(
            CACHE_FILE,
            JSON.stringify(
                cache,
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
// اسم المستخدم
// ==================================================

async function getUserName(
    Users,
    userID
) {

    try {

        if (
            Users &&
            typeof Users.getName === "function"
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
// EVENT
// ==================================================

module.exports.config = {
    name: "messageUnsend",
    eventType: [
        "message",
        "message_unsend"
    ],
    version: "3.0.0",
    credits: "أبو هريرة",
    description: "إظهار الرسائل المحذوفة",
    category: "events"
};

module.exports.handleEvent = async function ({
    api,
    event,
    Users
}) {

    try {

        if (!event) return;

        const threadID =
            String(
                event.threadID || ""
            );

        if (!threadID) return;

        const config =
            loadConfig();

        // ==================================================
        // الرسائل الجديدة
        // ==================================================

        if (
            event.type === "message"
        ) {

            const messageID =
                String(
                    event.messageID || ""
                );

            if (!messageID) return;

            const senderID =
                String(
                    event.senderID ||
                    event.authorID ||
                    ""
                );

            if (!senderID) return;

            // ----------------------------------------------
            // ID البوت
            // ----------------------------------------------

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
                loadCache();

            // ----------------------------------------------
            // حفظ الرسالة
            // ----------------------------------------------

            cache[messageID] = {

                threadID,

                senderID,

                body:
                    String(
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

            // ----------------------------------------------
            // الاحتفاظ بآخر 1000 رسالة
            // ----------------------------------------------

            const messages =
                Object.entries(cache)
                    .sort(
                        (a, b) =>
                            Number(
                                b[1].timestamp || 0
                            ) -
                            Number(
                                a[1].timestamp || 0
                            )
                    )
                    .slice(
                        0,
                        1000
                    );

            saveCache(
                Object.fromEntries(
                    messages
                )
            );

            return;
        }

        // ==================================================
        // الرسالة المحذوفة
        // ==================================================

        if (
            event.type !== "message_unsend"
        ) {
            return;
        }

        // ==================================================
        // هل النظام مفعل؟
        // ==================================================

        if (
            config[threadID] !== true
        ) {
            return;
        }

        const messageID =
            String(
                event.messageID || ""
            );

        if (!messageID) return;

        const cache =
            loadCache();

        const deleted =
            cache[messageID];

        // ==================================================
        // لم نجد الرسالة
        // ==================================================

        if (!deleted) {

            return api.sendMessage(
                "╭━━━━━━━━━━━━━━━━╮\n" +
                "       𝗛𝗜𝗡𝗔 〢 مـحـذوف\n" +
                "╰━━━━━━━━━━━━━━━━╯\n\n" +
                "⚠ لم أجد محتوى الرسالة المحذوفة\n" +
                "ربما تم إرسالها قبل تشغيل النظام",
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

        const body =
            deleted.body &&
            String(
                deleted.body
            ).trim()
                ? String(
                    deleted.body
                )
                : "رسالة بدون نص";

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
『 ${body} 』

╰━━━━━━━━━━━━━━━━╯`;

        // ==================================================
        // إرسال الرسالة
        // ==================================================

        api.sendMessage(
            message,
            threadID,
            error => {

                if (error) {

                    console.error(
                        "[محذوف] SEND ERROR:",
                        error
                    );

                }

            }
        );

        // ==================================================
        // حذفها من الذاكرة بعد عرضها
        // ==================================================

        delete cache[messageID];

        saveCache(cache);

    } catch (error) {

        console.error(
            "❌ MESSAGE UNSEND ERROR:",
            error
        );

    }

};