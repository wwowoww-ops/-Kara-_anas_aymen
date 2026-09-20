/**
 * تاغ.js
 *
 * .تاغ
 * منشن جميع أعضاء المجموعة
 *
 * .تاغ م
 * منشن الأعضاء الذين يبدأ اسمهم بحرف م
 */

module.exports.config = {
    name: "تاغ",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "منشن أعضاء المجموعة أو الأعضاء حسب أول حرف من الاسم",
    commandCategory: "utility",
    usages: "تاغ [الحرف]",
    cooldowns: 5
};

// ==================================================
// HINA
// ==================================================

const HEADER =
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
// استخراج أول حرف حقيقي من الاسم
// ==================================================

function getFirstCharacter(name) {

    const value =
        cleanName(name);

    if (!value) {
        return "";
    }

    // نحذف الرموز من بداية الاسم
    const cleaned =
        value.replace(
            /^[^\p{L}\p{N}]+/u,
            ""
        );

    if (!cleaned) {
        return "";
    }

    return cleaned
        .charAt(0)
        .toLocaleLowerCase("ar");
}

// ==================================================
// تنفيذ الأمر
// ==================================================

module.exports.run =
async function ({
    api,
    event,
    args
}) {

    try {

        const threadID =
            String(
                event.threadID || ""
            );

        if (!threadID) {
            return;
        }

        // ==================================================
        // ID البوت
        // ==================================================

        const botID =
            String(
                api.getCurrentUserID()
            );

        // ==================================================
        // الحصول على معلومات المجموعة
        // ==================================================

        const threadInfo =
            await new Promise(
                (resolve, reject) => {

                    api.getThreadInfo(
                        threadID,
                        (error, info) => {

                            if (error) {
                                reject(error);
                                return;
                            }

                            resolve(info);
                        }
                    );

                }
            );

        if (!threadInfo) {

            return api.sendMessage(
                HEADER +
                "تعذر الحصول على معلومات المجموعة.",
                threadID,
                event.messageID
            );
        }

        // ==================================================
        // معلومات الأعضاء
        // ==================================================

        let userInfo =
            Array.isArray(
                threadInfo.userInfo
            )
                ? threadInfo.userInfo
                : [];

        // ==================================================
        // إذا لم توجد userInfo
        // نحاول استخدام participantIDs
        // ==================================================

        if (!userInfo.length) {

            const participantIDs =
                Array.isArray(
                    threadInfo.participantIDs
                )
                    ? threadInfo.participantIDs
                    : [];

            if (!participantIDs.length) {

                return api.sendMessage(
                    HEADER +
                    "لم أتمكن من الحصول على أعضاء المجموعة.",
                    threadID,
                    event.messageID
                );
            }

            // جلب معلومات كل عضو
            userInfo = [];

            for (
                const id
                of participantIDs
            ) {

                const userID =
                    String(id);

                if (
                    !userID ||
                    userID === botID
                ) {
                    continue;
                }

                try {

                    const result =
                        await new Promise(
                            resolve => {

                                api.getUserInfo(
                                    userID,
                                    (
                                        error,
                                        info
                                    ) => {

                                        if (
                                            error ||
                                            !info
                                        ) {
                                            resolve(null);
                                            return;
                                        }

                                        resolve(
                                            info[userID] ||
                                            info
                                        );
                                    }
                                );

                            }
                        );

                    if (result) {
                        userInfo.push(result);
                    }

                } catch (error) {

                    console.error(
                        "[TAG USER ERROR]:",
                        error.message
                    );

                }
            }
        }

        // ==================================================
        // تحويل بيانات الأعضاء
        // ==================================================

        const members = [];

        for (
            const user
            of userInfo
        ) {

            if (!user) {
                continue;
            }

            const userID =
                String(
                    user.id ||
                    user.userFbId ||
                    ""
                );

            const name =
                cleanName(
                    user.name ||
                    user.fullName ||
                    ""
                );

            if (
                !userID ||
                !name ||
                userID === botID
            ) {
                continue;
            }

            members.push({
                id: userID,
                name
            });
        }

        // ==================================================
        // إزالة التكرار
        // ==================================================

        const uniqueMembers = [];

        const usedIDs =
            new Set();

        for (
            const member
            of members
        ) {

            if (
                usedIDs.has(
                    member.id
                )
            ) {
                continue;
            }

            usedIDs.add(
                member.id
            );

            uniqueMembers.push(
                member
            );
        }

        // ==================================================
        // لا يوجد أعضاء
        // ==================================================

        if (!uniqueMembers.length) {

            return api.sendMessage(
                HEADER +
                "لم أتمكن من العثور على أعضاء المجموعة.",
                threadID,
                event.messageID
            );
        }

        // ==================================================
        // تحديد الحرف
        // ==================================================

        let letter = "";

        if (
            Array.isArray(args) &&
            args.length
        ) {

            letter =
                cleanName(
                    args.join(" ")
                );

            letter =
                letter.charAt(0)
                    .toLocaleLowerCase("ar");
        }

        // ==================================================
        // تصفية الأعضاء حسب الحرف
        // ==================================================

        let selected =
            uniqueMembers;

        if (letter) {

            selected =
                uniqueMembers.filter(
                    member =>
                        getFirstCharacter(
                            member.name
                        ) === letter
                );

            if (!selected.length) {

                return api.sendMessage(

                    HEADER +

                    `لم أجد أي عضو يبدأ اسمه بحرف ${letter}.`,

                    threadID,
                    event.messageID
                );
            }
        }

        // ==================================================
        // الحد الأقصى لكل رسالة
        // ==================================================

        const MAX_PER_MESSAGE = 15;

        // ==================================================
        // تقسيم الأعضاء
        // ==================================================

        for (
            let start = 0;
            start < selected.length;
            start += MAX_PER_MESSAGE
        ) {

            const group =
                selected.slice(
                    start,
                    start + MAX_PER_MESSAGE
                );

            const mentions = [];

            const names = [];

            // ==================================================
            // بناء المنشنات
            // ==================================================

            for (
                const member
                of group
            ) {

                mentions.push({
                    tag: member.name,
                    id: member.id
                });

                names.push(
                    `@${member.name}`
                );
            }

            // ==================================================
            // النص
            // ==================================================

            let title;

            if (letter) {

                title =
                    `منشن الأعضاء الذين يبدأ اسمهم بحرف ${letter}`;

            } else {

                title =
                    "منشن جميع أعضاء المجموعة";
            }

            const message =
                HEADER +
                title +
                "\n\n" +
                names.join(" ");

            // ==================================================
            // إرسال
            // ==================================================

            await new Promise(
                resolve => {

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

                            }

                            resolve();
                        },

                        event.messageID
                    );

                }
            );

            // ==================================================
            // تأخير بين الرسائل
            // ==================================================

            if (
                start + MAX_PER_MESSAGE <
                selected.length
            ) {

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            800
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

            HEADER +

            "حدث خطأ أثناء تنفيذ الأمر.\n\n" +
            (
                error.message ||
                "خطأ غير معروف"
            ),

            event.threadID,
            event.messageID
        );
    }
};