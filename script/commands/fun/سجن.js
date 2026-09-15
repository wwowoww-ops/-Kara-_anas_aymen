"use strict";

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const Jimp = require("jimp");

// ==================================================
// إعداد الأمر
// ==================================================

module.exports.config = {
    name: "سجن",
    version: "1.2.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "وضع صورة بروفايل العضو خلف القضبان",
    commandCategory: "fun",
    usages: "سجن",
    cooldowns: 5
};

// ==================================================
// رابط قالب السجن
// ==================================================

const PRISON_TEMPLATE =
    "https://files.catbox.moe/rysh6o.jpg";

// ==================================================
// التهم العشوائية
// ==================================================

const CHARGES = [
    "سرقة القلوب بدون ترخيص",
    "إثارة الفوضى داخل المجموعة",
    "إزعاج أعضاء المجموعة",
    "الضحك بدون تصريح",
    "الهروب من المسؤوليات",
    "التسلل إلى المجموعة",
    "سرقة آخر قطعة بيتزا",
    "نشر الفوضى والعبث",
    "التسبب في ارتفاع ضغط الأدمن",
    "إزعاج البوت بشكل متكرر",
    "التواجد في المكان الخطأ",
    "ارتكاب جرائم الضحك",
    "سرقة النوم من أعضاء المجموعة",
    "إزعاج الأبرياء دون سبب",
    "التصرف بشكل مشبوه",
    "إفساد هدوء المجموعة",
    "ارتكاب جريمة الغياب",
    "التواجد بدون إذن",
    "كثرة الكلام",
    "الاشتباه في كونه مشاغبًا"
];

function getRandomCharge() {
    return CHARGES[
        Math.floor(Math.random() * CHARGES.length)
    ];
}

// ==================================================
// مجلد الملفات المؤقتة
// ==================================================

const TEMP_DIR = path.join(
    __dirname,
    "cache_sجن"
);

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, {
        recursive: true
    });
}

// ==================================================
// تحميل صورة من رابط
// ==================================================

async function downloadImage(url) {

    const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 30000,
        maxContentLength: 15 * 1024 * 1024,
        maxBodyLength: 15 * 1024 * 1024,

        headers: {
            "User-Agent":
                "Mozilla/5.0"
        }
    });

    return Buffer.from(response.data);
}

// ==================================================
// الحصول على معلومات المستخدم
// ==================================================

function getUserInfo(api, userID) {

    return new Promise((resolve, reject) => {

        api.getUserInfo(
            userID,
            (error, data) => {

                if (error) {
                    return reject(error);
                }

                resolve(data);
            }
        );

    });
}

// ==================================================
// استخراج بيانات المستخدم
// ==================================================

function getUserData(userInfo, userID) {

    if (!userInfo) {
        return {};
    }

    return (
        userInfo[userID] ||
        userInfo[String(userID)] ||
        userInfo
    );
}

// ==================================================
// استخراج اسم المستخدم
// ==================================================

function getUserName(userInfo, userID) {

    const info =
        getUserData(
            userInfo,
            userID
        );

    return (
        info.name ||
        info.fullName ||
        "المتهم"
    );
}

// ==================================================
// استخراج صورة البروفايل
// ==================================================

function getProfilePicture(
    userInfo,
    userID
) {

    const info =
        getUserData(
            userInfo,
            userID
        );

    return (
        info.thumbSrc ||
        info.photoUrl ||
        info.profilePic ||
        info.profilePicture ||
        info.imageSrc ||
        null
    );
}

// ==================================================
// تجهيز صورة العضو
// ==================================================

async function prepareProfile(
    profileBuffer,
    width,
    height
) {

    const profile =
        await Jimp.read(
            profileBuffer
        );

    // جعل الصورة تغطي كامل القالب
    profile.cover(
        width,
        height
    );

    return profile;
}

// ==================================================
// تركيب صورة السجن
// ==================================================

async function makePrisonImage(
    profileBuffer,
    templateBuffer,
    outputPath
) {

    // ----------------------------------------------
    // قراءة قالب السجن
    // ----------------------------------------------

    const template =
        await Jimp.read(
            templateBuffer
        );

    const width =
        template.bitmap.width;

    const height =
        template.bitmap.height;

    // ----------------------------------------------
    // تجهيز صورة البروفايل
    // ----------------------------------------------

    const profile =
        await prepareProfile(
            profileBuffer,
            width,
            height
        );

    // ----------------------------------------------
    // وضع صورة العضو كخلفية
    // ----------------------------------------------

    const result =
        profile;

    // ----------------------------------------------
    // وضع قالب القضبان فوق الصورة
    // ----------------------------------------------

    result.composite(
        template,
        0,
        0,
        {
            mode: Jimp.BLEND_SOURCE_OVER,
            opacitySource: 1,
            opacityDest: 1
        }
    );

    // ----------------------------------------------
    // حفظ الصورة
    // ----------------------------------------------

    await result.quality(95)
        .writeAsync(
            outputPath
        );

    return outputPath;
}

