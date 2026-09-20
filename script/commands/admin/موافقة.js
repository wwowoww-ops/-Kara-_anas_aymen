/**
 * موافقة.js
 *
 * .موافقة
 * عرض حالة موافقة الأدمن الحقيقية للمجموعة
 *
 * .موافقة تشغيل
 * محاولة تفعيل موافقة الأدمن
 *
 * .موافقة إيقاف
 * محاولة إيقاف موافقة الأدمن
 */

module.exports.config = {
    name: "موافقة",
    version: "1.1.0",
    hasPermssion: 1,
    credits: "أبو هريرة",
    description: "التحكم في موافقة الأدمن على إضافة الأعضاء",
    commandCategory: "Admin",
    usages: "موافقة | موافقة تشغيل | موافقة إيقاف",
    cooldowns: 3
};

const HEADER =
    "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n";

// ==================================================
// الحصول على معلومات المجموعة
// ==================================================

function getThreadInfo(api, threadID) {

    return new Promise((resolve, reject) => {

        api.getThreadInfo(
            threadID,
            (error, info) => {

                if (error) {
                    return reject(error);
                }

                resolve(info);
            }
        );
    });
}

// ==================================================
// تنفيذ الأمر
// ==================================================

module.exports.run = async function ({
    api,
    event
}) {

    const threadID =
        String(event.threadID || "");

    if (!threadID) {
        return;
    }

    try {

        const body =
            String(event.body || "")
                .trim();

        const args =
            body
                .split(/\s+/)
                .slice(1);

        const action =
            String(args[0] || "")
                .toLowerCase();

        // ==================================================
        // الحصول على الحالة الحقيقية من Facebook
        // ==================================================

        const threadInfo =
            await getThreadInfo(
                api,
                threadID
            );

        console.log(
            "[APPROVAL THREAD INFO]",
            JSON.stringify(
                {
                    threadID,
                    approvalMode:
                        threadInfo &&
                        threadInfo.approvalMode,

                    approvalQueue:
                        threadInfo &&
                        threadInfo.approvalQueue
                },
                null,
                2
            )
        );

        // ==================================================
        // عرض الحالة
        // ==================================================

        if (!action) {

            const approvalMode =
                threadInfo &&
                threadInfo.approvalMode;

            let status;

            if (
                approvalMode === true ||
                approvalMode === 1 ||
                approvalMode === "1"
            ) {

                status =
                    "مفعلة";

            } else if (
                approvalMode === false ||
                approvalMode === 0 ||
                approvalMode === "0"
            ) {

                status =
                    "متوقفة";

            } else {

                status =
                    "غير معروفة";
            }

            return api.sendMessage(

                HEADER +
                "حالة موافقة الأدمن\n\n" +
                `الحالة: ${status}\n\n` +
                `approvalMode: ${String(approvalMode)}`,

                threadID,
                event.messageID
            );
        }

        // ==================================================
        // تشغيل
        // ==================================================

        if (
            action === "تشغيل" ||
            action === "on" ||
            action === "enable"
        ) {

            /*
             * hut-chat-api عندك لا يحتوي حاليًا
             * على changeApprovalMode.
             *
             * لذلك لا نحفظ حالة وهمية ولا نقول
             * إن الميزة اشتغلت بينما Facebook لم يتغير.
             */

            return api.sendMessage(

                HEADER +
                "لا يمكن تفعيلها من النسخة الحالية من API.\n\n" +
                "قراءة الحالة تعمل من Facebook مباشرة لكن API المستخدم حاليًا لا يوفر دالة تغيير approvalMode.",

                threadID,
                event.messageID
            );
        }

        // ==================================================
        // إيقاف
        // ==================================================

        if (
            action === "إيقاف" ||
            action === "off" ||
            action === "disable"
        ) {

            return api.sendMessage(

                HEADER +
                "لا يمكن إيقافها من النسخة الحالية من API.\n\n" +
                "قراءة الحالة تعمل من Facebook مباشرة لكن API المستخدم حاليًا لا يوفر دالة تغيير approvalMode.",

                threadID,
                event.messageID
            );
        }

        // ==================================================
        // استخدام خاطئ
        // ==================================================

        return api.sendMessage(

            HEADER +
            "الاستخدام الصحيح:\n\n" +
            ".موافقة\n" +
            ".موافقة تشغيل\n" +
            ".موافقة إيقاف",

            threadID,
            event.messageID
        );

    } catch (error) {

        console.error(
            "[APPROVAL ERROR]:",
            error
        );

        return api.sendMessage(

            HEADER +
            "حدث خطأ أثناء قراءة حالة الموافقة.\n\n" +
            (
                error &&
                error.message
                    ? error.message
                    : "خطأ غير معروف"
            ),

            threadID,
            event.messageID
        );
    }
};