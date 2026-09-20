/**
 * ميم.js
 * HINA Meme Generator
 *
 * الاستخدام:
 *
 * رد على صورة:
 *
 * ميم هذا النص
 *        => أعلى الصورة
 *
 * ميم فوق هذا النص
 *        => أعلى الصورة
 *
 * ميم تحت هذا النص
 *        => أسفل الصورة
 *
 * ميم فوق: هذا النص
 *        => أعلى الصورة
 *
 * ميم تحت: هذا النص
 *        => أسفل الصورة
 *
 * ميم فوق هذا | تحت هذا
 *        => نص أعلى + نص أسفل
 */

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const {
    createCanvas,
    loadImage,
    GlobalFonts
} = require("@napi-rs/canvas");

module.exports.config = {
    name: "ميم",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "إنشاء ميم عربي من صورة",
    commandCategory: "Photos",
    usages: "ميم <النص>",
    cooldowns: 5
};

// ==================================================
// HINA
// ==================================================

const HINA_HEADER =
    "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n";

// ==================================================
// المسارات
// ==================================================

const CACHE_DIR =
    path.join(__dirname, "cache");

const TEMP_DIR =
    path.join(CACHE_DIR, "meme");

const FONT_DIR =
    path.join(__dirname, "fonts");

// ==================================================
// الخط
// ==================================================

let fontLoaded = false;

function loadArabicFont() {

    if (fontLoaded) {
        return true;
    }

    const fonts = [

        // ==========================================
        // خط داخل مجلد الأمر
        // ==========================================

        path.join(
            FONT_DIR,
            "NotoSansArabic-Bold.ttf"
        ),

        path.join(
            FONT_DIR,
            "NotoNaskhArabic-Bold.ttf"
        ),

        path.join(
            FONT_DIR,
            "NotoKufiArabic-Bold.ttf"
        ),

        // ==========================================
        // Linux / Railway
        // ==========================================

        "/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf",

        "/usr/share/fonts/opentype/noto/NotoSansArabic-Bold.ttf",

        "/usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf",

        // ==========================================
        // Android
        // ==========================================

        "/system/fonts/NotoSansArabic-Bold.ttf",

        "/system/fonts/NotoNaskhArabic-Bold.ttf",

        "/system/fonts/NotoKufiArabic-Bold.ttf"
    ];

    for (const fontPath of fonts) {

        try {

            if (
                !fs.existsSync(fontPath)
            ) {
                continue;
            }

            const result =
                GlobalFonts.registerFromPath(
                    fontPath,
                    "HINAMemeArabic"
                );

            if (result) {

                console.log(
                    "[HINA MEME] Arabic font:",
                    fontPath
                );

                fontLoaded = true;

                return true;
            }

        } catch (error) {

            console.log(
                "[HINA MEME] Font error:",
                error.message
            );

        }
    }

    console.log(
        "[HINA MEME] WARNING: Arabic font not found."
    );

    return false;
}

// ==================================================
// المجلدات
// ==================================================

function prepareFolders() {

    fs.ensureDirSync(
        CACHE_DIR
    );

    fs.ensureDirSync(
        TEMP_DIR
    );

    fs.ensureDirSync(
        FONT_DIR
    );
}

// ==================================================
// حذف ملف
// ==================================================

function removeFile(file) {

    try {

        if (
            file &&
            fs.existsSync(file)
        ) {

            fs.removeSync(file);
        }

    } catch {}
}

// ==================================================
// تحميل الصورة
// ==================================================

async function downloadImage(url) {

    const response =
        await axios.get(
            url,
            {
                responseType: "arraybuffer",

                timeout: 60000,

                maxContentLength:
                    30 * 1024 * 1024,

                maxBodyLength:
                    30 * 1024 * 1024,

                headers: {
                    "User-Agent":
                        "Mozilla/5.0"
                }
            }
        );

    if (
        !response.data ||
        response.data.length === 0
    ) {

        throw new Error(
            "الصورة فارغة"
        );
    }

    return Buffer.from(
        response.data
    );
}

// ==================================================
// تنظيف النص
// ==================================================

