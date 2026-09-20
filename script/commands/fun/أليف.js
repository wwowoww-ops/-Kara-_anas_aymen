/**
 * أليف.js
 *
 * .أليف
 * يحول صورة بروفايل المستخدم إلى Petpet GIF
 *
 * .أليف بالرد على رسالة
 * يستخدم صورة صاحب الرسالة
 */

const axios = require("axios");
const Jimp = require("jimp");
const petPetGif = require("pet-pet-gif");

module.exports.config = {
    name: "أليف",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "تحويل صورة البروفايل إلى GIF Petpet",
    commandCategory: "fun",
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

    const info = await api.getUserInfo(userID);

    if (!info) {
        throw new Error(
            "تعذر الحصول على معلومات المستخدم."
        );
    }

    return info[userID] || info;
}

// ==================================================
// تحميل الصورة وتحويلها إلى PNG مربع
// ==================================================

async function prepareAvatar(url) {

    const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 15000,
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36"
        }
    });

    if (
        !response.data ||
        !Buffer.isBuffer(response.data) &&
        !(response.data instanceof ArrayBuffer)
    ) {
        throw new Error(
            "لم يتم تحميل صورة البروفايل بشكل صحيح."
        );
    }

    const inputBuffer =
        Buffer.from(response.data);

    if (!inputBuffer.length) {
        throw new Error(
            "صورة البروفايل فارغة."
        );
    }

    // قراءة الصورة بواسطة Jimp
    const image =
        await Jimp.read(inputBuffer);

    if (!image.bitmap.width || !image.bitmap.height) {
        throw new Error(
            "أبعاد صورة البروفايل غير صالحة."
        );
    }

    // أخذ الجزء الأوسط وتحويل الصورة إلى مربع
    const size =
        Math.min(
            image.bitmap.width,
            image.bitmap.height
        );

    const x =
        Math.floor(
            (image.bitmap.width - size) / 2
        );

    const y =
        Math.floor(
            (image.bitmap.height - size) / 2
        );

    image.crop(
        x,
        y,
        size,
        size
    );

    // الحجم المطلوب للمكتبة
    image.resize(
        128,
        128
    );

    // تحويلها إلى PNG
    const avatarBuffer =
        await image.getBufferAsync(
            Jimp.MIME_PNG
        );

    if (!avatarBuffer || !avatarBuffer.length) {
        throw new Error(
            "فشل تجهيز صورة البروفايل."
        );
    }

    return avatarBuffer;
}

// ==================================================
// إنشاء Petpet
// ==================================================

async function createPetpet(avatarBuffer) {

    /*
     * pet-pet-gif يقبل Buffer للصورة
     * بعد تجهيزها كمربع PNG.
     */

    const gif =
        await petPetGif(
            avatarBuffer,
            {
                resolution: 128,
                delay: 30,
                backgroundColor: null
            }
        );

    if (!gif || !gif.length) {
        throw new Error(
            "المكتبة لم تُرجع GIF صالحًا."
        );
    }

    return gif;
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

        console.log(
            "[ALIF] Target:",
            targetID
        );

        console.log(
            "[ALIF] Avatar URL:",
            avatarURL
        );

        // ==================================================
        // تجهيز الصورة
        // ==================================================

        const avatarBuffer =
            await prepareAvatar(
                avatarURL
            );

        console.log(
            "[ALIF] Avatar prepared:",
            avatarBuffer.length,
            "bytes"
        );

        // ==================================================
        // إنشاء GIF
        // ==================================================

        const gif =
            await createPetpet(
                avatarBuffer
            );

        console.log(
            "[ALIF] GIF created:",
            gif.length,
            "bytes"
        );

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
            "========================================"
        );

        console.error(
            "[ALIF ERROR]"
        );

        console.error(
            error
        );

        console.error(
            "========================================"
        );

        return api.sendMessage(
            HEADER +
            "حدث خطأ أثناء إنشاء الـPetpet.\n\n" +
            (
                error &&
                error.message
                    ? error.message
                    : "خطأ غير معروف"
            ),
            event.threadID,
            event.messageID
        );
    }
};

ملاحظة مهمة: بعد التعديل جرّب ".أليف" مرة واحدة. إذا فشل، لا نحتاج تخمين السبب؛ الـconsole سيعطينا الآن الخطأ الفعلي من "axios" أو "Jimp" أو "pet-pet-gif".

وتوثيق "pet-pet-gif" نفسه يوضح أن الاستخدام الأساسي هو تمرير الـavatar ثم الحصول على Buffer للـGIF، مع خيارات "resolution" و"delay" و"backgroundColor".

إذا ظهر خطأ جديد في الـconsole، أرسله لي كما هو وسأصلح المرحلة المحددة بدل تغيير الأمر عشوائيًا.