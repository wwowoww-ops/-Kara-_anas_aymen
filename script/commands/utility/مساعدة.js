const axios = require("axios");

module.exports.config = {
    name: "مساعدة",
    version: "3.0.1",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "عرض جميع أوامر HINA وتفاصيلها",
    commandCategory: "utility",
    usages: "مساعدة [اسم الأمر أو الفئة]",
    cooldowns: 5
};

// ============================================================
// صورة HINA
// ============================================================

const HINA_IMAGE =
    "https://files.catbox.moe/mezb8y.jpg";

// ============================================================
// الزخرفة
// ============================================================

const TOP =
    "╭━━━━━━━━━━━━━━━━╮";

const BOTTOM =
    "╰━━━━━━━━━━━━━━━━╯";

// ============================================================
// أسماء الفئات
// ============================================================

const CATEGORY_NAMES = {

    fun:
        "الـتـرفـيـه",

    admin:
        "الإدارة",

    developer:
        "الـمـطـور",

    games:
        "الألـعـاب",

    media:
        "الـوسـائـط",

    pic:
        "الـصـور",

    utility:
        "الـخـدمات",

    photos:
        "الـصـور",

    cache:
        "الـكـاش"

};

// ============================================================
// ترتيب الفئات
// ============================================================

const CATEGORY_ORDER = [
    "fun",
    "admin",
    "developer",
    "games",
    "media",
    "photos",
    "pic",
    "cache",
    "utility"
];

// ============================================================
// تنظيف النص
// ============================================================

