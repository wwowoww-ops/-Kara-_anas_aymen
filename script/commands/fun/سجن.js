"use strict";

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// ==================================================
// إعداد الأمر
// ==================================================

module.exports.config = {
    name: "سجن",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "وضع صورة بروفايل العضو خلف القضبان",
    commandCategory: "Fun",
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
    "التصرف بشكل مشبوه"
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
// تحميل ملف من رابط
// ==================================================

async function downloadFile(url) {

    const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 30000,
        maxContentLength: 15 * 1024 * 1024,
        maxBodyLength: 15 * 1024 * 1024,

        headers: {
            "User-Agent": "Mozilla/5.0"
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
// استخراج اسم المستخدم
// ==================================================

function getUserName(userInfo, userID) {

    if (!userInfo) {
        return "المتهم";
    }

    const info =
        userInfo[userID] ||
        userInfo[String(userID)] ||
        userInfo;

    return (
        info.name ||
        info.fullName ||
        "المتهم"
    );
}

// ==================================================
// استخراج رابط صورة البروفايل
// ==================================================

function getProfilePicture(userInfo, userID) {

    if (!userInfo) {
        return null;
    }

    const info =
        userInfo[userID] ||
        userInfo[String(userID)] ||
        userInfo;

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
// جعل القضبان فوق الصورة
// ==================================================

async function makePrisonImage(
    profileBuffer,
    templateBuffer,
    outputPath
) {

    const templateMetadata =
        await sharp(templateBuffer)
            .metadata();

    const width =
        templateMetadata.width || 480;

    const height =
        templateMetadata.height || 480;

    // ----------------------------------------------
    // تجهيز صورة البروفايل
    // ----------------------------------------------

    const profileImage =
        await sharp(profileBuffer)
            .resize({
                width,
                height,
                fit: "cover",
                position: "centre"
            })
            .jpeg({
                quality: 95
            })
            .toBuffer();

    // ----------------------------------------------
    // تجهيز قالب القضبان
    // ----------------------------------------------

    const rawTemplate =
        await sharp(templateBuffer)
            .resize(width, height, {
                fit: "fill"
            })
            .ensureAlpha()
            .raw()
            .toBuffer({
                resolveWithObject: true
            });

    const pixels = rawTemplate.data;

    // ----------------------------------------------
    // جعل المناطق البيضاء شفافة
    // ----------------------------------------------

    for (
        let i = 0;
        i < pixels.length;
        i += 4
    ) {

        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        if (
            r > 220 &&
            g > 220 &&
            b > 220
        ) {

            pixels[i + 3] = 0;

        } else {

            pixels[i + 3] = 255;
        }
    }

    // ----------------------------------------------
    // إعادة بناء طبقة القضبان
    // ----------------------------------------------

    const transparentTemplate =
        await sharp(pixels, {
            raw: {
                width,
                height,
                channels: 4
            }
        })
            .png()
            .toBuffer();

    // ----------------------------------------------
    // تركيب الصورة
    // ----------------------------------------------

    await sharp(profileImage)
        .composite([
            {
                input: transparentTemplate,
                top: 0,
                left: 0
            }
        ])
        .jpeg({
            quality: 95
        })
        .toFile(outputPath);

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
            "[سجن] فشل حذف الملف المؤقت:",
            error.message
        );
    }
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
    // التأكد من وجود رد
    // ----------------------------------------------

    if (
        !event.messageReply ||
        !event.messageReply.senderID
    ) {

        return api.sendMessage(
            "⌬ ━━ HINA FUN ━━ ⌬\n\nرد على رسالة الشخص الذي تريد وضعه في السجن",
            threadID
        );
    }

    const targetID =
        event.messageReply.senderID;

    // ----------------------------------------------
    // منع سجن البوت نفسه
    // ----------------------------------------------

    let botID = null;

    try {

        if (
            typeof api.getCurrentUserID === "function"
        ) {

            botID =
                api.getCurrentUserID();
        }

    } catch (error) {

        botID = null;
    }

    if (
        botID &&
        String(targetID) === String(botID)
    ) {

        return api.sendMessage(
            "⌬ ━━ HINA FUN ━━ ⌬\n\nحتى أنا لا أستطيع سجن نفسي",
            threadID
        );
    }

    let profileBuffer;
    let templateBuffer;
    let outputPath = null;

    try {

        // ------------------------------------------
        // الحصول على بيانات المستخدم
        // ------------------------------------------

        const userInfo =
            await getUserInfo(
                api,
                targetID
            );

        const profileURL =
            getProfilePicture(
                userInfo,
                targetID
            );

        if (!profileURL) {

            return api.sendMessage(
                "⌬ ━━ HINA FUN ━━ ⌬\n\nلم أستطع الحصول على صورة بروفايل هذا العضو",
                threadID
            );
        }

        const userName =
            getUserName(
                userInfo,
                targetID
            );

        // ------------------------------------------
        // اختيار التهمة
        // ------------------------------------------

        const charge =
            getRandomCharge();

        // ------------------------------------------
        // تحميل صورة البروفايل
        // ------------------------------------------

        profileBuffer =
            await downloadFile(
                profileURL
            );

        // ------------------------------------------
        // تحميل قالب السجن
        // ------------------------------------------

        templateBuffer =
            await downloadFile(
                PRISON_TEMPLATE
            );

        // ------------------------------------------
        // إنشاء اسم مؤقت
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
        // رسالة HINA
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
                    (error) => {

                        if (error) {
                            return reject(error);
                        }

                        resolve();
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

            await api.sendMessage(
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
        // تنظيف الملف الناتج
        // ------------------------------------------

        safeDelete(outputPath);
    }
};