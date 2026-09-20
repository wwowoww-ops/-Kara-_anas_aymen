/**
 * تاغ.js
 *
 * .تاغ
 * منشن لجميع أعضاء المجموعة
 *
 * .تاغ م
 * منشن لكل الأعضاء الذين يبدأ اسمهم بحرف م
 */

module.exports.config = {
    name: "تاغ",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "منشن جميع أعضاء المجموعة أو حسب أول حرف",
    commandCategory: "utility",
    usages: "تاغ [الحرف]",
    cooldowns: 5
};

// ==================================================
// HINA
// ==================================================

const HINA_HEADER =
    "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n";

// ==================================================
// تنظيف الاسم
// ==================================================

function cleanName(name) {

    return String(name || "")
        .replace(/\s+/g, " ")
        .trim();

}

// ==================================================
// أول حرف من الاسم
// ==================================================

function getFirstCharacter(name) {

    const clean =
        cleanName(name);

    if (!clean) {
        return "";
    }

    /*
     * نتجاوز الرموز الموجودة في بداية الاسم
     * مثل:
     * ★ محمد
     * 『محمد』
     * 〆محمد
     */

    const match =
        clean.match(
            /[A-Za-z\u0600-\u06FF\u0750-\u077F]/
        );

    if (!match) {
        return clean.charAt(0);
    }

    return match[0]
        .toLocaleLowerCase("ar");
}

// ==================================================
// تقسيم المصفوفة
// ==================================================

function chunk(array, size) {

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
// إرسال منشن
// ==================================================

function sendMentionMessage(
    api,
    threadID,
    body,
    users,
    replyTo
) {

    return new Promise(
        resolve => {

            const mentions = [];

            const names = [];

            for (
                const user of users
            ) {

                const id =
                    String(
                        user.id || ""
                    );

                const name =
                    cleanName(
                        user.name
                    );

                if (!id || !name) {
                    continue;
                }

                names.push(
                    `@${name}`
                );

                /*
                 * هذه هي نفس صيغة المنشن
                 * المستخدمة في joinNoti عندك
                 */

                mentions.push({
                    tag: name,
                    id
                });
            }

            if (!mentions.length) {

                resolve(false);

                return;
            }

            const message =
                body +
                "\n\n" +
                names.join(" ");

            api.sendMessage(
                {
                    body: message,
                    mentions
                },

                threadID,

                error => {

                    if (error) {

                        console.error(
                            "[TAG SEND ERROR]:",
                            error
                        );

                        resolve(false);

                        return;
                    }

                    resolve(true);
                },

                replyTo
            );

        }
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
        String(
            event.threadID || ""
        );

    if (!threadID) {
        return;
    }

    try {

        // ==========================================
        // معلومات المجموعة
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

        // ==========================================
        // ID البوت
        // ==========================================

        const botID =
            String(
                api.getCurrentUserID()
            );

        // ==========================================
        // IDs الأعضاء
        // ==========================================

        const participantIDs =
            threadInfo.participantIDs
                .map(
                    id => String(id)
                )
                .filter(
                    id =>
                        id &&
                        id !== botID
                );

        if (!participantIDs.length) {

            return api.sendMessage(
                HINA_HEADER +
                "لا يوجد أعضاء لمنشنهم.",
                threadID,
                event.messageID
            );
        }

        // ==========================================
        // جلب أسماء الأعضاء
        // ==========================================

        let userInfo;

        try {

            userInfo =
                await api.getUserInfo(
                    participantIDs
                );

        } catch (error) {

            console.error(
                "[TAG GET USER INFO ERROR]:",
                error
            );

            return api.sendMessage(
                HINA_HEADER +
                "تعذر الحصول على معلومات أعضاء المجموعة.",
                threadID,
                event.messageID
            );
        }

        const users = [];

        for (
            const id of participantIDs
        ) {

            const data =
                userInfo &&
                userInfo[id];

            if (!data) {
                continue;
            }

            const name =
                cleanName(
                    data.name
                );

            if (!name) {
                continue;
            }

            users.push({
                id,
                name
            });
        }

        // ==========================================
        // الحرف
        // ==========================================

        const requestedLetter =
            args &&
            args.length
                ? cleanName(
                    args[0]
                ).charAt(0)
                : "";

        // ==========================================
        // تحديد الأعضاء
        // ==========================================

        let selectedUsers =
            users;

        if (requestedLetter) {

            const letter =
                requestedLetter
                    .toLocaleLowerCase("ar");

            selectedUsers =
                users.filter(
                    user =>
                        getFirstCharacter(
                            user.name
                        ) === letter
                );
        }

        // ==========================================
        // لا توجد نتائج
        // ==========================================

        if (!selectedUsers.length) {

            if (requestedLetter) {

                return api.sendMessage(

                    HINA_HEADER +

                    `لم أجد أي عضو يبدأ اسمه بحرف ${requestedLetter}.`,

                    threadID,
                    event.messageID
                );

            }

            return api.sendMessage(
                HINA_HEADER +
                "لم أجد أعضاء لمنشنهم.",
                threadID,
                event.messageID
            );
        }

        // ==========================================
        // تقسيم المنشنات
        // ==========================================

        /*
         * نقسمها حتى لا تصبح الرسالة ضخمة جدًا.
         */

        const groups =
            chunk(
                selectedUsers,
                20
            );

        for (
            let i = 0;
            i < groups.length;
            i++
        ) {

            const group =
                groups[i];

            let text;

            if (requestedLetter) {

                text =
                    HINA_HEADER +
                    `منشن الأعضاء الذين يبدأ اسمهم بحرف ${requestedLetter}:`;

            } else {

                text =
                    HINA_HEADER +
                    "منشن جميع أعضاء المجموعة:";

            }

            await sendMentionMessage(
                api,
                threadID,
                text,
                group,
                event.messageID
            );

            // تأخير بسيط بين الرسائل
            if (
                i <
                groups.length - 1
            ) {

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            700
                        )
                );
            }
        }

    } catch (error) {

        console.error(
            "❌ TAG ERROR:",
            error
        );

        return api.sendMessage(

            HINA_HEADER +

            "حدث خطأ أثناء تنفيذ التاغ.\n\n" +

            (
                error.message ||
                "خطأ غير معروف"
            ),

            threadID,
            event.messageID
        );
    }
};