function normalize(text) {

    return String(text || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

}

// ============================================================
// تحويل الأرقام العربية
// ============================================================

function normalizeDigits(text) {

    return String(text || "")
        .replace(
            /[٠-٩]/g,
            digit =>
                String(
                    "٠١٢٣٤٥٦٧٨٩".indexOf(digit)
                )
        );

}

// ============================================================
// الحصول على جميع الأوامر
// ============================================================

function getCommands() {

    if (
        !global.client ||
        !global.client.commands
    ) {

        return [];

    }

    return Array.from(
        global.client.commands.entries()
    )

    .map(
        ([name, command]) => ({

            name:
                String(name || "").trim(),

            command

        })
    )

    .filter(
        item =>
            item.name &&
            item.command &&
            item.command.config
    );

}

// ============================================================
// اسم الفئة
// ============================================================

function getCategoryName(category) {

    const key =
        normalize(category);

    return (
        CATEGORY_NAMES[key] ||
        String(category || "غير محددة")
    );

}

// ============================================================
// تحديد الفئة
// ============================================================

function resolveCategory(input) {

    const value =
        normalize(input);

    const aliases = {

        "fun": "fun",
        "الترفيه": "fun",
        "الـتـرفـيـه": "fun",
        "ترفيه": "fun",

        "admin": "admin",
        "الإدارة": "admin",
        "الادارة": "admin",
        "إدارة": "admin",
        "ادارة": "admin",

        "developer": "developer",
        "المطور": "developer",
        "الـمـطـور": "developer",
        "مطور": "developer",

        "games": "games",
        "الألعاب": "games",
        "الالعاب": "games",
        "الألـعـاب": "games",
        "العاب": "games",
        "ألعاب": "games",

        "media": "media",
        "الوسائط": "media",
        "الـوسـائـط": "media",
        "وسائط": "media",

        "photos": "photos",
        "الصور": "photos",
        "الـصـور": "photos",

        "pic": "pic",
        "صور": "pic",

        "cache": "cache",
        "الكاش": "cache",

        "utility": "utility",
        "الخدمات": "utility",
        "الـخـدمات": "utility",
        "خدمات": "utility"

    };

    return aliases[value] || null;

}

// ============================================================
// تحميل الصورة
// ============================================================

async function getImage() {

    try {

        const response =
            await axios.get(
                HINA_IMAGE,
                {
                    responseType: "stream",
                    timeout: 15000
                }
            );

        return response.data;

    } catch (error) {

        console.error(
            "[HINA HELP] IMAGE ERROR:",
            error.message
        );

        return null;

    }

}

// ============================================================
// إرسال رسالة
// ============================================================

function send(
    api,
    event,
    body,
    image
) {

    if (image) {

        return api.sendMessage(
            {
                body: body,
                attachment: image
            },

            event.threadID,

            event.messageID
        );

    }

    return api.sendMessage(
        body,
        event.threadID,
        event.messageID
    );

}

// ============================================================
// إنشاء قائمة جميع الأوامر
// ============================================================

function createAllCommandsMenu(
    commands,
    prefix
) {

    const grouped = {};

    // ----------------------------------------------------------
    // تجميع الأوامر حسب الفئة
    // ----------------------------------------------------------

    commands.forEach(
        item => {

            const category =
                normalize(
                    item.command.config.commandCategory ||
                    "utility"
                );

            if (
                !grouped[category]
            ) {

                grouped[category] = [];

            }

            grouped[category].push(
                item.name
            );

        }
    );

    let message =
`${TOP}
𝗛𝗜𝗡𝗔          〢       مـسـاعـدة
${BOTTOM}

`;

    let totalShown = 0;

    // ----------------------------------------------------------
    // عرض الفئات بالترتيب
    // ----------------------------------------------------------

    CATEGORY_ORDER.forEach(
        category => {

            if (
                !grouped[category] ||
                !grouped[category].length
            ) {

                return;

            }

            const list =
                grouped[category]
                    .sort(
                        (a, b) =>
                            a.localeCompare(
                                b,
                                "ar"
                            )
                    );

            // تم إصلاح الخطأ هنا
            message +=
`\n✦ ${getCategoryName(category)}
`;

            list.forEach(
                (command, index) => {

                    const symbol =
                        index === list.length - 1
                            ? "╘❯"
                            : "╞❯";

                    message +=
                        `${symbol} ${prefix}${command}\n`;

                    totalShown++;

                }
            );

        }
    );

    // ----------------------------------------------------------
    // أي فئة غير موجودة في الترتيب
    // ----------------------------------------------------------

    Object.keys(grouped)
        .filter(
            category =>
                !CATEGORY_ORDER.includes(
                    category
                )
        )
        .forEach(
            category => {

                const list =
                    grouped[category]
                        .sort(
                            (a, b) =>
                                a.localeCompare(
                                    b,
                                    "ar"
                                )
                        );

                // تم إصلاح الخطأ هنا أيضًا
                message +=
`\n✦ ${getCategoryName(category)}
`;

                list.forEach(
                    (command, index) => {

                        const symbol =
                            index === list.length - 1
                                ? "╘❯"
                                : "╞❯";

                        message +=
                            `${symbol} ${prefix}${command}\n`;

                        totalShown++;

                    }
                );

            }
        );

    // تم إصلاح الخطأ هنا أيضًا
    message +=
`\n${TOP}
عدد الأوامر: ${totalShown}
${BOTTOM}`;

    return message;

}

// ============================================================
// قائمة فئة واحدة
// ============================================================

function createCategoryMenu(
    commands,
    category,
    prefix
) {

    const list =
        commands
            .filter(
                item =>
                    normalize(
                        item.command.config.commandCategory ||
                        "utility"
                    ) ===
                    normalize(category)
            )
            .sort(
                (a, b) =>
                    a.name.localeCompare(
                        b.name,
                        "ar"
                    )
            );

    let message =
`${TOP}
𝗛𝗜𝗡𝗔          〢       ${getCategoryName(category)}
${BOTTOM}

`;

    list.forEach(
        (item, index) => {

            const symbol =
                index === list.length - 1
                    ? "╘❯"
                    : "╞❯";

            message +=
                `${symbol} ${prefix}${item.name}\n`;

        }
    );

    message +=
`\n${TOP}
عدد الأوامر: ${list.length}
${BOTTOM}`;

    return message;

}

// ============================================================
// تفاصيل الأمر
// ============================================================

function createCommandDetails(
    item,
    prefix
) {

    const config =
        item.command.config;

    let permission;

    if (
        config.hasPermssion === 0
    ) {

        permission =
            "الجميع";

    } else if (
        config.hasPermssion === 1
    ) {

        permission =
            "المشرفين";

    } else {

        permission =
            "المطور";

    }

    return `${TOP}
𝗛𝗜𝗡𝗔          〢       مـسـاعـدة
${BOTTOM}

✦ الاسم
${config.name || item.name}

✦ الوصف
${config.description || "لا يوجد وصف"}

✦ الفئة
${getCategoryName(
    config.commandCategory ||
    "utility"
)}

✦ الاستخدام
${prefix}${config.usages || config.name || item.name}

✦ الانتظار
${config.cooldowns || 0} ثانية

✦ الصلاحية
${permission}

✦ المطور
${config.credits || "غير معروف"}

${TOP}
HINA SYSTEM
${BOTTOM}`;

}

// ============================================================
// RUN
// ============================================================

module.exports.run =
async function ({
    api,
    event,
    args
}) {

    try {

        if (!event) {
            return;
        }

        const prefix =
            global.config &&
            global.config.PREFIX
                ? global.config.PREFIX
                : ".";

        const commands =
            getCommands();

        if (!commands.length) {

            return api.sendMessage(
`${TOP}
𝗛𝗜𝗡𝗔          〢       مـسـاعـدة
${BOTTOM}

⚠️ لم يتم العثور على أي أوامر

${BOTTOM}`,
                event.threadID,
                event.messageID
            );

        }

        // ========================================================
        // تحميل الصورة
        // ========================================================

        const image =
            await getImage();

        // ========================================================
        // .مساعدة
        // عرض جميع الأوامر
        // ========================================================

        if (
            !args ||
            !args.length
        ) {

            const message =
                createAllCommandsMenu(
                    commands,
                    prefix
                );

            return send(
                api,
                event,
                message,
                image
            );

        }

        // ========================================================
        // البحث
        // ========================================================

        const input =
            normalize(
                normalizeDigits(
                    args.join(" ")
                )
            );

        // ========================================================
        // البحث عن أمر
        // ========================================================

        const command =
            commands.find(
                item =>
                    normalize(
                        item.name
                    ) === input
            );

        if (command) {

            const message =
                createCommandDetails(
                    command,
                    prefix
                );

            return send(
                api,
                event,
                message,
                image
            );

        }

        // ========================================================
        // البحث عن فئة
        // ========================================================

        let category =
            resolveCategory(input);

        // البحث أيضًا بالاسم الموجود في config
        if (!category) {

            const found =
                commands.find(
                    item =>
                        normalize(
                            item.command.config.commandCategory ||
                            ""
                        ) === input
                );

            if (found) {

                category =
                    normalize(
                        found.command.config.commandCategory
                    );

            }

        }

        if (category) {

            const categoryCommands =
                commands.filter(
                    item =>
                        normalize(
                            item.command.config.commandCategory ||
                            "utility"
                        ) ===
                        normalize(category)
                );

            if (
                categoryCommands.length
            ) {

                const message =
                    createCategoryMenu(
                        commands,
                        category,
                        prefix
                    );

                return send(
                    api,
                    event,
                    message,
                    image
                );

            }

        }

        // ========================================================
        // غير موجود
        // ========================================================

        return send(
            api,
            event,

`${TOP}
𝗛𝗜𝗡𝗔          〢       تنبيه
${BOTTOM}

⚠️ لم أجد الأمر أو الفئة:

「 ${input} 」

✦ استخدم:
${prefix}مساعدة

لعرض جميع الأوامر

✦ أو:
${prefix}مساعدة اسم_الأمر

لعرض تفاصيل أمر محدد

${TOP}
حاول مرة أخرى
${BOTTOM}`,

            image
        );

    } catch (error) {

        console.error(
            "❌ HINA HELP ERROR:",
            error
        );

        return api.sendMessage(
            "❌ حدث خطأ أثناء تشغيل نظام المساعدة",
            event.threadID,
            event.messageID
        );

    }

};