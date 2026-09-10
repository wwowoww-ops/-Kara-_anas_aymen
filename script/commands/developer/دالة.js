module.exports.config = {
    name: "دالة",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "البحث داخل hut-chat-api عن دوال طلبات الصداقة",
    commandCategory: "Developer",
    usages: "دالة",
    cooldowns: 5
};

const fs = require("fs");
const path = require("path");

const DEVELOPER_ID = "61578581225040";

const API_DIR = path.join(
    process.cwd(),
    "node_modules",
    "hut-chat-api"
);

const KEYWORDS = [
    "friend",
    "friends",
    "friendrequest",
    "friend_request",
    "request",
    "requests"
];

function searchFiles(directory, results = []) {

    if (!fs.existsSync(directory)) {
        return results;
    }

    let files;

    try {
        files = fs.readdirSync(
            directory,
            { withFileTypes: true }
        );
    } catch (error) {
        return results;
    }

    for (const file of files) {

        const fullPath =
            path.join(directory, file.name);

        if (file.isDirectory()) {

            // تجاهل المجلدات غير المفيدة
            if (
                file.name === "node_modules" ||
                file.name === ".git"
            ) {
                continue;
            }

            searchFiles(
                fullPath,
                results
            );

            continue;
        }

        if (
            !/\.(js|cjs|mjs|json)$/
                .test(file.name)
        ) {
            continue;
        }

        let content;

        try {

            content =
                fs.readFileSync(
                    fullPath,
                    "utf8"
                );

        } catch (error) {
            continue;
        }

        const lines =
            content.split(/\r?\n/);

        for (
            let i = 0;
            i < lines.length;
            i++
        ) {

            const line =
                lines[i];

            const lower =
                line.toLowerCase();

            const matched =
                KEYWORDS.some(
                    keyword =>
                        lower.includes(keyword)
                );

            if (!matched) {
                continue;
            }

            results.push({
                file: fullPath,
                line: i + 1,
                text: line.trim()
            });

        }
    }

    return results;
}

module.exports.run = async function ({
    api,
    event
}) {

    const threadID =
        String(event.threadID || "");

    const senderID =
        String(event.senderID || "");

    if (
        senderID !==
        DEVELOPER_ID
    ) {

        return api.sendMessage(
            "هذا الأمر مخصص للمطور فقط",
            threadID,
            event.messageID
        );
    }

    if (!fs.existsSync(API_DIR)) {

        return api.sendMessage(
            "لم يتم العثور على node_modules/hut-chat-api",
            threadID,
            event.messageID
        );
    }

    try {

        const results =
            searchFiles(API_DIR);

        if (!results.length) {

            return api.sendMessage(
                "لم أجد أي كود يحتوي على friend أو request داخل الحزمة",
                threadID,
                event.messageID
            );
        }

        /*
         * نبحث أولاً عن الأسطر الأكثر أهمية
         */

        const important =
            results.filter(item =>
                /getFriend|friendRequest|friend_request|request/i
                    .test(item.text)
            );

        const selected =
            important.length
                ? important
                : results;

        const MAX_RESULTS = 80;

        const output =
            selected
                .slice(0, MAX_RESULTS)
                .map((item, index) => {

                    const relative =
                        path.relative(
                            API_DIR,
                            item.file
                        );

                    return (
                        `${index + 1} ـ ${relative}:${item.line}\n` +
                        `${item.text}`
                    );

                })
                .join("\n\n");

        let message =
`╭───〔 𝗛𝗜𝗡𝗔 〢 𝗛𝗨𝗧 API 〕───╮

نتائج البحث داخل hut-chat-api

عدد النتائج: ${selected.length}

`;

        message += output;

        if (selected.length > MAX_RESULTS) {

            message +=
`\n\n... تم عرض أول ${MAX_RESULTS} نتيجة فقط`;
        }

        message +=
`\n\n╰──────────────╯`;

        return api.sendMessage(
            message,
            threadID,
            event.messageID
        );

    } catch (error) {

        console.error(
            "[دالة SEARCH ERROR]",
            error
        );

        return api.sendMessage(
            `حدث خطأ أثناء البحث\n${error.message || error}`,
            threadID,
            event.messageID
        );
    }
};