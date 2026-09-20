/**
 * ميم.js
 * إنشاء ميم من صورة مع نص عربي
 *
 * الاستخدام:
 *
 * رد على صورة واكتب:
 * ميم هذا النص
 *
 * أو:
 * ميم فوق: النص هنا
 * ميم تحت: النص هنا
 *
 * أو:
 * ميم النص فوق | النص تحت
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
    version: "1.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "إنشاء ميم من صورة مع نص عربي",
    commandCategory: "pic",
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

// ==================================================
// الخطوط
// ==================================================

let fontLoaded = false;

function loadArabicFont() {

    if (fontLoaded) {
        return true;
    }

    const possibleFonts = [

        // Linux / Railway
        "/usr/share/fonts/truetype/noto/NotoSansArabic-Bold.ttf",

        "/usr/share/fonts/opentype/noto/NotoSansArabic-Bold.ttf",

        "/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf",

        // Android / Pydroid / بعض البيئات
        "/system/fonts/NotoNaskhArabic-Regular.ttf",

        "/system/fonts/NotoNaskhArabic-Bold.ttf",

        "/system/fonts/NotoSansArabic-Regular.ttf",

        "/system/fonts/NotoSansArabic-Bold.ttf",

        // ملفات المشروع إن وجدت
        path.join(__dirname, "fonts", "NotoSansArabic-Bold.ttf"),

        path.join(__dirname, "fonts", "NotoSansArabic-Regular.ttf"),

        path.join(
            __dirname,
            "../../fonts/NotoSansArabic-Bold.ttf"
        ),

        path.join(
            __dirname,
            "../../fonts/NotoSansArabic-Regular.ttf"
        )
    ];

    for (const fontPath of possibleFonts) {

        try {

            if (
                fs.existsSync(fontPath)
            ) {

                const registered =
                    GlobalFonts.registerFromPath(
                        fontPath,
                        "HINAMemeArabic"
                    );

                if (registered) {

                    console.log(
                        "[HINA MEME] Arabic font loaded:",
                        fontPath
                    );

                    fontLoaded = true;

                    return true;

                }

            }

        } catch (error) {

            console.error(
                "[HINA MEME] Font error:",
                error.message
            );

        }

    }

    console.log(
        "[HINA MEME] Arabic font not found, using fallback."
    );

    return false;
}

// ==================================================
// إنشاء المجلدات
// ==================================================

function ensureDirectories() {

    fs.ensureDirSync(
        TEMP_DIR
    );

}

// ==================================================
// تنظيف ملف
// ==================================================

function removeFile(filePath) {

    try {

        if (
            filePath &&
            fs.existsSync(filePath)
        ) {

            fs.removeSync(
                filePath
            );

        }

    } catch (error) {

        console.error(
            "[HINA MEME] Cleanup Error:",
            error.message
        );

    }

}

// ==================================================
// تحميل الصورة
// ==================================================

async function downloadImage(url) {

    if (!url) {

        throw new Error(
            "رابط الصورة غير موجود"
        );

    }

    const response =
        await axios.get(
            url,
            {
                responseType:
                    "arraybuffer",

                timeout:
                    60000,

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
            "الصورة التي تم تحميلها فارغة"
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

    if (!text) {
        return "";
    }

    return String(text)
        .replace(/\r/g, "")
        .replace(/\n+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

}

// ==================================================
// عكس النص العربي عند الحاجة
// ==================================================

function prepareArabicText(text) {

    if (!text) {
        return "";
    }

    /*
     * @napi-rs/canvas في أغلب البيئات الحديثة
     * يتعامل مع العربية بشكل صحيح.
     *
     * لذلك لا نعكس الحروف يدويًا حتى لا
     * تظهر العربية بشكل معكوس في البيئات
     * التي تدعم RTL.
     */

    return text;

}

// ==================================================
// قياس النص
// ==================================================

