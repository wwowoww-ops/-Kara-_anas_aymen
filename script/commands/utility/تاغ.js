/**
 * تاغ.js
 * منشن جميع أعضاء المجموعة أو أعضاء يبدأ اسمهم بحرف معين
 */

const HINA_HEADER =
    "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n";

module.exports.config = {
    name: "تاغ",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "منشن لجميع أعضاء المجموعة أو حسب أول حرف",
    commandCategory: "utility",
    usages: "تاغ [الحرف]",
    cooldowns: 5
};

// ==================================================
// تنظيف الاسم
// ==================================================

function cleanName(name) {

    return String(name || "")
        .trim()
        .replace(/\s+/g, " ");

}

// ==================================================
// الحصول على أول حرف فعلي
// ==================================================

function getFirstCharacter(name) {

    const clean =
        cleanName(name);

    if (!clean) {
        return "";
    }

    // إزالة بعض الرموز الموجودة قبل الاسم
    const withoutSymbols =
        clean.replace(
            /^[^A-Za-z\u0600-\u06FF\u0750-\u077F]+/,
            ""
        );

    return (
        withoutSymbols[0] ||
        clean[0] ||
        ""
    ).toLocaleLowerCase("ar");

}

// ==================================================
// تقسيم الأعضاء
// ==================================================

function chunkArray(array, size) {

    const result = [];

    for (
        let i = 0;
        i < array.length;
        i += size
    ) {

        result.push(
            array.slice(
                i,
                i + size
            )
        );

    }

    return result;
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

    try {

        // ==========================================
        // جلب معلومات المجموعة
        // ==========================================

        const threadInfo =
            await api.getThreadInfo(
                threadID
            );

        if (
            !threadInfo ||
            !Array.isArray(
                threadInfo.participantIDs
            )
        ) {

            return api.sendMessage(
                HINA_HEADER +
                "تعذر الحصول على أعضاء المجموعة.",
                threadID,
                event.messageID
            );

        }

        const participantIDs =
            threadInfo.participantIDs;

        // ==========================================
        // جلب معلومات الأعضاء
        // ==========================================

        let users = [];

        try {

            const userInfo =
                await api.getUserInfo(
                    participantIDs
                );

            users =
                Object.keys(
                    userInfo || {}
                ).map(
                    id => ({
                        id,
                        name:
                            userInfo[id]?.name ||
                            ""
                    })
                );

        } catch (error) {

            console.log(
                "[TAG] getUserInfo error:",
                error.message
            );

            return api.sendMessage(
                HINA_HEADER +
                "تعذر الحصول على أسماء أعضاء المجموعة.",
                threadID,
                event.messageID
            );

        }

        // ==========================================
        // تحديد الحرف
        // ==========================================

        const letter =
            args &&
            args[0]
                ? String(args[0])
                    .trim()
                    .charAt(0)
                    .toLocaleLowerCase("ar")
                : "";

        // ==========================================
        // فلترة الأعضاء
        // ==========================================

        let selectedUsers;

        if (letter) {

            selectedUsers =
                users.filter(
                    user =>
                        getFirstCharacter(
                            user.name
                        ) === letter
                );

        } else {

            selectedUsers =
                users;
        }

        // ==========================================
        // لا يوجد أعضاء
        // ==========================================

        if (
            selectedUsers.length === 0
        ) {

            return api.sendMessage(
                HINA_HEADER +

                `لم أجد أي عضو يبدأ اسمه بحرف ${letter}`,

                threadID,
                event.messageID
            );

        }

        // ==========================================
        // تقسيم القائمة
        // ==========================================

        /*
         * Messenger لديه حد عملي لعدد المنشنات
         * وطول الرسالة.
         *
         * نقسمهم إلى مجموعات.
         */

        const chunks =
            chunkArray(
                selectedUsers,
                30
            );

        for (
            let index = 0;
            index < chunks.length;
            index++
        ) {

            const chunk =
                chunks[index];

            let body =
                HINA_HEADER;

            if (letter) {

                body +=
                    `منشن الأعضاء الذين يبدأ اسمهم بحرف ${letter}\n\n`;

            } else {

                body +=
                    "منشن جميع أعضاء المجموعة\n\n";

            }

            const mentions = [];

            let offset = body.length;

            for (
                const user of chunk
            ) {

                const name =
                    cleanName(
                        user.name
                    ) ||
                    "عضو";

                const text =
                    `@${name} `;

                body += text;

                mentions.push({

                    tag:
                        `@${name}`,

                    id:
                        user.id,

                    fromIndex:
                        offset,

                    fromIndexEnd:
                        offset +
                        text.length -
                        1

                });

                offset +=
                    text.length;
            }

            // ======================================
            // إرسال الرسالة
            // ======================================

            await new Promise(
                resolve => {

                    api.sendMessage(
                        {
                            body,
                            mentions
                        },

                        threadID,

                        () => resolve(),

                        event.messageID
                    );

                }
            );

            // ======================================
            // تأخير بسيط بين الرسائل
            // ======================================

            if (
                index <
                chunks.length - 1
            ) {

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            1000
                        )
                );

            }

        }

    } catch (error) {

        console.error(
            "[TAG ERROR]",
            error
        );

        return api.sendMessage(

            HINA_HEADER +

            "حدث خطأ أثناء تنفيذ أمر التاغ.\n\n" +

            (
                error.message ||
                "خطأ غير معروف"
            ),

            threadID,
            event.messageID
        );

    }

};