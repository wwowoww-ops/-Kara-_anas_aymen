const path = require("path");

module.exports.config = {
    name: "حماية",
    version: "2.0.0",
    credits: "أبو هريرة",
    description: "إدارة نظام حماية المجموعة",
    commandCategory: "Admin",
    usages: "حماية",
    cooldowns: 5
};


// ============================================================
// Controller الحماية
// ============================================================

function getProtectionController({ models }) {

    return require(
        path.join(
            process.cwd(),
            "includes",
            "controllers",
            "protection.js"
        )
    )({
        models
    });

}


// ============================================================
// أسماء الحمايات
// ============================================================

const protectionNames = {

    groupName: "حماية اسم المجموعة",

    nicknames: "حماية الكنيات",

    theme: "حماية السمة",

    image: "حماية صورة المجموعة",

    emoji: "حماية الإيموجي",

    description: "حماية وصف المجموعة"

};


// ============================================================
// بناء القائمة
// ============================================================

function buildMenu(protection) {

    const enabled =
        protection?.enabled || {};

    const status = key =>
        enabled[key]
            ? "مفعلة"
            : "غير مفعلة";


    return `
╭───〔 ⌬ ━━ HINA ADMIN ━━ ⌬ 〕───╮

        نظام حماية المجموعة

1 ـ ${protectionNames.groupName} : ${status("groupName")}
2 ـ ${protectionNames.nicknames} : ${status("nicknames")}
3 ـ ${protectionNames.theme} : ${status("theme")}
4 ـ ${protectionNames.image} : ${status("image")}
5 ـ ${protectionNames.emoji} : ${status("emoji")}
6 ـ ${protectionNames.description} : ${status("description")}
7 ـ حماية الكل

0 ـ حفظ الإعدادات

╰──────────────────────────────╯

أرسل رقم الحماية التي تريد تفعيلها أو تعطيلها
`;

}


// ============================================================
// جلب معلومات المجموعة
// ============================================================

async function getThreadInfo(api, threadID) {

    return new Promise(resolve => {

        try {

            api.getThreadInfo(
                String(threadID),
                (error, info) => {

                    if (error) {

                        console.error(
                            "[PROTECTION] getThreadInfo:",
                            error.message || error
                        );

                        return resolve(null);

                    }

                    resolve(info || null);

                }
            );

        } catch (error) {

            console.error(
                "[PROTECTION] getThreadInfo exception:",
                error
            );

            resolve(null);

        }

    });

}


// ============================================================
// الحصول على قائمة الأدمن
// ============================================================

function getAdminIDs(info) {

    if (
        !info ||
        !Array.isArray(info.adminIDs)
    ) {

        return [];

    }

    return info.adminIDs
        .map(admin => {

            if (
                admin &&
                typeof admin === "object"
            ) {

                return String(
                    admin.id ||
                    admin.userFbId ||
                    admin.userID ||
                    ""
                );

            }

            return String(admin);

        })
        .filter(Boolean);

}


// ============================================================
// التحقق من الأدمن
// ============================================================

function isAdmin({
    api,
    event,
    info
}) {

    const senderID =
        String(
            event.senderID || ""
        );

    const adminIDs =
        getAdminIDs(info);


    if (
        adminIDs.includes(
            senderID
        )
    ) {

        return true;

    }


    const developers =
        Array.isArray(
            global.config.ADMINBOT
        )
            ? global.config.ADMINBOT.map(String)
            : [];


    return developers.includes(
        senderID
    );

}


// ============================================================
// استخراج الكنيات
// ============================================================

function extractNicknames(info) {

    const result = {};


    if (
        !info ||
        !info.nicknames
    ) {

        return result;

    }


    // بعض نسخ FCA ترجع Object
    if (
        typeof info.nicknames ===
        "object" &&
        !Array.isArray(info.nicknames)
    ) {

        for (
            const [uid, nickname]
            of Object.entries(
                info.nicknames
            )
        ) {

            result[
                String(uid)
            ] =
                nickname || "";

        }

        return result;

    }


    // بعض النسخ قد ترجع Array
    if (
        Array.isArray(
            info.nicknames
        )
    ) {

        for (
            const item
            of info.nicknames
        ) {

            if (
                !item ||
                typeof item !== "object"
            ) {

                continue;

            }

            const uid =
                item.userFbId ||
                item.userID ||
                item.userid ||
                item.user_id ||
                item.id;

            if (!uid) {
                continue;
            }

            result[
                String(uid)
            ] =
                item.nickname || "";

        }

    }


    return result;

}


// ============================================================
// استخراج الصورة
// ============================================================