function measureTextWidth(
    ctx,
    text
) {

    return ctx.measureText(
        text
    ).width;

}

// ==================================================
// تقسيم النص إلى أسطر
// ==================================================

function wrapText(
    ctx,
    text,
    maxWidth
) {

    const words =
        text.split(" ");

    const lines = [];

    let currentLine = "";

    for (
        const word of words
    ) {

        const testLine =
            currentLine
                ? currentLine + " " + word
                : word;

        const width =
            measureTextWidth(
                ctx,
                testLine
            );

        if (
            width <= maxWidth
        ) {

            currentLine =
                testLine;

        } else {

            if (currentLine) {

                lines.push(
                    currentLine
                );

            }

            currentLine =
                word;
        }

    }

    if (currentLine) {

        lines.push(
            currentLine
        );

    }

    return lines;

}

// ==================================================
// تصغير حجم الخط حتى يناسب الصورة
// ==================================================

function calculateFontSize(
    ctx,
    text,
    maxWidth,
    startSize
) {

    let size =
        startSize;

    while (
        size > 20
    ) {

        ctx.font =
            `bold ${size}px HINAMemeArabic`;

        const width =
            measureTextWidth(
                ctx,
                text
            );

        if (
            width <= maxWidth
        ) {

            break;

        }

        size -= 2;

    }

    return size;

}

// ==================================================
// رسم نص الميم
// ==================================================

function drawMemeText(
    ctx,
    text,
    x,
    y,
    maxWidth,
    position
) {

    if (!text) {
        return;
    }

    text =
        prepareArabicText(
            text
        );

    // ==============================================
    // حجم الخط
    // ==============================================

    let fontSize =
        Math.max(
            32,
            Math.floor(
                ctx.canvas.width * 0.075
            )
        );

    // لا نجعل الخط ضخمًا جدًا
    fontSize =
        Math.min(
            fontSize,
            90
        );

    ctx.font =
        `bold ${fontSize}px HINAMemeArabic`;

    // ==============================================
    // تقسيم النص
    // ==============================================

    const maxTextWidth =
        maxWidth ||
        ctx.canvas.width * 0.90;

    let lines =
        wrapText(
            ctx,
            text,
            maxTextWidth
        );

    // ==============================================
    // إذا كان السطر طويلًا جدًا
    // ==============================================

    if (
        lines.length === 1 &&
        measureTextWidth(
            ctx,
            lines[0]
        ) > maxTextWidth
    ) {

        fontSize =
            calculateFontSize(
                ctx,
                lines[0],
                maxTextWidth,
                fontSize
            );

        ctx.font =
            `bold ${fontSize}px HINAMemeArabic`;

        lines =
            wrapText(
                ctx,
                text,
                maxTextWidth
            );

    }

    // ==============================================
    // ارتفاع السطر
    // ==============================================

    const lineHeight =
        Math.floor(
            fontSize * 1.25
        );

    const totalHeight =
        lines.length *
        lineHeight;

    // ==============================================
    // موضع البداية
    // ==============================================

    let startY =
        y;

    if (
        position === "bottom"
    ) {

        startY =
            y -
            totalHeight +
            lineHeight;

    }

    // ==============================================
    // إعداد Canvas
    // ==============================================

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.font =
        `bold ${fontSize}px HINAMemeArabic`;

    // Stroke أسود قوي
    ctx.lineJoin =
        "round";

    ctx.lineWidth =
        Math.max(
            4,
            Math.floor(
                fontSize * 0.10
            )
        );

    ctx.strokeStyle =
        "#000000";

    ctx.fillStyle =
        "#ffffff";

    // ==============================================
    // الرسم
    // ==============================================

    lines.forEach(
        (line, index) => {

            const lineY =
                startY +
                index *
                lineHeight;

            // Stroke
            ctx.strokeText(
                line,
                x,
                lineY,
                maxTextWidth
            );

            // النص
            ctx.fillText(
                line,
                x,
                lineY,
                maxTextWidth
            );

        }
    );

}

