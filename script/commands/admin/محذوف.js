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
            "[محذوف] CONFIG LOAD ERROR:",
            error.message
        );

        return {};
    }
}

function saveConfig(config) {

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
            CONFIG_FILE,
            JSON.stringify(
                config,
                null,
                2
            ),
            "utf8"
        );

    } catch (error) {

        console.error(
            "[محذوف] CONFIG SAVE ERROR:",
            error.message
        );
    }
}

module.exports.config = {
    name: "محذوف",
    version: "1.0.0",
    credits: "أبو هريرة",
    description: "تفعيل وإيقاف نظام كشف الرسائل المحذوفة",
    category: "events",
    usages: "محذوف تشغيل | محذوف تعطيل | محذوف حالة"
};

module.exports.run = async function ({
    api,
    event
}) {

    try {

        if (!event || !event.threadID) {
            return;
        }

        const threadID =
            String(event.threadID);

        const args =
            event.body
                ? event.body
                    .trim()
                    .split(/\s+/)
                    .slice(1)
                : [];

        const action =
            String(
                args[0] || ""
            ).toLowerCase();

        const config =
            loadConfig();

        if (
            action === "تشغيل" ||
            action === "تفعيل" ||
            action === "on"
        ) {

            config[threadID] = true;

            saveConfig(config);

            return api.sendMessage(
                "╭━━━━━━━━━━━━━━━━╮\n" +
                "     𝗛𝗜𝗡𝗔 〢 محذوف\n" +
                "╰━━━━━━━━━━━━━━━━╯\n\n" +
                "✓ تم تفعيل نظام المحذوف\n\n" +
                "أي رسالة يتم حذفها بعد الآن\n" +
                "سيتم إظهارها في المجموعة",
                threadID
            );
        }

        if (
            action === "تعطيل" ||
            action === "ايقاف" ||
            action === "إيقاف" ||
            action === "off"
        ) {

            config[threadID] = false;

            saveConfig(config);

            return api.sendMessage(
                "╭━━━━━━━━━━━━━━━━╮\n" +
                "     𝗛𝗜𝗡𝗔 〢 محذوف\n" +
                "╰━━━━━━━━━━━━━━━━╯\n\n" +
                "✗ تم تعطيل نظام المحذوف",
                threadID
            );
        }

        if (
            action === "حالة" ||
            action === "status"
        ) {

            const enabled =
                config[threadID] === true;

            return api.sendMessage(
                enabled
                    ? "✓ نظام المحذوف مفعل في هذه المجموعة"
                    : "✗ نظام المحذوف غير مفعل في هذه المجموعة",
                threadID
            );
        }

        return api.sendMessage(
            "╭━━━━━━━━━━━━━━━━╮\n" +
            "     𝗛𝗜𝗡𝗔 〢 محذوف\n" +
            "╰━━━━━━━━━━━━━━━━╯\n\n" +
            "محذوف تشغيل\n" +
            "محذوف تعطيل\n" +
            "محذوف حالة",
            threadID
        );

    } catch (error) {

        console.error(
            "[محذوف COMMAND ERROR]:",
            error
        );

    }
};