// ==================================================
// حذف الملفات المؤقتة
// ==================================================

function safeDelete(filePath) {

    try {

        if (
            filePath &&
            fs.existsSync(filePath)
        ) {

            fs.unlinkSync(filePath);
        }

    } catch (error) {

        console.error(
            "[سجن] فشل حذف الملف:",
            error.message
        );
    }
}

// ==================================================
// إرسال رسالة
// ==================================================

function sendMessage(
    api,
    message,
    threadID
) {

    return new Promise(
        (resolve, reject) => {

            api.sendMessage(
                message,
                threadID,
                (error, info) => {

                    if (error) {
                        return reject(error);
                    }

                    resolve(info);
                }
            );

        }
    );
}

// ==================================================
// تنفيذ الأمر
// ==================================================

module.exports.run = async function ({
    api,
    event
}) {

    const threadID =
        event.threadID;

    // ----------------------------------------------
    // يجب أن يكون الأمر كرد على رسالة
    // ----------------------------------------------

    if (
        !event.messageReply ||
        !event.messageReply.senderID
    ) {

        return sendMessage(
            api,
            "⌬ ━━ HINA FUN ━━ ⌬\n\nرد على رسالة الشخص الذي تريد وضعه في السجن",
            threadID
        );
    }

    const targetID =
        event.messageReply.senderID;

    // ----------------------------------------------
    // الحصول على ID البوت
    // ----------------------------------------------

    let botID = null;

    try {

        if (
            typeof api.getCurrentUserID ===
            "function"
        ) {

            botID =
                api.getCurrentUserID();
        }

    } catch (error) {

        botID = null;
    }

    // ----------------------------------------------
    // منع سجن البوت
    // ----------------------------------------------

    if (
        botID &&
        String(targetID) ===
        String(botID)
    ) {

        return sendMessage(
            api,
            "⌬ ━━ HINA FUN ━━ ⌬\n\nحتى أنا لا أستطيع سجن نفسي",
            threadID
        );
    }

    let outputPath = null;

    try {

        // ------------------------------------------
        // بيانات العضو
        // ------------------------------------------

        const userInfo =
            await getUserInfo(
                api,
                targetID
            );

        const userName =
            getUserName(
                userInfo,
                targetID
            );

        const profileURL =
            getProfilePicture(
                userInfo,
                targetID
            );

        if (!profileURL) {

            return sendMessage(
                api,
                "⌬ ━━ HINA FUN ━━ ⌬\n\nلم أستطع الحصول على صورة بروفايل هذا العضو",
                threadID
            );
        }

        // ------------------------------------------
        // اختيار تهمة عشوائية
        // ------------------------------------------

        const charge =
            getRandomCharge();

        // ------------------------------------------
        // تحميل صورة البروفايل
        // ------------------------------------------

        const profileBuffer =
            await downloadImage(
                profileURL
            );

        // ------------------------------------------
        // تحميل قالب السجن
        // ------------------------------------------

        const templateBuffer =
            await downloadImage(
                PRISON_TEMPLATE
            );

        // ------------------------------------------
        // اسم الملف المؤقت
        // ------------------------------------------

        const randomName =
            `${Date.now()}_${Math.random()
                .toString(36)
                .slice(2)}.jpg`;

        outputPath =
            path.join(
                TEMP_DIR,
                randomName
            );

        // ------------------------------------------
        // تركيب الصورة
        // ------------------------------------------

        await makePrisonImage(
            profileBuffer,
            templateBuffer,
            outputPath
        );

        // ------------------------------------------
        // رسالة النتيجة
        // ------------------------------------------

        const message =
            `⌬ ━━ HINA FUN ━━ ⌬

🚨 تم القبض على: ${userName}

التهمة: ${charge}
الحكم: السجن المؤبد`;

        // ------------------------------------------
        // إرسال الصورة
        // ------------------------------------------

        await new Promise(
            (resolve, reject) => {

                api.sendMessage(
                    {
                        body: message,
                        attachment:
                            fs.createReadStream(
                                outputPath
                            )
                    },
                    threadID,
                    (error, info) => {

                        if (error) {
                            return reject(error);
                        }

                        resolve(info);
                    }
                );

            }
        );

    } catch (error) {

        console.error(
            "[سجن] ERROR:",
            error
        );

        try {

            await sendMessage(
                api,
                "⌬ ━━ HINA FUN ━━ ⌬\n\nحدث خطأ أثناء تجهيز صورة السجن",
                threadID
            );

        } catch (sendError) {

            console.error(
                "[سجن] SEND ERROR:",
                sendError.message
            );
        }

    } finally {

        // ------------------------------------------
        // تنظيف الملف
        // ------------------------------------------

        safeDelete(
            outputPath
        );
    }
};