function extractImage(info) {

    if (!info) {
        return null;
    }

    return (
        info.imageSrc ||
        info.image ||
        info.threadImage ||
        info.thread_image ||
        null
    );

}


// ============================================================
// استخراج السمة
// ============================================================

function extractTheme(info) {

    if (!info) {
        return null;
    }

    return (
        info.color ||
        info.threadColor ||
        info.thread_color ||
        null
    );

}


// ============================================================
// استخراج الإيموجي
// ============================================================

function extractEmoji(info) {

    if (!info) {
        return null;
    }


    if (
        info.emoji &&
        typeof info.emoji === "object"
    ) {

        return (
            info.emoji.emoji ||
            info.emoji.value ||
            null
        );

    }


    return (
        info.emoji ||
        info.threadEmoji ||
        info.thread_emoji ||
        null
    );

}


// ============================================================
// حفظ القيم الحالية
// ============================================================

async function saveCurrentValues({
    api,
    threadID,
    protection,
    previous
}) {

    const info =
        await getThreadInfo(
            api,
            threadID
        );


    if (!info) {
        return;
    }


    // --------------------------------------------------------
    // اسم المجموعة
    // --------------------------------------------------------

    if (
        protection.enabled.groupName &&
        !previous.groupName
    ) {

        const name =
            info.threadName ||
            info.name ||
            "";

        if (name) {

            protection.saved.name =
                name;

        }

    }


    // --------------------------------------------------------
    // السمة
    // --------------------------------------------------------

    if (
        protection.enabled.theme &&
        !previous.theme
    ) {

        const theme =
            extractTheme(info);

        if (theme) {

            protection.saved.theme =
                theme;

        }

    }


    // --------------------------------------------------------
    // الإيموجي
    // --------------------------------------------------------

    if (
        protection.enabled.emoji &&
        !previous.emoji
    ) {

        const emoji =
            extractEmoji(info);

        if (emoji) {

            protection.saved.emoji =
                emoji;

        }

    }


    // --------------------------------------------------------
    // الصورة
    // --------------------------------------------------------

    if (
        protection.enabled.image &&
        !previous.image
    ) {

        const image =
            extractImage(info);

        if (image) {

            protection.saved.image =
                image;

        }

    }


    // --------------------------------------------------------
    // الكنيات
    // --------------------------------------------------------

    if (
        protection.enabled.nicknames &&
        !previous.nicknames
    ) {

        protection.saved.nicknames =
            extractNicknames(info);

    }


    // --------------------------------------------------------
    // الوصف
    // --------------------------------------------------------

    if (
        protection.enabled.description &&
        !previous.description
    ) {

        protection.saved.description =
            info.description ||
            info.threadDescription ||
            "";

    }

}


// ============================================================
// تشغيل الأمر
// ============================================================

module.exports.run = async function ({
    api,
    event,
    models,
    Threads
}) {

    const threadID =
        String(
            event.threadID || ""
        );


    if (!threadID) {

        return api.sendMessage(
            "لا يمكن استخدام نظام الحماية هنا",
            threadID
        );

    }


    // ----------------------------------------------------------
    // معلومات المجموعة
    // ----------------------------------------------------------

    const info =
        await getThreadInfo(
            api,
            threadID
        );


    if (!info) {

        return api.sendMessage(
            "تعذر جلب معلومات المجموعة",
            threadID
        );

    }


    // ----------------------------------------------------------
    // أدمن؟
    // ----------------------------------------------------------

    if (
        !isAdmin({
            api,
            event,
            info
        })
    ) {

        return api.sendMessage(
            "هذا الأمر متاح لأدمن المجموعة فقط",
            threadID
        );

    }


    // ----------------------------------------------------------
    // Controller
    // ----------------------------------------------------------

    const Protection =
        getProtectionController({
            models
        });


    const protection =
        await Protection.getProtection(
            threadID
        );


    // ----------------------------------------------------------
    // إرسال القائمة
    // ----------------------------------------------------------

    const message =
        await api.sendMessage(
            buildMenu(
                protection
            ),
            threadID
        );


    if (
        !message ||
        !message.messageID
    ) {

        return;

    }


    // ----------------------------------------------------------
    // تسجيل Reply
    // ----------------------------------------------------------

    global.client.handleReply.push({

        name:
            module.exports.config.name,

        messageID:
            message.messageID,

        author:
            String(event.senderID),

        type:
            "protection"

    });

};


// ============================================================
// استقبال الرد
// ============================================================

