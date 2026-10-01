/**
 * كمند.js
 *
 * كمند
 *   → يطلب كود الأمر ويحفظه
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

module.exports.config = {
    name: "كمند",
    version: "2.0.0",
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


/*
 * =========================
 * التحقق من المطور
 * =========================
 */

function isDeveloper(event) {

    const admins = Array.isArray(global.config?.ADMINBOT)
        ? global.config.ADMINBOT.map(String)
        : [];

    return admins.includes(String(event.senderID));
}


/*
 * =========================
 * تنفيذ الكود المحفوظ
 * =========================
 */

async function executeSavedCommand({
    api,
    event
}) {

    if (!savedCommand) {
        throw new Error("لا يوجد كمند محفوظ.");
    }

    const AsyncFunction = Object.getPrototypeOf(
        async function () {}
    ).constructor;


    /*
     * module وهمي حتى نتعامل مع الكود
     * كأنه ملف أمر حقيقي
     */

    const moduleObject = {
        exports: {}
    };

    const exportsObject = moduleObject.exports;


    /*
     * تشغيل الكود المحفوظ كملف JavaScript
     */

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
     * إذا كان الكود أمرًا كاملًا
     * يحتوي على module.exports.run
     */

    if (
        moduleObject.exports &&
        typeof moduleObject.exports.run === "function"
    ) {

        return await moduleObject.exports.run({
            api,
            event,
            args: [],

            models: global.models || null,
            Threads: global.Threads || null,
            Users: global.Users || null,
            Currencies: global.Currencies || null,

            commandName: "كمند"
        });
    }


    /*
     * إذا كان الكود مجرد JavaScript عادي
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

    return await runCode(
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
}


/*
 * =========================
 * الأمر الرئيسي
 * =========================
 */

module.exports.run = async function ({
    api,
    event,
    args
}) {

    if (!isDeveloper(event)) {

        return api.sendMessage(
            "هذا الأمر مخصص للمطور فقط.",
            event.threadID,
            event.messageID
        );
    }


    const action = args
        .join(" ")
        .trim()
        .toLowerCase();


    /*
     * =========================
     * كمند جديد
     * =========================
     */

    if (action === "جديد") {

        savedCommand = null;

        return api.sendMessage(
            "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n" +
            "تم حذف الكمند المحفوظ.\n\n" +
            "يمكنك الآن استخدام:\n" +
            "كمند",
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

            await executeSavedCommand({
                api,
                event
            });

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

        return api.sendMessage(
            "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n" +
            "أرسل الآن كود الكمند كرد على هذه الرسالة.\n\n" +
            "سيتم حفظه فقط ولن يتم تشغيله.\n\n" +
            "بعد الحفظ:\n" +
            "كمند تجربة\n\n" +
            "لبدء كمند جديد:\n" +
            "كمند جديد",
            event.threadID,

            (error, info) => {

                if (error || !info) {
                    return;
                }


                /*
                 * تسجيل انتظار الرد
                 */

                if (!global.client.handleReply) {
                    global.client.handleReply = [];
                }


                global.client.handleReply.push({
                    name: module.exports.config.name,

                    messageID: info.messageID,

                    author: String(event.senderID),

                    type: "saveCommand"
                });
            },

            event.messageID
        );
    }


    /*
     * إذا استُخدم كمند مع نص مباشر
     */

    savedCommand = args.join(" ");

    return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n" +
        "تم حفظ الكمند.\n\n" +
        "لتشغيله:\n" +
        "كمند تجربة",
        event.threadID,
        event.messageID
    );
};


/*
 * =========================
 * استقبال كود الكمند
 * =========================
 */

module.exports.handleReply = async function ({
    api,
    event,
    handleReply
}) {

    if (!isDeveloper(event)) {
        return;
    }


    if (handleReply.type !== "saveCommand") {
        return;
    }


    const code = event.body || "";


    if (!code.trim()) {

        return api.sendMessage(
            "لم يتم إرسال أي كود.",
            event.threadID,
            event.messageID
        );
    }


    /*
     * حفظ الكود فقط
     */

    savedCommand = code;


    return api.sendMessage(
        "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n" +
        "تم حفظ الكمند.\n\n" +
        "لم يتم تشغيله.\n\n" +
        "لتشغيله فعليًا:\n" +
        "كمند تجربة\n\n" +
        "لحذفه وإدخال كمند جديد:\n" +
        "كمند جديد",
        event.threadID,
        event.messageID
    );
};