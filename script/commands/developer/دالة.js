module.exports.config = {
    name: "دالة",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "عرض جزء من listenMqtt الخاص بطلبات الصداقة",
    commandCategory: "Developer",
    usages: "دالة",
    cooldowns: 5
};

const fs = require("fs");
const path = require("path");

const DEVELOPER_ID = "61578581225040";

module.exports.run = async function ({ api, event }) {

    const threadID = String(event.threadID || "");
    const senderID = String(event.senderID || "");

    if (senderID !== DEVELOPER_ID) {
        return api.sendMessage(
            "هذا الأمر مخصص للمطور فقط",
            threadID,
            event.messageID
        );
    }

    const filePath = path.join(
        process.cwd(),
        "node_modules",
        "hut-chat-api",
        "src",
        "listenMqtt.js"
    );

    if (!fs.existsSync(filePath)) {
        return api.sendMessage(
            "لم أجد ملف listenMqtt.js داخل hut-chat-api",
            threadID,
            event.messageID
        );
    }

    try {

        const lines = fs.readFileSync(
            filePath,
            "utf8"
        ).split(/\r?\n/);

        const keywords = [
            "jewel_requests_add",
            "jewel_requests_remove_old",
            "friend_request_received",
            "friend_request_cancel"
        ];

        const indexes = [];

        for (let i = 0; i < lines.length; i++) {

            const line = lines[i].toLowerCase();

            if (
                keywords.some(
                    keyword =>
                        line.includes(
                            keyword.toLowerCase()
                        )
                )
            ) {
                indexes.push(i);
            }
        }

        if (!indexes.length) {
            return api.sendMessage(
                "لم أجد أحداث طلبات الصداقة",
                threadID,
                event.messageID
            );
        }

        const selected = new Set();

        // نعرض 15 سطر قبل وبعد كل تطابق
        for (const index of indexes) {

            const start =
                Math.max(0, index - 15);

            const end =
                Math.min(
                    lines.length,
                    index + 16
                );

            for (let i = start; i < end; i++) {
                selected.add(i);
            }
        }

        const sorted =
            [...selected].sort(
                (a, b) => a - b
            );

        let output =
`╭───〔 𝗛𝗜𝗡𝗔 〢 𝗟𝗜𝗦𝗧𝗘𝗡 〕───╮

ملف:
listenMqtt.js

`;

        for (const index of sorted) {

            output +=
`${index + 1}: ${lines[index]}
`;
        }

        output +=
`\n╰──────────────╯`;

        return api.sendMessage(
            output,
            threadID,
            event.messageID
        );

    } catch (error) {

        console.error(
            "[دالة LISTEN ERROR]",
            error
        );

        return api.sendMessage(
            `حدث خطأ:\n${error.message || error}`,
            threadID,
            event.messageID
        );
    }
};