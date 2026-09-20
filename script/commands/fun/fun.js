/**
 * أليف.js
 *
 * .أليف
 * يحول صورة بروفايل المستخدم إلى Petpet GIF
 *
 * .أليف بالرد على رسالة
 * يستخدم صورة صاحب الرسالة
 */

const petPetGif = require("pet-pet-gif");

module.exports.config = {
    name: "أليف",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "تحويل صورة البروفايل إلى GIF Petpet",
    commandCategory: "Fun",
    usages: "أليف أو الرد على رسالة",
    cooldowns: 5
};

// ==================================================
// HINA
// ==================================================

const HEADER =
    "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n";

// ==================================================
// الحصول على معلومات المستخدم
// ==================================================

async function getUser(api, userID) {

    const info =
        await api.getUserInfo(userID);

    if (!info) {
        throw new Error(
            "تعذر الحصول على معلومات المستخدم."
        );
    }

    return (
        info[userID] ||
        info
    );
}

// ==================================================
// تنفيذ الأمر
// ==================================================

module.exports.run = async function ({
    api,
    event
}) {

    try {

        // ==================================================
        // تحديد الشخص المستهدف
        // ==================================================

        let targetID =
            String(
                event.senderID || ""
            );

        // إذا كان الأمر ردًا على رسالة
        if (
            event.type === "message_reply" &&
            event.messageReply &&
            event.messageReply.senderID
        ) {

            targetID =
                String(
                    event.messageReply.senderID
                );
        }

        if (!targetID) {

            return api.sendMessage(
                HEADER +
                "تعذر تحديد المستخدم.",
                event.threadID,
                event.messageID
            );
        }

        // ==================================================
        // معلومات المستخدم
        // ==================================================

        const user =
            await getUser(
                api,
                targetID
            );

        const userName =
            user.name ||
            "المستخدم";

        // ==================================================
        // الحصول على صورة البروفايل
        // ==================================================

        const avatarURL =
            user.thumbSrc ||
            user.profileUrl ||
            user.imageSrc ||
            user.avatar ||
            null;

        if (!avatarURL) {

            return api.sendMessage(
                HEADER +
                "لم أتمكن من الحصول على صورة بروفايل المستخدم.",
                event.threadID,
                event.messageID
            );
        }

        // ==================================================
        // إنشاء Petpet GIF
        // ==================================================

        const gif =
            await petPetGif(
                avatarURL,
                {
                    resolution: 128,
                    delay: 30,
                    backgroundColor: null
                }
            );

        if (
            !gif ||
            !gif.length
        ) {

            throw new Error(
                "لم يتم إنشاء GIF."
            );
        }

        // ==================================================
        // إرسال GIF
        // ==================================================

        return api.sendMessage(
            {
                body:
                    HEADER +
                    `تم تدليل ${userName}`,
                attachment: gif
            },

            event.threadID,

            (error) => {

                if (error) {

                    console.error(
                        "[ALIF SEND ERROR]:",
                        error
                    );
                }

            },

            event.messageID
        );

    } catch (error) {

        console.error(
            "[ALIF ERROR]:",
            error
        );

        return api.sendMessage(
            HEADER +
            "حدث خطأ أثناء إنشاء الـPetpet.\n\n" +
            (
                error.message ||
                "خطأ غير معروف"
            ),
            event.threadID,
            event.messageID
        );
    }
};