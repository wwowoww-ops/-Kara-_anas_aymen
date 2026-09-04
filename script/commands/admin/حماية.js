const path = require("path");

module.exports.config = {
    name: "حماية",
    version: "1.0.0",
    credits: "أبو هريرة",
    description: "إدارة نظام حماية المجموعة",
    commandCategory: "admin",
    usages: "حماية",
    cooldowns: 5
};


// ============================================================
// تحميل Controller الحماية
// ============================================================

function getProtectionController({ models, api }) {

    return require(
        path.join(
            process.cwd(),
            "includes",
            "controllers",
            "protection.js"
        )
    )({
        models,
        api
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
        protection.enabled || {};


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
// تشغيل الأمر
// ============================================================

module.exports.run = async function ({
    api,
    event,
    models,
    Threads
}) {

    const {
        threadID,
        senderID
    } = event;


    // ----------------------------------------------------------
    // التحقق من وجود المجموعة
    // ----------------------------------------------------------

    if (!threadID) {

        return api.sendMessage(
            "❌ لا يمكن استخدام نظام الحماية هنا",
            threadID
        );

    }


    // ----------------------------------------------------------
    // التحقق من الأدمن
    // ----------------------------------------------------------

    let info;

    try {

        info =
            await Threads.getInfo(
                threadID
            );

    } catch (error) {

        console.error(
            "❌ [Protection] فشل جلب معلومات المجموعة:",
            error
        );

        return api.sendMessage(
            "❌ تعذر جلب معلومات المجموعة",
            threadID
        );

    }


    if (!info) {

        return api.sendMessage(
            "❌ تعذر جلب معلومات المجموعة",
            threadID
        );

    }


    const adminIDs =
        Array.isArray(info.adminIDs)
            ? info.adminIDs.map(
                id => String(
                    typeof id === "object"
                        ? id.id
                        : id
                )
            )
            : [];


    const currentUserID =
        String(
            api.getCurrentUserID()
        );


    const isBotDeveloper =
        Array.isArray(
            global.config.ADMINBOT
        ) &&
        global.config.ADMINBOT
            .map(String)
            .includes(
                String(senderID)
            );


    const isAdmin =
        adminIDs.includes(
            String(senderID)
        );


    if (
        !isAdmin &&
        !isBotDeveloper
    ) {

        return api.sendMessage(
            "❌ هذا الأمر متاح لأدمن المجموعة فقط",
            threadID
        );

    }


    // ----------------------------------------------------------
    // جلب إعدادات الحماية
    // ----------------------------------------------------------

    const Protection =
        getProtectionController({
            models,
            api
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
            buildMenu(protection),
            threadID
        );


    // ----------------------------------------------------------
    // تسجيل الـ Reply
    // ----------------------------------------------------------

    if (
        message &&
        message.messageID
    ) {

        global.client.handleReply.push({

            name: module.exports.config.name,

            messageID: message.messageID,

            author: senderID,

            type: "protection"

        });

    }

};


// ============================================================
// استقبال اختيار الأدمن
// ============================================================

module.exports.handleReply = async function ({
    api,
    event,
    models,
    handleReply
}) {

    const {
        threadID,
        senderID
    } = event;


    // ----------------------------------------------------------
    // السماح لصاحب القائمة فقط
    // ----------------------------------------------------------

    if (
        handleReply.author &&
        String(handleReply.author) !==
        String(senderID)
    ) {

        return;

    }


    const answer =
        String(
            event.body || ""
        ).trim();


    if (!/^[0-7]$/.test(answer)) {

        return api.sendMessage(
            "❌ أرسل رقمًا من 0 إلى 7",
            threadID
        );

    }


    const Protection =
        getProtectionController({
            models,
            api
        });


    // ----------------------------------------------------------
    // جلب الإعدادات الحالية
    // ----------------------------------------------------------

    let protection =
        await Protection.getProtection(
            threadID
        );


    // ----------------------------------------------------------
    // حفظ
    // ----------------------------------------------------------

    if (answer === "0") {

        const saved =
            await Protection.saveProtection(
                threadID,
                protection
            );


        if (!saved) {

            return api.sendMessage(
                "❌ حدث خطأ أثناء حفظ إعدادات الحماية",
                threadID
            );

        }


        // إزالة الـ handleReply
        const index =
            global.client.handleReply.findIndex(
                item =>
                    item.messageID ===
                    handleReply.messageID
            );


        if (index !== -1) {

            global.client.handleReply.splice(
                index,
                1
            );

        }


        // Reaction على رسالة القائمة
        return api.setMessageReaction(
            "🛡️",
            handleReply.messageID,
            () => {},
            true
        );

    }


    // ----------------------------------------------------------
    // حماية الكل
    // ----------------------------------------------------------

    if (answer === "7") {

        protection =
            await Protection.enableAll(
                threadID
            );

    }


    // ----------------------------------------------------------
    // حماية منفردة
    // ----------------------------------------------------------

    else {

        const keys = {

            "1": "groupName",

            "2": "nicknames",

            "3": "theme",

            "4": "image",

            "5": "emoji",

            "6": "description"

        };


        const key =
            keys[answer];


        protection =
            await Protection.toggle(
                threadID,
                key
            );

    }


    // ----------------------------------------------------------
    // تحديث القائمة
    // ----------------------------------------------------------

    await Protection.saveProtection(
        threadID,
        protection
    );


    const menu =
        buildMenu(
            protection
        );


    try {

        await api.editMessage(
            menu,
            handleReply.messageID
        );

    } catch (error) {

        // بعض نسخ FCA لا تدعم editMessage
        await api.sendMessage(
            menu,
            threadID
        );

    }

};