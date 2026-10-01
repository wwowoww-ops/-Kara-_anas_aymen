/**
 * HINA — بطاقة الهوية
 * نظام تفاعلي خطوة بخطوة
 *
 * لا يحتاج قاعدة بيانات
 */

const axios = require("axios");
const Jimp = require("jimp");
const fs = require("fs");
const path = require("path");

const sessions = new Map();

module.exports.config = {
    name: "هوية",
    version: "1.0.1",
    credits: "أبو هريرة",
    description: "إنشاء بطاقة هوية تفاعلية",
    commandCategory: "utility",
    usages: "هوية",
    cooldowns: 5
};

const HINA_HEADER = "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬";

// ============================================================
// الألوان
// ============================================================

const COLORS = {
    "1": {
        name: "بنفسجي",
        bg: 0x24113FFF,
        main: 0x9B59B6FF,
        light: 0xD8B4FEFF
    },

    "2": {
        name: "أزرق",
        bg: 0x10243DFF,
        main: 0x3498DBFF,
        light: 0x93C5FDFF
    },

    "3": {
        name: "أحمر",
        bg: 0x351313FF,
        main: 0xE74C3CFF,
        light: 0xFCA5A5FF
    },

    "4": {
        name: "أخضر",
        bg: 0x12301FFF,
        main: 0x2ECC71FF,
        light: 0x86EFACFF
    },

    "5": {
        name: "ذهبي",
        bg: 0x30240DFF,
        main: 0xD4AF37FF,
        light: 0xFDE68AFF
    },

    "6": {
        name: "أسود",
        bg: 0x111111FF,
        main: 0x777777FF,
        light: 0xD4D4D4FF
    }
};

const GENDERS = {
    "1": "ذكر",
    "2": "أنثى"
};

// ============================================================
// الملفات المؤقتة
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

function getReplyText(event) {
    return String(
        event.body ||
        event.messageReply?.body ||
        ""
    ).trim();
}

function isSkip(text) {
    return [
        "تخطي",
        "تخطى",
        "skip",
        "لا",
        "-"
    ].includes(
        text.toLowerCase()
    );
}