// ==================================================
// إنشاء الميم
// ==================================================

async function createMeme(
    imageBuffer,
    topText,
    bottomText
) {

    loadArabicFont();

    const image =
        await loadImage(
            imageBuffer
        );

    let width =
        image.width;

    let height =
        image.height;

    // ==============================================
    // الحد الأقصى للصورة
    // ==============================================

    const MAX_WIDTH =
        1600;

    const MAX_HEIGHT =
        1600;

    let scale =
        1;

    if (
        width > MAX_WIDTH
    ) {

        scale =
            MAX_WIDTH /
            width;

    }

    if (
        height * scale >
        MAX_HEIGHT
    ) {

        scale =
            MAX_HEIGHT /
            height;

    }

    if (
        scale < 1
    ) {

        width =
            Math.floor(
                width * scale
            );

        height =
            Math.floor(
                height * scale
            );

    }

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
    // رسم الصورة
    // ==============================================

    ctx.drawImage(
        image,
        0,
        0,
        width,
        height
    );

    // ==============================================
    // النص العلوي
    // ==============================================

    if (topText) {

        drawMemeText(
            ctx,

            topText,

            width / 2,

            height * 0.12,

            width * 0.90,

            "top"
        );

    }

    // ==============================================
    // النص السفلي
    // ==============================================

    if (bottomText) {

        drawMemeText(
            ctx,

            bottomText,

            width / 2,

            height * 0.90,

            width * 0.90,

            "bottom"
        );

    }

    // ==============================================
    // إخراج PNG
    // ==============================================

    return canvas.toBuffer(
        "image/png"
    );

}

// ==================================================
// تحليل الأمر
// ==================================================

