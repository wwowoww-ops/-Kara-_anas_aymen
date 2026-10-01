/**
 * HINA — بطاقة الهوية
 * الإصدار: 2.0.0
 *
 * نظام تفاعلي:
 * هوية
 *   ↓
 * صورة
 *   ↓
 * الاسم
 *   ↓
 * اللون
 *   ↓
 * الجنس
 *   ↓
 * اللقب
 *   ↓
 * البطاقة
 *
 * لا تحتاج قاعدة بيانات
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");

const {
    createCanvas,
    loadImage
} = require("@napi-rs/canvas");

const sessions = new Map();

const HINA_HEADER =
    "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬";

// ============================================================
// إعداد الأمر
// ============================================================

module.exports.config = {
    name: "هوية",
    version: "2.0.0",
    credits: "أبو هريرة",
    description: "إنشاء بطاقة هوية تفاعلية",
    commandCategory: "Utility",
    usages: "هوية",
    cooldowns: 5
};

// ============================================================
// الألوان
// ============================================================

const COLORS = {
    "1": {
        name: "بنفسجي",
        background: "#171020",
        panel: "#24152F",
        main: "#A855F7",
        light: "#E9D5FF",
        text: "#FFFFFF"
    },

    "2": {
        name: "أزرق",
        background: "#0D1726",
        panel: "#13253D",
        main: "#3B82F6",
        light: "#BFDBFE",
        text: "#FFFFFF"
    },

    "3": {
        name: "أحمر",
        background: "#210F12",
        panel: "#35151A",
        main: "#EF4444",
        light: "#FECACA",
        text: "#FFFFFF"
    },

    "4": {
        name: "أخضر",
        background: "#0D1D16",
        panel: "#123326",
        main: "#22C55E",
        light: "#BBF7D0",
        text: "#FFFFFF"
    },

    "5": {
        name: "ذهبي",
        background: "#1F1809",
        panel: "#33270D",
        main: "#D4AF37",
        light: "#FDE68A",
        text: "#FFFFFF"
    },

    "6": {
        name: "أسود",
        background: "#101010",
        panel: "#1C1C1C",
        main: "#777777",
        light: "#D4D4D4",
        text: "#FFFFFF"
    }
};

// ============================================================
// الجنس
// ============================================================

const GENDERS = {
    "1": "ذكر",
    "2": "أنثى"
};

// ============================================================
// مجلد الملفات المؤقتة
// ============================================================

const TEMP_DIR = path.join(
    process.cwd(),
    "cache",
    "identity"
);

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, {
        recursive: true
    });
}

// ============================================================
// أدوات
// ============================================================

function getText(event) {
    return String(
        event.body ||
        ""
    ).trim();
}

function isSkip(text) {
    return [
        "تخطي",
        "تخطى",
        "skip",
        "-",
        "لا"
    ].includes(
        String(text).toLowerCase()
    );
}

function addReply(
    event,
    step,
    messageID
) {

    if (!global.client.handleReply) {
        global.client.handleReply = [];
    }

    global.client.handleReply.push({
        name: module.exports.config.name,
        messageID,
        author: String(event.senderID),
        step
    });
}

// ============================================================
// حذف الملفات القديمة
// ============================================================

function deleteFile(file) {

    try {

        if (
            file &&
            fs.existsSync(file)
        ) {
            fs.unlinkSync(file);
        }

    } catch (error) {}
}

// ============================================================
// تحميل الصورة
// ============================================================

async function downloadImage(
    url,
    filePath
) {

    const response =
        await axios.get(
            url,
            {
                responseType: "arraybuffer",
                timeout: 30000,
                maxRedirects: 5
            }
        );

    fs.writeFileSync(
        filePath,
        response.data
    );

    return filePath;
}

// ============================================================
// الحصول على صورة من رسالة
// ============================================================

function getAttachmentImage(event) {

    const attachments =
        Array.isArray(event.attachments)
            ? event.attachments
            : [];

    return attachments.find(
        attachment => {

            if (!attachment) {
                return false;
            }

            const type =
                String(
                    attachment.type || ""
                ).toLowerCase();

            return (
                (
                    type === "photo" ||
                    type === "image"
                ) &&
                attachment.url
            );
        }
    );
}

// ============================================================
// إنشاء رقم البطاقة
// ============================================================

function generateCardID() {

    return (
        "HINA-" +
        Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase()
    );
}

// ============================================================
// رسم النص العربي
// ============================================================

function drawText(
    ctx,
    text,
    x,
    y,
    font,
    color,
    align = "left"
) {

    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";

    ctx.fillText(
        String(text),
        x,
        y
    );
}

// ============================================================
// قص الصورة بشكل دائري
// ============================================================

async function drawProfileImage(
    ctx,
    imagePath,
    x,
    y,
    size,
    radius
) {

    const image =
        await loadImage(
            imagePath
        );

    ctx.save();

    ctx.beginPath();

    ctx.roundRect(
        x,
        y,
        size,
        size,
        radius
    );

    ctx.clip();

    const imageRatio =
        image.width /
        image.height;

    let drawWidth = size;
    let drawHeight = size;

    if (imageRatio > 1) {
        drawHeight = size;
        drawWidth =
            size * imageRatio;
    } else {
        drawWidth = size;
        drawHeight =
            size / imageRatio;
    }

    const drawX =
        x +
        (size - drawWidth) / 2;

    const drawY =
        y +
        (size - drawHeight) / 2;

    ctx.drawImage(
        image,
        drawX,
        drawY,
        drawWidth,
        drawHeight
    );

    ctx.restore();
}

// ============================================================
// إنشاء بطاقة الهوية
// ============================================================

async function createIdentityCard(
    data
) {

    const color =
        COLORS[data.color] ||
        COLORS["1"];

    const width = 1200;
    const height = 720;

    const canvas =
        createCanvas(
            width,
            height
        );

    const ctx =
        canvas.getContext("2d");

    // ========================================================
    // الخلفية
    // ========================================================

    ctx.fillStyle =
        color.background;

    ctx.fillRect(
        0,
        0,
        width,
        height
    );

    // ========================================================
    // زخرفة خفيفة
    // ========================================================

    ctx.globalAlpha = 0.08;

    ctx.beginPath();

    ctx.arc(
        1080,
        90,
        180,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        color.main;

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
        1050,
        650,
        220,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.globalAlpha = 1;

    // ========================================================
    // شريط HINA
    // ========================================================

    ctx.fillStyle =
        color.panel;

    ctx.beginPath();

    ctx.roundRect(
        30,
        25,
        width - 60,
        105,
        22
    );

    ctx.fill();

    ctx.fillStyle =
        color.main;

    ctx.fillRect(
        30,
        25,
        8,
        105
    );

    drawText(
        ctx,
        "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬",
        65,
        62,
        "bold 30px Arial",
        color.light
    );

    drawText(
        ctx,
        "بطاقة الهوية",
        65,
        103,
        "bold 24px Arial",
        color.text
    );

    // ========================================================
    // البطاقة الداخلية
    // ========================================================

    ctx.fillStyle =
        color.panel;

    ctx.beginPath();

    ctx.roundRect(
        30,
        155,
        width - 60,
        500,
        25
    );

    ctx.fill();

    // ========================================================
    // إطار الصورة
    // ========================================================

    ctx.strokeStyle =
        color.main;

    ctx.lineWidth = 5;

    ctx.beginPath();

    ctx.roundRect(
        65,
        195,
        330,
        330,
        22
    );

    ctx.stroke();

    await drawProfileImage(
        ctx,
        data.profilePath,
        75,
        205,
        310,
        15
    );

    // ========================================================
    // بيانات المستخدم
    // ========================================================

    const x = 455;

    drawText(
        ctx,
        "الاسم",
        x,
        205,
        "bold 21px Arial",
        color.light
    );

    drawText(
        ctx,
        data.name,
        x,
        245,
        "bold 34px Arial",
        color.text
    );

    drawText(
        ctx,
        "الجنس",
        x,
        310,
        "bold 21px Arial",
        color.light
    );

    drawText(
        ctx,
        data.gender,
        x,
        345,
        "bold 28px Arial",
        color.text
    );

    drawText(
        ctx,
        "اللقب",
        x,
        405,
        "bold 21px Arial",
        color.light
    );

    drawText(
        ctx,
        data.nickname || "بدون لقب",
        x,
        440,
        "bold 28px Arial",
        color.text
    );

    // ========================================================
    // UID
    // ========================================================

    drawText(
        ctx,
        "UID",
        x,
        500,
        "bold 18px Arial",
        color.light
    );

    drawText(
        ctx,
        String(data.userID),
        x,
        532,
        "22px Arial",
        color.text
    );

    // ========================================================
    // معلومات البطاقة
    // ========================================================

    ctx.fillStyle =
        color.background;

    ctx.beginPath();

    ctx.roundRect(
        65,
        555,
        width - 130,
        70,
        15
    );

    ctx.fill();

    drawText(
        ctx,
        `اللون: ${color.name}`,
        90,
        590,
        "20px Arial",
        color.light
    );

    drawText(
        ctx,
        `رقم البطاقة: ${data.cardID}`,
        390,
        590,
        "20px Arial",
        color.light
    );

    drawText(
        ctx,
        data.date,
        1080,
        590,
        "20px Arial",
        color.light,
        "right"
    );

    // ========================================================
    // الخط السفلي
    // ========================================================

    ctx.fillStyle =
        color.main;

    ctx.fillRect(
        30,
        680,
        width - 60,
        5
    );

    // ========================================================
    // حفظ الصورة
    // ========================================================

    const outputPath =
        path.join(
            TEMP_DIR,
            `identity_${data.userID}_${Date.now()}.png`
        );

    const buffer =
        canvas.toBuffer(
            "image/png"
        );

    fs.writeFileSync(
        outputPath,
        buffer
    );

    return outputPath;
}

// ============================================================
// الأمر الرئيسي
// ============================================================

module.exports.run = async function ({
    api,
    event
}) {

    const userID =
        String(event.senderID);

    sessions.set(
        userID,
        {
            userID,
            step: "photo"
        }
    );

    const message =
`${HINA_HEADER}

بطاقة الهوية

سنقوم بإنشاء بطاقة هويتك
خطوة بخطوة.

الخطوة 1 من 5

أرسل الصورة التي تريد وضعها
في بطاقة الهوية.`;

    const sent =
        await api.sendMessage(
            message,
            event.threadID
        );

    addReply(
        event,
        "photo",
        sent.messageID
    );
};

// ============================================================
// نظام الرد
// ============================================================

module.exports.handleReply = async function ({
    api,
    event,
    handleReply
}) {

    const userID =
        String(event.senderID);

    // ========================================================
    // حماية الجلسة
    // ========================================================

    if (
        String(handleReply.author) !==
        userID
    ) {
        return;
    }

    const session =
        sessions.get(userID);

    if (!session) {
        return;
    }

    // ========================================================
    // الصورة
    // ========================================================

    if (
        handleReply.step === "photo"
    ) {

        const attachment =
            getAttachmentImage(event);

        if (!attachment) {

            return api.sendMessage(
`${HINA_HEADER}

أرسل صورة أولاً.`,
                event.threadID
            );
        }

        try {

            const rawPath =
                path.join(
                    TEMP_DIR,
                    `raw_${userID}_${Date.now()}`
                );

            await downloadImage(
                attachment.url,
                rawPath
            );

            session.profilePath =
                rawPath;

            session.step =
                "name";

            sessions.set(
                userID,
                session
            );

            const sent =
                await api.sendMessage(
`${HINA_HEADER}

تم استلام الصورة.

الخطوة 2 من 5

ما الاسم الذي تريد ظهوره
في بطاقة الهوية؟`,
                    event.threadID
                );

            addReply(
                event,
                "name",
                sent.messageID
            );

        } catch (error) {

            console.error(
                "❌ IDENTITY IMAGE ERROR:",
                error
            );

            return api.sendMessage(
`${HINA_HEADER}

حدث خطأ أثناء قراءة الصورة.

${error?.message || error}`,
                event.threadID
            );
        }

        return;
    }

    // ========================================================
    // الاسم
    // ========================================================

    if (
        handleReply.step === "name"
    ) {

        const name =
            getText(event);

        if (!name) {

            return api.sendMessage(
`${HINA_HEADER}

اكتب الاسم الذي تريد ظهوره
في بطاقة الهوية.`,
                event.threadID
            );
        }

        session.name =
            name.substring(0, 40);

        session.step =
            "color";

        sessions.set(
            userID,
            session
        );

        const sent =
            await api.sendMessage(
`${HINA_HEADER}

الاسم: ${session.name}

الخطوة 3 من 5

اختر لون بطاقة الهوية:

1. بنفسجي
2. أزرق
3. أحمر
4. أخضر
5. ذهبي
6. أسود

أرسل رقم اللون فقط.`,
                event.threadID
            );

        addReply(
            event,
            "color",
            sent.messageID
        );

        return;
    }

    // ========================================================
    // اللون
    // ========================================================

    if (
        handleReply.step === "color"
    ) {

        const choice =
            getText(event);

        if (!COLORS[choice]) {

            return api.sendMessage(
`${HINA_HEADER}

اختيار غير صحيح.

أرسل رقمًا من 1 إلى 6.`,
                event.threadID
            );
        }

        session.color =
            choice;

        session.step =
            "gender";

        sessions.set(
            userID,
            session
        );

        const sent =
            await api.sendMessage(
`${HINA_HEADER}

تم اختيار اللون:
${COLORS[choice].name}

الخطوة 4 من 5

اختر الجنس:

1. ذكر
2. أنثى

أرسل رقم الاختيار.`,
                event.threadID
            );

        addReply(
            event,
            "gender",
            sent.messageID
        );

        return;
    }

    // ========================================================
    // الجنس
    // ========================================================

    if (
        handleReply.step === "gender"
    ) {

        const choice =
            getText(event);

        if (!GENDERS[choice]) {

            return api.sendMessage(
`${HINA_HEADER}

اختيار غير صحيح.

أرسل 1 أو 2.`,
                event.threadID
            );
        }

        session.gender =
            GENDERS[choice];

        session.step =
            "nickname";

        sessions.set(
            userID,
            session
        );

        const sent =
            await api.sendMessage(
`${HINA_HEADER}

تم تسجيل الجنس:
${session.gender}

الخطوة 5 من 5

اكتب اللقب الذي تريد ظهوره
في البطاقة.

إذا لم ترد لقبًا اكتب:
تخطي`,
                event.threadID
            );

        addReply(
            event,
            "nickname",
            sent.messageID
        );

        return;
    }

    // ========================================================
    // اللقب وإنشاء البطاقة
    // ========================================================

    if (
        handleReply.step === "nickname"
    ) {

        const nickname =
            getText(event);

        session.nickname =
            isSkip(nickname)
                ? ""
                : nickname.substring(
                    0,
                    35
                );

        sessions.delete(
            userID
        );

        try {

            await api.sendMessage(
`${HINA_HEADER}

جاري إنشاء بطاقة الهوية...`,
                event.threadID
            );

            const cardID =
                generateCardID();

            const date =
                new Date()
                    .toLocaleDateString(
                        "ar-TN"
                    );

            const cardPath =
                await createIdentityCard({
                    ...session,
                    cardID,
                    date
                });

            await api.sendMessage(
                {
                    body:
`${HINA_HEADER}

تم إنشاء بطاقة هويتك بنجاح.

رقم البطاقة:
${cardID}`,
                    attachment:
                        fs.createReadStream(
                            cardPath
                        )
                },
                event.threadID
            );

            // حذف الصورة بعد الإرسال
            setTimeout(
                () => {
                    deleteFile(
                        cardPath
                    );

                    deleteFile(
                        session.profilePath
                    );
                },
                30000
            );

        } catch (error) {

            console.error(
                "❌ IDENTITY CARD ERROR:"
            );

            console.error(
                error
            );

            console.error(
                error?.stack
            );

            await api.sendMessage(
`${HINA_HEADER}

حدث خطأ أثناء إنشاء بطاقة الهوية.

الخطأ:
${error?.message || error}`,
                event.threadID
            );
        }

        return;
    }
};