function addReply(event, step, messageID) {

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
// الحصول على صورة المستخدم
// ============================================================

async function getProfileImage(api, userID) {

    try {
        const info = await api.getUserInfo(
            String(userID)
        );

        const user = info?.[String(userID)];

        if (
            user?.profileUrl &&
            typeof user.profileUrl === "string"
        ) {
            return user.profileUrl;
        }
    } catch (error) {}

    return null;
}

// ============================================================
// تحميل الصورة
// ============================================================

async function downloadImage(url, filePath) {

    const response = await axios.get(
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
// تجهيز الصورة
// ============================================================

async function prepareProfileImage(
    imagePath,
    outputPath
) {

    const image =
        await Jimp.read(imagePath);

    const size =
        Math.min(
            image.bitmap.width,
            image.bitmap.height
        );

    image.crop(
        (image.bitmap.width - size) / 2,
        (image.bitmap.height - size) / 2,
        size,
        size
    );

    image.resize(
        500,
        500
    );

    await image.writeAsync(
        outputPath
    );

    return outputPath;
}

// ============================================================
// إنشاء البطاقة
// ============================================================

async function createIdentityCard(data) {

    const color =
        COLORS[data.color] || COLORS["1"];

    const width = 1200;
    const height = 720;

    const card =
        new Jimp(
            width,
            height,
            color.bg
        );

    const fontTitle =
        await Jimp.loadFont(
            Jimp.FONT_SANS_64_WHITE
        );

    const fontBig =
        await Jimp.loadFont(
            Jimp.FONT_SANS_32_WHITE
        );

    const fontSmall =
        await Jimp.loadFont(
            Jimp.FONT_SANS_24_WHITE
        );

    const fontTiny =
        await Jimp.loadFont(
            Jimp.FONT_SANS_16_WHITE
        );

    // ========================================================
    // HINA
    // ========================================================

    card.print(
        fontSmall,
        45,
        35,
        "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬"
    );

    card.print(
        fontTitle,
        45,
        80,
        "IDENTITY"
    );

    // ========================================================
    // الخط العلوي
    // ========================================================

    const header =
        new Jimp(
            width,
            4,
            color.main
        );

    card.composite(
        header,
        0,
        155
    );

    // ========================================================
    // الصورة
    // ========================================================

    const profile =
        await Jimp.read(
            data.profilePath
        );

    profile.resize(
        390,
        390
    );

    const imageFrame =
        new Jimp(
            410,
            410,
            color.main
        );

    card.composite(
        imageFrame,
        45,
        190
    );

    card.composite(
        profile,
        55,
        200
    );

    // ========================================================
    // البيانات
    // ========================================================

    const infoX = 500;

    card.print(
        fontSmall,
        infoX,
        190,
        "NAME"
    );

    card.print(
        fontBig,
        infoX,
        225,
        data.name
    );

    card.print(
        fontSmall,
        infoX,
        295,
        "GENDER"
    );

    card.print(
        fontBig,
        infoX,
        330,
        data.gender
    );

    card.print(
        fontSmall,
        infoX,
        400,
        "NICKNAME"
    );

    card.print(
        fontBig,
        infoX,
        435,
        data.nickname || "بدون لقب"
    );

    card.print(
        fontSmall,
        infoX,
        505,
        "USER ID"
    );

    card.print(
        fontSmall,
        infoX,
        540,
        String(data.userID)
    );

    // ========================================================
    // أسفل البطاقة
    // ========================================================

    const bottom =
        new Jimp(
            width,
            55,
            color.main
        );

    card.composite(
        bottom,
        0,
        height - 55
    );

    card.print(
        fontTiny,
        45,
        height - 38,
        `ISSUED: ${data.date}`
    );

    card.print(
        fontTiny,
        850,
        height - 38,
        data.cardID
    );

    const outputPath =
        path.join(
            TEMP_DIR,
            `identity_${data.userID}_${Date.now()}.png`
        );

    await card.writeAsync(
        outputPath
    );

    return outputPath;
}

// ============================================================
// رقم البطاقة
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
// الأمر
// ============================================================

module.exports.run = async function ({
    api,
    event
}) {

    const userID =
        String(event.senderID);

    const session = {
        userID,
        step: "photo"
    };

    sessions.set(
        userID,
        session
    );

    const message =
`${HINA_HEADER}

بطاقة الهوية

سنقوم بإنشاء بطاقة هويتك خطوة بخطوة.

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
// الردود
// ============================================================

module.exports.handleReply = async function ({
    api,
    event,
    handleReply
}) {

    const userID =
        String(event.senderID);

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

    const step =
        handleReply.step;

    // ========================================================
    // الصورة
    // ========================================================

    if (step === "photo") {

        const attachments =
            event.attachments || [];

        const image =
            attachments.find(
                item =>
                    item.type === "photo" &&
                    item.url
            );

        if (!image) {

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
                    `raw_${userID}_${Date.now()}.jpg`
                );

            const profilePath =
                path.join(
                    TEMP_DIR,
                    `profile_${userID}_${Date.now()}.jpg`
                );

            await downloadImage(
                image.url,
                rawPath
            );

            await prepareProfileImage(
                rawPath,
                profilePath
            );

            session.profilePath =
                profilePath;

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
                "IDENTITY PHOTO ERROR:",
                error
            );

            return api.sendMessage(
                `${HINA_HEADER}

حدث خطأ أثناء معالجة الصورة.
حاول إرسال صورة أخرى.`,
                event.threadID
            );
        }

        return;
    }

    // ========================================================
    // الاسم
    // ========================================================

    if (step === "name") {

        const name =
            getReplyText(event);

        if (!name) {

            return api.sendMessage(
                `${HINA_HEADER}

اكتب الاسم الذي تريد وضعه
في الهوية.`,
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

    if (step === "color") {

        const choice =
            getReplyText(event);

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

    if (step === "gender") {

        const choice =
            getReplyText(event);

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

تم تسجيل الجنس: ${session.gender}

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
    // اللقب
    // ========================================================

    if (step === "nickname") {

        const text =
            getReplyText(event);

        session.nickname =
            isSkip(text)
                ? ""
                : text.substring(0, 35);

        sessions.delete(
            userID
        );

        try {

            await api.sendMessage(
`${HINA_HEADER}

جاري تجهيز بطاقة هويتك...`,
                event.threadID
            );

            const cardID =
                generateCardID();

            const date =
                new Date()
                    .toLocaleDateString(
                        "fr-FR",
                        {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit"
                        }
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

تم إصدار بطاقة هويتك بنجاح.

رقم البطاقة: ${cardID}`,
                    attachment:
                        fs.createReadStream(
                            cardPath
                        )
                },
                event.threadID
            );

            setTimeout(() => {

                try {

                    if (
                        fs.existsSync(
                            cardPath
                        )
                    ) {
                        fs.unlinkSync(
                            cardPath
                        );
                    }

                    if (
                        session.profilePath &&
                        fs.existsSync(
                            session.profilePath
                        )
                    ) {
                        fs.unlinkSync(
                            session.profilePath
                        );
                    }

                } catch (error) {}

            }, 30000);

        } catch (error) {

            console.error(
                "IDENTITY CARD ERROR:",
                error
            );

            await api.sendMessage(
`${HINA_HEADER}

حدث خطأ أثناء إنشاء بطاقة الهوية.`,
                event.threadID
            );
        }

        return;
    }
};
