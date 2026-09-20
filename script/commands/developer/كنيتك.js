/**
 * كنيتك.js
 *
 * .كنيتك <الاسم>
 *
 * تغيير اسم البوت في المجموعة الحالية
 * متاح للمطور فقط
 */

module.exports.config = {
    name: "كنيتك",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "تغيير اسم البوت في المجموعة",
    commandCategory: "developer",
    usages: "كنيتك <الاسم>",
    cooldowns: 3
};

// ==================================================
// HINA
// ==================================================

const HEADER =
    "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n";

// ==================================================
// التحقق من المطور
// ==================================================

function isDeveloper(senderID) {

    const id = String(senderID);

    const developers = [];

    // المطورين الموجودين في config
    if (global.config?.ADMINBOT) {

        if (Array.isArray(global.config.ADMINBOT)) {

            developers.push(
                ...global.config.ADMINBOT.map(String)
            );

        } else {

            developers.push(
                String(global.config.ADMINBOT)
            );
        }
    }

    // fallback للمطور الأساسي
    developers.push("61578581225040");

    return developers.includes(id);
}

// ==================================================
// تنفيذ الأمر
// ==================================================

module.exports.run = async function ({
    api,
    event,
    args
}) {

    try {

        const senderID =
            String(event.senderID || "");

        // ==================================================
        // حماية المطور
        // ==================================================

        if (!isDeveloper(senderID)) {

            return api.sendMessage(
                HEADER +
                "هذا الأمر متاح للمطور فقط.",
                event.threadID,
                event.messageID
            );
        }

        // ==================================================
        // التحقق من الاسم
        // ==================================================

        const nickname =
            Array.isArray(args)
                ? args.join(" ").trim()
                : "";

        if (!nickname) {

            return api.sendMessage(
                HEADER +
                "استخدم الأمر بهذا الشكل:\n\n" +
                ".كنيتك الاسم",
                event.threadID,
                event.messageID
            );
        }

        // ==================================================
        // الحد الأقصى للاسم
        // ==================================================

        if (nickname.length > 100) {

            return api.sendMessage(
                HEADER +
                "الاسم طويل جدًا.\n" +
                "الحد الأقصى 100 حرف.",
                event.threadID,
                event.messageID
            );
        }

        // ==================================================
        // الحصول على ID البوت
        // ==================================================

        const botID =
            String(
                api.getCurrentUserID()
            );

        // ==================================================
        // تغيير الاسم
        // ==================================================

        await new Promise((resolve, reject) => {

            api.changeNickname(
                nickname,
                event.threadID,
                botID,
                (error) => {

                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                }
            );

        });

        // ==================================================
        // نجاح
        // ==================================================

        return api.sendMessage(
            HEADER +
            `تم تغيير كنيتي إلى:\n\n${nickname}`,
            event.threadID,
            event.messageID
        );

    } catch (error) {

        console.error(
            "[كنيتك ERROR]:",
            error
        );

        return api.sendMessage(
            HEADER +
            "تعذر تغيير الكنية.\n\n" +
            (
                error?.errorDescription ||
                error?.message ||
                "حدث خطأ غير معروف"
            ),
            event.threadID,
            event.messageID
        );
    }
};