function cleanText(text) {

    return String(
        text || ""
    )
        .replace(/\r/g, "")
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

// ==================================================
// تحليل الأمر
// ==================================================

function parseMemeCommand(args) {

    const input =
        cleanText(
            Array.isArray(args)
                ? args.join(" ")
                : ""
        );

    if (!input) {

        return {
            position: null,
            text: ""
        };
    }

    // ==============================================
    // نصين
    // ==============================================

    if (
        input.includes("|")
    ) {

        const parts =
            input.split("|");

        let top =
            cleanText(parts[0]);

        let bottom =
            cleanText(
                parts
                    .slice(1)
                    .join("|")
            );

        // إزالة كلمة فوق من البداية
        top =
            top
                .replace(/^فوق\s*:?\s*/i, "")
                .trim();

        // إزالة كلمة تحت من البداية
        bottom =
            bottom
                .replace(/^تحت\s*:?\s*/i, "")
                .trim();

        return {
            position: "both",
            top,
            bottom
        };
    }

    // ==============================================
    // فوق:
    // ==============================================

    if (
        /^فوق\s*:/i.test(input)
    ) {

        return {
            position: "top",
            text:
                cleanText(
                    input.replace(
                        /^فوق\s*:\s*/i,
                        ""
                    )
                )
        };
    }

    // ==============================================
    // تحت:
    // ==============================================

    if (
        /^تحت\s*:/i.test(input)
    ) {

        return {
            position: "bottom",
            text:
                cleanText(
                    input.replace(
                        /^تحت\s*:\s*/i,
                        ""
                    )
                )
        };
    }

    // ==============================================
    // فوق النص
    // ==============================================

    if (
        /^فوق\s+/i.test(input)
    ) {

        return {
            position: "top",
            text:
                cleanText(
                    input.replace(
                        /^فوق\s+/i,
                        ""
                    )
                )
        };
    }

    // ==============================================
    // تحت النص
    // ==============================================

    if (
        /^تحت\s+/i.test(input)
    ) {

        return {
            position: "bottom",
            text:
                cleanText(
                    input.replace(
                        /^تحت\s+/i,
                        ""
                    )
                )
        };
    }

    // ==============================================
    // الوضع الافتراضي
    // ==============================================

    return {
        position: "top",
        text: input
    };
}

// ==================================================
// تقسيم النص
// ==================================================

function wrapText(
    ctx,
    text,
    maxWidth
) {

    const words =
        text.split(" ");

    const lines = [];

    let current = "";

    for (
        const word of words
    ) {

        const test =
            current
                ? current + " " + word
                : word;

        const width =
            ctx.measureText(
                test
            ).width;

        if (
            width <= maxWidth
        ) {

            current = test;

        } else {

            if (current) {

                lines.push(
                    current
                );
            }

            current = word;
        }
    }

    if (current) {

        lines.push(
            current
        );
    }

    return lines;
}

// ==================================================
// رسم النص
// ==================================================

function drawArabicText(
    ctx,
    text,
    centerX,
    startY,
    maxWidth,
    position
) {

    if (!text) {
        return;
    }

    let fontSize =
        Math.floor(
            ctx.canvas.width * 0.075
        );

    fontSize =
        Math.max(
            38,
            Math.min(
                fontSize,
                90
            )
        );

    ctx.font =
        `bold ${fontSize}px HINAMemeArabic`;

    let lines =
        wrapText(
            ctx,
            text,
            maxWidth
        );

    // ==============================================
    // تصغير الخط إذا كان النص طويلًا
    // ==============================================

    while (
        lines.length > 4 &&
        fontSize > 28
    ) {

        fontSize -= 2;

        ctx.font =
            `bold ${fontSize}px HINAMemeArabic`;

        lines =
            wrapText(
                ctx,
                text,
                maxWidth
            );
    }

    // ==============================================
    // RTL
    // ==============================================

    try {
        ctx.direction = "rtl";
    } catch {}

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.font =
        `bold ${fontSize}px HINAMemeArabic`;

    // ==============================================
    // Stroke
    // ==============================================

    ctx.lineJoin =
        "round";

    ctx.miterLimit =
        2;

    ctx.lineWidth =
        Math.max(
            5,
            Math.floor(
                fontSize * 0.11
            )
        );

    ctx.strokeStyle =
        "#000000";

    ctx.fillStyle =
        "#ffffff";

    // ==============================================
    // ارتفاع السطر
    // ==============================================

    const lineHeight =
        Math.floor(
            fontSize * 1.2
        );

    // ==============================================
    // أعلى / أسفل
    // ==============================================

    let y =
        startY;

    if (
        position === "bottom"
    ) {

        y =
            startY -
            (lines.length - 1) *
            lineHeight;
    }

    // ==============================================
    // رسم الأسطر
    // ==============================================

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const lineY =
            y +
            i *
            lineHeight;

        // Stroke
        ctx.strokeText(
            lines[i],
            centerX,
            lineY,
            maxWidth
        );

        // Fill
        ctx.fillText(
            lines[i],
            centerX,
            lineY,
            maxWidth
        );
    }
}

// ==================================================
// إنشاء الميم
// ==================================================

