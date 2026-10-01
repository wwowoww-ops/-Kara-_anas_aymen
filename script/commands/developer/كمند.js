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
    version: "2.1.0",
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

    return admins.includes(
        String(event.senderID)
    );
}


/*
 * =========================
 * تنفيذ الكود المحفوظ
 * =========================
 */

async function executeSavedCommand({
    api,
    event,
    args = []
}) {

    if (!savedCommand || !savedCommand.trim()) {
        throw new Error("لا يوجد كمند محفوظ.");
    }

    const AsyncFunction =
        Object.getPrototypeOf(
            async function () {}
        ).constructor;


    /*
     * =========================
     * إنشاء Module حقيقي
     * =========================
     */

    const moduleObject = {
        exports: {}
    };

    const exportsObject =
        moduleObject.exports;


    /*
     * =========================
     * تنفيذ ملف الأمر
     * =========================
     *
     * يتم تمرير module و exports
     * حتى يعمل:
     *
     * module.exports.config
     * module.exports.run
     * module.exports.handleReply
     */

    const executeModule =
        new AsyncFunction(
            "module",
            "exports",
            "require",
            "__dirname",
            "__filename",
            "api",
            "event",
            "args",
            "models",
            "Threads",
            "Users",
            "Currencies",
            "global",
            "config",
            "process",

            savedCommand
        );


    await executeModule(
        moduleObject,
        exportsObject,

        require,
        __dirname,
        __filename,

        api,
        event,
        args,

        global.models || null,
        global.Threads || null,
        global.Users || null,
        global.Currencies || null,

        global,
        global.config,

        process
    );


    /*
     * =========================
     * تشغيل module.exports.run
     * =========================
     */

    if (
        moduleObject.exports &&
        typeof moduleObject.exports.run === "function"
    ) {

        return await moduleObject.exports.run({
            api,
            event,
            args,

            models:
                global.models || null,

            Threads:
                global.Threads || null,

            Users:
                global.Users || null,

            Currencies:
                global.Currencies || null,

            commandName: "كمند"
        });
    }


    /*
     * =========================
     * إذا لم يكن هناك run
     * =========================
     *
     * لا نعيد تنفيذ الكود مرة ثانية.
     */

    return moduleObject.exports;
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


    const action =
        args
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
                event,
                args: []
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

                if (!global.client.handleReply) {
                    global.client.handleReply = [];
                }

                global.client.handleReply.push({
                    name:
                        module.exports.config.name,

                    messageID:
                        info.messageID,

                    author:
                        String(event.senderID),

                    type:
                        "saveCommand"
                });
            },

            event.messageID
        );
    }


    /*
     * =========================
     * كمند مع كود مباشر
     * =========================
     */

    savedCommand =
        args.join(" ");


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


    if (
        !handleReply ||
        handleReply.type !== "saveCommand"
    ) {
        return;
    }


    const code =
        event.body || "";


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

    savedCommand =
        code;


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