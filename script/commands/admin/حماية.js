const path = require("path");

module.exports.config = {
    name: "حماية",
    version: "3.0.0",
    credits: "أبو هريرة",
    description: "إدارة نظام حماية المجموعة",
    commandCategory: "admin",
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
⌬ ━━ HINA ADMIN ━━ ⌬

        نظام حماية المجموعة

1 ـ حماية اسم المجموعة : ${status("groupName")}
2 ـ حماية الكنيات : ${status("nicknames")}
3 ـ حماية السمة : ${status("theme")}
4 ـ حماية صورة المجموعة : ${status("image")}
5 ـ حماية الإيموجي : ${status("emoji")}
6 ـ حماية الكل

بعد الانتهاء تفاعل بأي شيء على هذه الرسالة لحفظ الإعدادات
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

function isAdmin({ event, info }) {

    const senderID =
        String(
            event.senderID || ""
        );

    const adminIDs =
        getAdminIDs(info);

    if (
        adminIDs.includes(senderID)
    ) {
        return true;
    }

    const developers =
        Array.isArray(
            global.config.ADMINBOT
        )
            ? global.config.ADMINBOT.map(String)
            : [];

    return developers.includes(senderID);
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

    if (
        typeof info.nicknames === "object" &&
        !Array.isArray(info.nicknames)
    ) {

        for (
            const [uid, nickname]
            of Object.entries(info.nicknames)
        ) {

            result[String(uid)] =
                nickname || "";
        }

        return result;
    }

    if (
        Array.isArray(info.nicknames)
    ) {

        for (
            const item of info.nicknames
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

            result[String(uid)] =
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
        info.theme ||
        info.themeColor ||
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
// حفظ القيم الحالية عند التفعيل
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


    // اسم المجموعة

    if (
        protection.enabled.groupName &&
        !previous.groupName
    ) {

        const name =
            info.threadName ||
            info.name ||
            "";

        if (name) {
            protection.saved.name = name;
        }
    }


    // السمة

    if (
        protection.enabled.theme &&
        !previous.theme
    ) {

        const theme =
            extractTheme(info);

        if (theme) {
            protection.saved.theme = theme;
        }
    }


    // الإيموجي

    if (
        protection.enabled.emoji &&
        !previous.emoji
    ) {

        const emoji =
            extractEmoji(info);

        if (emoji) {
            protection.saved.emoji = emoji;
        }
    }


    // الصورة

    if (
        protection.enabled.image &&
        !previous.image
    ) {

        const image =
            extractImage(info);

        if (image) {
            protection.saved.image = image;
        }
    }


    // الكنيات

    if (
        protection.enabled.nicknames &&
        !previous.nicknames
    ) {

        protection.saved.nicknames =
            extractNicknames(info);
    }
}


// ============================================================
// تشغيل الأمر
// ============================================================

module.exports.run = async function ({
    api,
    event,
    models
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


    if (
        !isAdmin({
            event,
            info
        })
    ) {

        return api.sendMessage(
            "هذا الأمر متاح لأدمن المجموعة فقط",
            threadID
        );
    }


    const Protection =
        getProtectionController({
            models
        });


    const protection =
        await Protection.getProtection(
            threadID
        );


    const message =
        await api.sendMessage(
            buildMenu(protection),
            threadID
        );


    if (
        !message ||
        !message.messageID
    ) {
        return;
    }


    // ========================================================
    // جلسة التحكم
    // ========================================================

    const session = {

        name:
            module.exports.config.name,

        messageID:
            String(message.messageID),

        author:
            String(event.senderID),

        type:
            "protection",

        protection,

        previous: {

            groupName:
                Boolean(protection.enabled.groupName),

            nicknames:
                Boolean(protection.enabled.nicknames),

            theme:
                Boolean(protection.enabled.theme),

            image:
                Boolean(protection.enabled.image),

            emoji:
                Boolean(protection.enabled.emoji)
        }
    };


    // ========================================================
    // استقبال الأرقام
    // ========================================================

    global.client.handleReply.push(
        session
    );


    // ========================================================
    // استقبال الـ Reaction
    // ========================================================

    if (
        !Array.isArray(
            global.client.handleReaction
        )
    ) {

        global.client.handleReaction = [];
    }

    global.client.handleReaction.push(
        session
    );
};


// ============================================================
// استقبال الأرقام
// ============================================================

module.exports.handleReply = async function ({
    api,
    event,
    models,
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


    // فقط صاحب القائمة

    if (
        String(handleReply.author) !==
        senderID
    ) {
        return;
    }


    const answer =
        String(
            event.body || ""
        ).trim();


    if (
        !/^[1-6]$/.test(answer)
    ) {

        return api.sendMessage(
            "أرسل رقمًا من 1 إلى 6",
            threadID
        );
    }


    const Protection =
        getProtectionController({
            models
        });


    let protection =
        handleReply.protection ||
        await Protection.getProtection(
            threadID
        );


    const previous =
        handleReply.previous || {

            groupName:
                Boolean(protection.enabled.groupName),

            nicknames:
                Boolean(protection.enabled.nicknames),

            theme:
                Boolean(protection.enabled.theme),

            image:
                Boolean(protection.enabled.image),

            emoji:
                Boolean(protection.enabled.emoji)
        };


    // ========================================================
    // حماية الكل
    // ========================================================

    if (answer === "6") {

        protection =
            await Protection.enableAll(
                threadID
            );

    }


    // ========================================================
    // حماية منفردة
    // ========================================================

    else {

        const keys = {

            "1": "groupName",
            "2": "nicknames",
            "3": "theme",
            "4": "image",
            "5": "emoji"

        };

        const key =
            keys[answer];

        if (!key) {
            return;
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


    // ========================================================
    // حفظ القيم المرجعية في الجلسة فقط
    // ========================================================

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


    // مهم جدًا
    // لا نحفظ في قاعدة البيانات هنا
    // الحفظ النهائي يحصل عند الـ Reaction

    handleReply.protection =
        protection;


    // ========================================================
    // تحديث القائمة
    // ========================================================

    const menu =
        buildMenu(protection);


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


// ============================================================
// استقبال الـ Reaction = حفظ
// ============================================================

module.exports.handleReaction = async function ({
    api,
    event,
    models,
    handleReaction
}) {

    const threadID =
        String(
            event.threadID || ""
        );

    const senderID =
        String(
            event.userID ||
            event.senderID ||
            ""
        );


    // ========================================================
    // فقط صاحب القائمة
    // ========================================================

    if (
        String(handleReaction.author) !==
        senderID
    ) {
        return;
    }


    // ========================================================
    // التأكد أن التفاعل على رسالة القائمة نفسها
    // ========================================================

    const messageID =
        String(
            event.messageID ||
            ""
        );

    if (
        messageID &&
        messageID !==
        String(handleReaction.messageID)
    ) {
        return;
    }


    const Protection =
        getProtectionController({
            models
        });


    const protection =
        handleReaction.protection;


    if (!protection) {
        return;
    }


    // ========================================================
    // الحفظ النهائي
    // ========================================================

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


    // ========================================================
    // إزالة جلسة Reply
    // ========================================================

    if (
        Array.isArray(
            global.client.handleReply
        )
    ) {

        global.client.handleReply =
            global.client.handleReply.filter(
                item =>
                    String(item.messageID) !==
                    String(handleReaction.messageID)
            );
    }


    // ========================================================
    // إزالة جلسة Reaction
    // ========================================================

    if (
        Array.isArray(
            global.client.handleReaction
        )
    ) {

        global.client.handleReaction =
            global.client.handleReaction.filter(
                item =>
                    String(item.messageID) !==
                    String(handleReaction.messageID)
            );
    }


    // ========================================================
    // تأكيد الحفظ
    // ========================================================

    try {

        if (
            typeof api.setMessageReaction ===
            "function"
        ) {

            await api.setMessageReaction(
                "🛡️",
                String(
                    handleReaction.messageID
                ),
                () => {},
                true
            );
        }

    } catch (error) {

        console.error(
            "[PROTECTION] reaction confirmation:",
            error
        );
    }
};