async function createMeme(
    buffer,
    topText,
    bottomText
) {

    const image =
        await loadImage(
            buffer
        );

    let width =
        image.width;

    let height =
        image.height;

    // ==============================================
    // تصغير الصور الضخمة
    // ==============================================

    const MAX_SIZE =
        1800;

    const scale =
        Math.min(
            1,
            MAX_SIZE / Math.max(
                width,
                height
            )
        );

    width =
        Math.floor(
            width * scale
        );

    height =
        Math.floor(
            height * scale
        );

    // ==============================================
    // Canvas
    // ==============================================

    const canvas =
        createCanvas(
            width,
            height
        );

    const ctx =
        canvas.getContext(
            "2d"
        );

    // ==============================================
    // الصورة
    // ==============================================

    ctx.drawImage(
        image,
        0,
        0,
        width,
        height
    );

    const maxWidth =
        width * 0.90;

    // ==============================================
    // النص العلوي
    // ==============================================

    if (topText) {

        drawArabicText(
            ctx,

            topText,

            width / 2,

            height * 0.12,

            maxWidth,

            "top"
        );
    }

    // ==============================================
    // النص السفلي
    // ==============================================

    if (bottomText) {

        drawArabicText(
            ctx,

            bottomText,

            width / 2,

            height * 0.90,

            maxWidth,

            "bottom"
        );
    }

    return canvas.toBuffer(
        "image/png"
    );
}

// ==================================================
// الأمر
// ==================================================

module.exports.run =
async function ({
    api,
    event,
    args
}) {

    const threadID =
        event.threadID;

    // ==============================================
    // يجب الرد على صورة
    // ==============================================

    if (
        !event.messageReply
    ) {

        return api.sendMessage(

            HINA_HEADER +

            "طريقة الاستخدام:\n\n" +

            "رد على صورة ثم اكتب:\n\n" +

            "ميم هذا النص\n" +

            "→ النص في الأعلى\n\n" +

            "ميم فوق هذا النص\n" +

            "→ النص في الأعلى\n\n" +

            "ميم تحت هذا النص\n" +

            "→ النص في الأسفل\n\n" +

            "ميم فوق هذا | تحت هذا\n" +

            "→ نص أعلى + نص أسفل",

            threadID,

            event.messageID
        );
    }

    // ==============================================
    // المرفقات
    // ==============================================

    const attachments =
        event.messageReply.attachments || [];

    const image =
        attachments.find(
            item =>
                item &&
                item.url &&
                (
                    item.type === "photo" ||
                    item.type === "image" ||
                    !item.type
                )
        );

    if (!image) {

        return api.sendMessage(

            HINA_HEADER +

            "الرسالة التي رددت عليها ليست صورة",

            threadID,

            event.messageID
        );
    }

    // ==============================================
    // تحليل النص
    // ==============================================

    const parsed =
        parseMemeCommand(
            args
        );

    let topText = "";
    let bottomText = "";

    if (
        parsed.position === "both"
    ) {

        topText =
            parsed.top || "";

        bottomText =
            parsed.bottom || "";

    } else if (
        parsed.position === "bottom"
    ) {

        bottomText =
            parsed.text || "";

    } else {

        topText =
            parsed.text || "";
    }

    if (
        !topText &&
        !bottomText
    ) {

        return api.sendMessage(

            HINA_HEADER +

            "اكتب النص الذي تريد وضعه على الصورة",

            threadID,

            event.messageID
        );
    }

    // ==============================================
    // تجهيز
    // ==============================================

    prepareFolders();

    loadArabicFont();

    let waitMessage = null;
    let outputPath = null;

    try {

        // ==========================================
        // رسالة الانتظار
        // ==========================================

        waitMessage =
            await api.sendMessage(

                HINA_HEADER +
                "جاري إنشاء الميم...",

                threadID
            );

        // ==========================================
        // تحميل الصورة
        // ==========================================

        console.log(
            "[HINA MEME] Downloading..."
        );

        const imageBuffer =
            await downloadImage(
                image.url
            );

        // ==========================================
        // إنشاء الميم
        // ==========================================

        const result =
            await createMeme(
                imageBuffer,
                topText,
                bottomText
            );

        // ==========================================
        // حفظ
        // ==========================================

        outputPath =
            path.join(
                TEMP_DIR,
                `meme_${Date.now()}.png`
            );

        fs.writeFileSync(
            outputPath,
            result
        );

        // ==========================================
        // حذف الانتظار
        // ==========================================

        if (
            waitMessage &&
            waitMessage.messageID
        ) {

            try {

                api.unsendMessage(
                    waitMessage.messageID,
                    () => {}
                );

            } catch {}
        }

        // ==========================================
        // إرسال الصورة
        // ==========================================

        return api.sendMessage(

            {
                body:
                    HINA_HEADER +
                    "تم إنشاء الميم",

                attachment:
                    fs.createReadStream(
                        outputPath
                    )
            },

            threadID,

            () => {

                removeFile(
                    outputPath
                );

            },

            event.messageID
        );

    } catch (error) {

        console.error(
            "[HINA MEME]",
            error
        );

        // ==========================================
        // حذف الانتظار
        // ==========================================

        if (
            waitMessage &&
            waitMessage.messageID
        ) {

            try {

                api.unsendMessage(
                    waitMessage.messageID,
                    () => {}
                );

            } catch {}
        }

        removeFile(
            outputPath
        );

        return api.sendMessage(

            HINA_HEADER +

            "فشل إنشاء الميم\n\n" +

            "الخطأ: " +
            (
                error.message ||
                "خطأ غير معروف"
            ),

            threadID,

            event.messageID
        );
    }
};