module.exports.handleReply = async function ({
    api,
    event,
    models,
    Threads,
    handleReply
}) {

    const threadID =
        String(
            event.threadID || ""
        );


    const senderID =
        String(
            event.senderID || ""
        );


    // ----------------------------------------------------------
    // صاحب القائمة فقط
    // ----------------------------------------------------------

    if (
        handleReply.author &&
        String(
            handleReply.author
        ) !== senderID
    ) {

        return;

    }


    // ----------------------------------------------------------
    // التحقق من الرقم
    // ----------------------------------------------------------

    const answer =
        String(
            event.body || ""
        ).trim();


    if (
        !/^[0-7]$/.test(
            answer
        )
    ) {

        return api.sendMessage(
            "أرسل رقمًا من 0 إلى 7",
            threadID
        );

    }


    // ----------------------------------------------------------
    // Controller
    // ----------------------------------------------------------

    const Protection =
        getProtectionController({
            models
        });


    // ----------------------------------------------------------
    // الإعدادات الحالية
    // ----------------------------------------------------------

    let protection =
        await Protection.getProtection(
            threadID
        );


    // ----------------------------------------------------------
    // الحالة السابقة
    // ----------------------------------------------------------

    const previous = {

        groupName:
            Boolean(
                protection.enabled.groupName
            ),

        nicknames:
            Boolean(
                protection.enabled.nicknames
            ),

        theme:
            Boolean(
                protection.enabled.theme
            ),

        image:
            Boolean(
                protection.enabled.image
            ),

        emoji:
            Boolean(
                protection.enabled.emoji
            ),

        description:
            Boolean(
                protection.enabled.description
            )

    };


    // ==========================================================
    // حفظ وإنهاء
    // ==========================================================

    if (
        answer === "0"
    ) {

        const saved =
            await Protection.saveProtection(
                threadID,
                protection
            );


        if (!saved) {

            return api.sendMessage(
                "حدث خطأ أثناء حفظ إعدادات الحماية",
                threadID
            );

        }


        // ------------------------------------------------------
        // إزالة HandleReply
        // ------------------------------------------------------

        const index =
            global.client.handleReply.findIndex(
                item =>
                    item.messageID ==
                    handleReply.messageID
            );


        if (
            index !== -1
        ) {

            global.client.handleReply.splice(
                index,
                1
            );

        }


        // ------------------------------------------------------
        // Reaction
        // ------------------------------------------------------

        return api.setMessageReaction(
            "🛡️",
            String(
                handleReply.messageID
            ),
            () => {},
            true
        );

    }


    // ==========================================================
    // حماية الكل
    // ==========================================================

    if (
        answer === "7"
    ) {

        protection =
            await Protection.enableAll(
                threadID
            );

    }


    // ==========================================================
    // حماية منفردة
    // ==========================================================

    else {

        const keys = {

            "1":
                "groupName",

            "2":
                "nicknames",

            "3":
                "theme",

            "4":
                "image",

            "5":
                "emoji",

            "6":
                "description"

        };


        const key =
            keys[answer];


        if (!key) {

            return api.sendMessage(
                "اختيار غير صالح",
                threadID
            );

        }


        protection =
            await Protection.toggle(
                threadID,
                key
            );


        if (!protection) {

            return api.sendMessage(
                "تعذر تغيير إعداد الحماية",
                threadID
            );

        }

    }


    // ==========================================================
    // حفظ القيم الحالية عند التفعيل
    // ==========================================================

    try {

        await saveCurrentValues({
            api,
            threadID,
            protection,
            previous
        });

    } catch (error) {

        console.error(
            "[PROTECTION] saveCurrentValues:",
            error
        );

    }


    // ==========================================================
    // حفظ الإعدادات
    // ==========================================================

    const saved =
        await Protection.saveProtection(
            threadID,
            protection
        );


    if (!saved) {

        return api.sendMessage(
            "تعذر حفظ إعداد الحماية",
            threadID
        );

    }


    // ==========================================================
    // تحديث القائمة
    // ==========================================================

    const menu =
        buildMenu(
            protection
        );


    // ----------------------------------------------------------
    // محاولة تعديل الرسالة
    // ----------------------------------------------------------

    try {

        if (
            typeof api.editMessage ===
            "function"
        ) {

            await api.editMessage(
                menu,
                String(
                    handleReply.messageID
                )
            );

        } else {

            await api.sendMessage(
                menu,
                threadID
            );

        }

    } catch (error) {

        console.error(
            "[PROTECTION] editMessage:",
            error.message || error
        );


        try {

            await api.sendMessage(
                menu,
                threadID
            );

        } catch (e) {}

    }

};