function parseMemeText(
    args
) {

    const input =
        Array.isArray(args)
            ? args.join(" ").trim()
            : "";

    if (!input) {

        return {
            top: "",
            bottom: ""
        };

    }

    // ==============================================
    // صيغة:
    // ميم فوق: النص
    // ==============================================

    if (
        input.startsWith("فوق:")
    ) {

        return {

            top:
                cleanText(
                    input
                        .slice(4)
                ),

            bottom:
                ""

        };

    }

    // ==============================================
    // صيغة:
    // ميم تحت: النص
    // ==============================================

    if (
        input.startsWith("تحت:")
    ) {

        return {

            top:
                "",

            bottom:
                cleanText(
                    input
                        .slice(4)
                )

        };

    }

    // ==============================================
    // صيغة:
    // ميم النص | النص
    // ==============================================

    if (
        input.includes("|")
    ) {

        const parts =
            input.split("|");

        return {

            top:
                cleanText(
                    parts[0]
                ),

            bottom:
                cleanText(
                    parts
                        .slice(1)
                        .join("|")
                )

        };

    }

    // ==============================================
    // الوضع الافتراضي:
    // النص في الأعلى
    // ==============================================

    return {

        top:
            cleanText(
                input
            ),

        bottom:
            ""

    };

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
    // التأكد من وجود رد
    // ==============================================

    if (
        !event.messageReply
    ) {

        return api.sendMessage(

            HINA_HEADER +

            "🖼️ إنشاء ميم\n\n" +

            "رد على صورة واكتب:\n\n" +

            "ميم هذا النص\n\n" +

            "أو:\n" +

            "ميم فوق: النص\n" +

            "ميم تحت: النص\n\n" +

            "ولإضافة نصين:\n" +

            "ميم النص فوق | النص تحت",

            threadID,

            event.messageID
        );

    }

    // ==============================================
    // الحصول على المرفقات
    // ==============================================

    const reply =
        event.messageReply;

    const attachments =
        reply.attachments || [];

    const image =
        attachments.find(
            attachment =>
                attachment &&
                attachment.url &&
                (
                    attachment.type === "photo" ||
                    attachment.type === "image" ||
                    !attachment.type
                )
        );

    if (!image) {

        return api.sendMessage(

            HINA_HEADER +

            "❌ الرسالة التي رددت عليها لا تحتوي على صورة.\n\n" +

            "رد على صورة مباشرة ثم اكتب:\n" +

            "ميم النص",

            threadID,

            event.messageID
        );

    }

    // ==============================================
    // تحليل النص
    // ==============================================

    const memeText =
        parseMemeText(
            args
        );

    if (
        !memeText.top &&
        !memeText.bottom
    ) {

        return api.sendMessage(

            HINA_HEADER +

            "❌ اكتب النص الذي تريد وضعه على الميم.\n\n" +

            "مثال:\n" +

            "ميم لما يشتغل البوت أخيرًا",

            threadID,

            event.messageID
        );

    }

    // ==============================================
    // رسالة الانتظار
    // ==============================================

    const waitMessage =
        await api.sendMessage(

            HINA_HEADER +

            "⏳ جاري إنشاء الميم...\n\n" +

            "🖼️ تحميل الصورة...\n" +

            "✏️ إضافة النص...",

            threadID
        );

    let outputPath =
        null;

    try {

        // ==========================================
        // إنشاء المجلد
        // ==========================================

        ensureDirectories();

        // ==========================================
        // تحميل الصورة
        // ==========================================

        console.log(
            "[HINA MEME] Downloading image..."
        );

        const imageBuffer =
            await downloadImage(
                image.url
            );

        console.log(
            "[HINA MEME] Image downloaded:",
            imageBuffer.length,
            "bytes"
        );

        // ==========================================
        // إنشاء الميم
        // ==========================================

        console.log(
            "[HINA MEME] Creating meme..."
        );

        const memeBuffer =
            await createMeme(
                imageBuffer,
                memeText.top,
                memeText.bottom
            );

        if (
            !memeBuffer ||
            memeBuffer.length === 0
        ) {

            throw new Error(
                "فشل إنشاء صورة الميم"
            );

        }

        // ==========================================
        // حفظ مؤقت
        // ==========================================

        outputPath =
            path.join(
                TEMP_DIR,
                `${Date.now()}_meme.png`
            );

        fs.writeFileSync(
            outputPath,
            memeBuffer
        );

        console.log(
            "[HINA MEME] Meme saved:",
            outputPath
        );

        // ==========================================
        // حذف رسالة الانتظار
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

            } catch (error) {

                console.error(
                    "[HINA MEME] Wait message cleanup:",
                    error.message
                );

            }

        }

        // ==========================================
        // إرسال الميم
        // ==========================================

        return api.sendMessage(

            {
                body:
                    HINA_HEADER +
                    "✅ تم إنشاء الميم",

                attachment:
                    fs.createReadStream(
                        outputPath
                    )
            },

            threadID,

            (error) => {

                if (error) {

                    console.error(
                        "[HINA MEME] Send Error:",
                        error
                    );

                } else {

                    console.log(
                        "[HINA MEME] Meme sent successfully."
                    );

                }

                // ==================================
                // تنظيف
                // ==================================

                removeFile(
                    outputPath
                );

            },

            event.messageID
        );

    } catch (error) {

        console.error(
            "================================="
        );

        console.error(
            "[HINA MEME] ERROR"
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "================================="
        );

        // ==========================================
        // حذف رسالة الانتظار
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
        // تنظيف الملف
        // ==========================================

        removeFile(
            outputPath
        );

        let errorMessage =
            error &&
            error.message
                ? error.message
                : "خطأ غير معروف";

        if (
            errorMessage.length >
            1500
        ) {

            errorMessage =
                errorMessage.slice(
                    0,
                    1500
                ) +
                "\n...";

        }

        return api.sendMessage(

            HINA_HEADER +

            "❌ فشل إنشاء الميم\n\n" +

            "الخطأ:\n" +

            errorMessage,

            threadID,

            event.messageID
        );

    }

};