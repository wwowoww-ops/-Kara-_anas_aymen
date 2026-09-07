module.exports.config = {
    name: "تحميل",
    version: "1.0.0",
    hasPermssion: 2,
    credits: "أبو هريرة",
    description: "عرض إحصائيات تحميل الأوامر والأحداث",
    commandCategory: "developer",
    usages: "تحميل",
    cooldowns: 5
};

module.exports.run = async function ({
    api,
    event
}) {

    try {

        const stats =
            global.client?.loadStats;

        if (!stats) {

            return api.sendMessage(
                "⌬ ━━ 𝗛𝗜𝗡𝗔 〢 𝗟𝗢𝗔𝗗𝗘𝗥 ━━ ⌬\n\nلم يتم العثور على بيانات التحميل.",
                event.threadID,
                event.messageID
            );

        }

        const commandsLoaded =
            Number(stats.commandsLoaded || 0);

        const commandsFailed =
            Number(stats.commandsFailed || 0);

        const eventsLoaded =
            Number(stats.eventsLoaded || 0);

        const eventsFailed =
            Number(stats.eventsFailed || 0);

        const totalCommandFiles =
            Number(stats.totalCommandFiles || 0);

        const totalEventFiles =
            Number(stats.totalEventFiles || 0);

        const totalLoaded =
            commandsLoaded +
            eventsLoaded;

        const totalFailed =
            commandsFailed +
            eventsFailed;

        const totalFiles =
            totalCommandFiles +
            totalEventFiles;

        const successRate =
            totalFiles > 0
                ? ((totalLoaded / totalFiles) * 100).toFixed(1)
                : "0.0";

        let message =
`⌬ ━━ 𝗛𝗜𝗡𝗔 〢 𝗟𝗢𝗔𝗗𝗘𝗥 ━━ ⌬

╭───〔 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦 〕───╮

⌬ المحملة : ${commandsLoaded}
⌬ الفاشلة : ${commandsFailed}
⌬ الإجمالي : ${totalCommandFiles}

╰────────────────────╯

╭───〔 𝗘𝗩𝗘𝗡𝗧𝗦 〕───╮

⌬ المحملة : ${eventsLoaded}
⌬ الفاشلة : ${eventsFailed}
⌬ الإجمالي : ${totalEventFiles}

╰───────────────────╯

╭───〔 𝗧𝗢𝗧𝗔𝗟 〕───╮

⌬ إجمالي الملفات : ${totalFiles}
⌬ تم تحميلها : ${totalLoaded}
⌬ فشل تحميلها : ${totalFailed}
⌬ نسبة النجاح : ${successRate}%

╰──────────────────╯`;

        // ═══════════════════════════════════════
        // الأوامر الفاشلة
        // ═══════════════════════════════════════

        if (
            Array.isArray(stats.failedCommands) &&
            stats.failedCommands.length > 0
        ) {

            message +=
`\n\n⌬ ━━ 𝗙𝗔𝗜𝗟𝗘𝗗 𝗖𝗢𝗠𝗠𝗔𝗡𝗗𝗦 ━━ ⌬`;

            for (
                let i = 0;
                i < stats.failedCommands.length;
                i++
            ) {

                const item =
                    stats.failedCommands[i];

                message +=
`\n\n${i + 1} ┊ ❌ ${item.file}
⌬ الفئة : ${item.category || "غير معروفة"}
⌬ السبب : ${item.reason || "سبب غير معروف"}`;

            }

        }

        // ═══════════════════════════════════════
        // الأحداث الفاشلة
        // ═══════════════════════════════════════

        if (
            Array.isArray(stats.failedEvents) &&
            stats.failedEvents.length > 0
        ) {

            message +=
`\n\n⌬ ━━ 𝗙𝗔𝗜𝗟𝗘𝗗 𝗘𝗩𝗘𝗡𝗧𝗦 ━━ ⌬`;

            for (
                let i = 0;
                i < stats.failedEvents.length;
                i++
            ) {

                const item =
                    stats.failedEvents[i];

                message +=
`\n\n${i + 1} ┊ ❌ ${item.file}
⌬ السبب : ${item.reason || "سبب غير معروف"}`;

            }

        }

        // ═══════════════════════════════════════
        // حالة التحميل
        // ═══════════════════════════════════════

        if (
            totalFailed === 0 &&
            totalFiles > 0
        ) {

            message +=
`\n\n⌬ ━━ 𝗦𝗧𝗔𝗧𝗨𝗦 ━━ ⌬
✅ تم تحميل جميع الملفات بنجاح`;

        } else if (
            totalFailed > 0
        ) {

            message +=
`\n\n⌬ ━━ 𝗦𝗧𝗔𝗧𝗨𝗦 ━━ ⌬
⚠️ يوجد ${totalFailed} ملف فشل تحميله`;

        }

        return api.sendMessage(
            message,
            event.threadID,
            event.messageID
        );

    } catch (error) {

        console.error(
            "[ HINA LOAD COMMAND ERROR ]",
            error
        );

        return api.sendMessage(
            `⌬ ━━ 𝗛𝗜𝗡𝗔 〢 𝗟𝗢𝗔𝗗𝗘𝗥 ━━ ⌬

❌ حدث خطأ أثناء قراءة إحصائيات التحميل

الخطأ:
${error.message || error}`,
            event.threadID,
            event.messageID
        );

    }

};

استخدم الأمر:

تحميل

وهو مخصص للمطور بسبب:

hasPermssion: 2

إذا كان نظام الصلاحيات عندك يعتبر "2" للمطور، فسيعمل مباشرة.