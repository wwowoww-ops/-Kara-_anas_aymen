/**
 * كمند.js
 *
 * كمند
 *   → يحفظ كود الأمر
 *
 * كمند تجربة
 *   → ينفذ الأمر المحفوظ فعليًا
 *
 * كمند جديد
 *   → يحذف الأمر المحفوظ
 *
 * الحفظ مؤقت في الذاكرة فقط
 */

let savedCommand = null;
let waitingForCode = false;

module.exports.config = {
    name: "كمند",
    version: "1.0.0",
    author: "أبو هريرة",
    countDown: 0,
    role: 2,
    shortDescription: "حفظ وتجربة أمر مؤقت",
    longDescription: "حفظ كود أمر وتشغيله مباشرة للتجربة",
    category: "Developer",
    guide: {
        en: "{pn}"
    }
};

module.exports.run = async function ({
    api,
    event,
    args
}) {

    const admins = Array.isArray(global.config?.ADMINBOT)
        ? global.config.ADMINBOT.map(String)
        : [];

    const developerID = String(event.senderID);

    if (!admins.includes(developerID)) {
        return api.sendMessage(
            "هذا الأمر مخصص للمطور فقط.",
            event.threadID,
            event.messageID
        );
    }

    const action = args.join(" ").trim().toLowerCase();

    /*
     * =========================
     * كمند جديد
     * =========================
     */

    if (action === "جديد") {

        savedCommand = null;
        waitingForCode = false;

        return api.sendMessage(
            "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n" +
            "تم حذف الكمند المحفوظ.\n\n" +
            "أرسل «كمند» لإدخال كمند جديد.",
            event.threadID,
            event.messageID
        );
    }

    /*
     * =========================
     * كمند تجربة
     * =========================
     */

    if (action === "تجربة") {

        if (!savedCommand) {
            return api.sendMessage(
                "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n" +
                "لا يوجد كمند محفوظ للتجربة.",
                event.threadID,
                event.messageID
            );
        }

        try {

            const moduleObject = {
                exports: {}
            };

            const exportsObject = moduleObject.exports;

            /*
             * تشغيل ملف الكمند كما لو أنه ملف JavaScript مستقل
             */

            const AsyncFunction = Object.getPrototypeOf(
                async function () {}
            ).constructor;

            const executeModule = new AsyncFunction(
                "module",
                "exports",
                "require",
                "__dirname",
                "__filename",
                savedCommand
            );

            await executeModule(
                moduleObject,
                exportsObject,
                require,
                __dirname,
                __filename
            );

            /*
             * إذا كان الكود يحتوي على module.exports.run
             * يتم تشغيله كأمر حقيقي
             */

            if (
                moduleObject.exports &&
                typeof moduleObject.exports.run === "function"
            ) {

                await moduleObject.exports.run({
                    api,
                    event,
                    args: [],
                    models: global.models || null,
                    Threads: global.Threads || null,
                    Users: global.Users || null,
                    Currencies: global.Currencies || null
                });

                return;
            }

            /*
             * إذا لم يكن ملف أمر كامل
             * نعتبر الكود نفسه هو جسم الأمر
             */

            const runCode = new AsyncFunction(
                "api",
                "event",
                "args",
                "global",
                "config",
                "models",
                "Threads",
                "Users",
                "Currencies",
                "require",
                "process",
                "__dirname",
                "__filename",

                `"use strict";
${savedCommand}`
            );

            await runCode(
                api,
                event,
                [],
                global,
                global.config,
                global.models || null,
                global.Threads || null,
                global.Users || null,
                global.Currencies || null,
                require,
                process,
                __dirname,
                __filename
            );

        } catch (error) {

            const errorText =
                error?.stack ||
                error?.message ||
                String(error);

            return api.sendMessage(
                "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n" +
                "حدث خطأ أثناء تنفيذ الكمند:\n\n" +
                errorText.slice(0, 1800),
                event.threadID,
                event.messageID
            );
        }

        return;
    }

    /*
     * =========================
     * كمند
     * =========================
     */

    if (!action) {

        waitingForCode = true;

        return api.sendMessage(
            "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n" +
            "أرسل الآن كود الكمند.\n\n" +
            "سيتم حفظه فقط ولن يتم تشغيله.\n\n" +
            "بعدها استخدم:\n" +
            "كمند تجربة\n\n" +
            "لحذف الكمند والبدء من جديد:\n" +
            "كمند جديد",
            event.threadID,
            event.messageID
        );
    }

    /*
     * إذا كتب المستخدم الكود مباشرة بعد كمند
     */

    if (waitingForCode) {

        savedCommand = event.body || "";
        waitingForCode = false;

        return api.sendMessage(
            "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n" +
            "تم حفظ الكمند.\n\n" +
            "لن يتم تشغيله الآن.\n\n" +
            "لتشغيله فعليًا استخدم:\n" +
            "كمند تجربة",
            event.threadID,
            event.messageID
        );
    }

    return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n" +
        "استخدم:\n\n" +
        "كمند\n" +
        "لحفظ كمند جديد\n\n" +
        "كمند تجربة\n" +
        "لتشغيل الكمند المحفوظ\n\n" +
        "كمند جديد\n" +
        "لحذف الكمند المحفوظ",
        event.threadID,
        event.messageID
    );
};