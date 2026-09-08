"use strict";

// ==================================================
// إعدادات أمر الهدوء
// ==================================================

const DEVELOPER_ID = "61578581225040";

// ==================================================
// حفظ حالة الهدوء لكل مجموعة
// ==================================================

if (!global.hinaSilenceMode) {
    global.hinaSilenceMode = new Map();
}

// ==================================================
// التحقق من المطور
// ==================================================

function isDeveloper(userID) {
    return String(userID) === String(DEVELOPER_ID);
}

// ==================================================
// التحقق من المشرف
// ==================================================

async function isAdmin(api, threadID, userID) {

    try {

        const threadInfo =
            await api.getThreadInfo(threadID);

        if (!threadInfo) {
            return false;
        }

        const adminIDs =
            threadInfo.adminIDs || [];

        return adminIDs.some(admin => {

            const id =
                typeof admin === "object"
                    ? admin.id
                    : admin;

            return (
                String(id) ===
                String(userID)
            );

        });

    } catch (error) {

        console.error(
            "[HINA SILENCE ADMIN ERROR]",
            error
        );

        return false;

    }

}

// ==================================================
// الأمر
// ==================================================

module.exports = {

    config: {

        name:
            "هدوء",

        enname:
            "silence",

        version:
            "1.0.0",

        author:
            "HINA UTILITY",

        countDown:
            3,

        role:
            1,

        description:
            "تفعيل وضع الهدوء وطرد من يتكلم باستثناء المطور",

        guide:
            "{pn} | {pn} إيقاف",

        category:
            "Admin",

        usePrefix:
            true,

        aliases: [
            "هدوء",
            "silence"
        ]

    },

    // ==================================================
    // تشغيل الأمر
    // ==================================================

    async run({
        api,
        event,
        args
    }) {

        const threadID =
            event?.threadID;

        const senderID =
            event?.senderID;

        if (
            !threadID ||
            !senderID
        ) {

            return;

        }

        // ==============================================
        // المطور يستطيع التحكم دائمًا
        // ==============================================

        const developer =
            isDeveloper(senderID);

        // ==============================================
        // المشرف يستطيع التحكم
        // ==============================================

        if (!developer) {

            const admin =
                await isAdmin(
                    api,
                    threadID,
                    senderID
                );

            if (!admin) {

                await api.sendMessage(
                    "هذا الأمر للمشرفين فقط.",
                    threadID,
                    event.messageID
                );

                return;

            }

        }

        const action =
            String(
                Array.isArray(args)
                    ? args.join(" ").trim().toLowerCase()
                    : ""
            );

        // ==============================================
        // إيقاف الهدوء
        // ==============================================

        if (
            action === "إيقاف" ||
            action === "ايقاف" ||
            action === "off" ||
            action === "stop"
        ) {

            global.hinaSilenceMode.delete(
                String(threadID)
            );

            await api.sendMessage(
                "تم إيقاف وضع الهدوء.",
                threadID,
                event.messageID
            );

            console.log(
                `[HINA SILENCE] OFF thread=${threadID} by=${senderID}`
            );

            return;

        }

        // ==============================================
        // تفعيل الهدوء
        // ==============================================

        global.hinaSilenceMode.set(
            String(threadID),
            true
        );

        await api.sendMessage(
            "تم تفعيل وضع الهدوء. أي شخص يتكلم سيتم طرده باستثناء المطور.",
            threadID,
            event.messageID
        );

        console.log(
            `[HINA SILENCE] ON thread=${threadID} by=${senderID}`
        );

    },

    // ==================================================
    // مراقبة الرسائل
    // ==================================================

    async handleEvent({
        api,
        event
    }) {

        try {

            const threadID =
                event?.threadID;

            const senderID =
                event?.senderID;

            if (
                !threadID ||
                !senderID
            ) {

                return;

            }

            // ==========================================
            // هل الهدوء مفعل؟
            // ==========================================

            const silenceEnabled =
                global.hinaSilenceMode.get(
                    String(threadID)
                );

            if (!silenceEnabled) {

                return;

            }

            // ==========================================
            // المطور مستثنى
            // UID:
            // 61578581225040
            // ==========================================

            if (
                isDeveloper(senderID)
            ) {

                return;

            }

            // ==========================================
            // تجاهل رسائل البوت نفسه
            // ==========================================

            if (
                event.senderID &&
                global.GoatBot?.botID &&
                String(event.senderID) ===
                    String(global.GoatBot.botID)
            ) {

                return;

            }

            // ==========================================
            // التأكد من وجود وظيفة الطرد
            // ==========================================

            if (
                typeof api.removeUserFromGroup !==
                "function"
            ) {

                console.error(
                    "[HINA SILENCE] api.removeUserFromGroup غير موجود"
                );

                return;

            }

            // ==========================================
            // طرد المستخدم
            // ==========================================

            await api.removeUserFromGroup(

                String(senderID),

                String(threadID)

            );

            console.log(
                `[HINA SILENCE] KICK user=${senderID} thread=${threadID}`
            );

        } catch (error) {

            console.error(
                "[HINA SILENCE ERROR]",
                error
            );

        }

    }

};