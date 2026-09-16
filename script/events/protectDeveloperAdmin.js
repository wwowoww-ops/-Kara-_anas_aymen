module.exports.config = {
    name: "protectDeveloperAdmin",
    eventType: ["log:thread-admins"],
    version: "2.0.0",
    credits: "أبو هريرة",
    description: "منع إزالة صلاحية الأدمن من المطور",
    category: "events"
};

const DEVELOPER_ID = "100080215660819";

// حفظ حالة المطور في كل مجموعة
const developerAdminState = new Map();

module.exports.handleEvent = async function ({
    api,
    event
}) {

    try {

        if (!event) return;

        const threadID =
            String(event.threadID || "");

        if (!threadID) return;

        /*
         * جلب معلومات المجموعة الحالية
         */
        const threadInfo =
            await api.getThreadInfo(threadID);

        if (!threadInfo) return;

        const adminIDs =
            Array.isArray(threadInfo.adminIDs)
                ? threadInfo.adminIDs
                : [];

        /*
         * هل المطور أدمن حاليًا؟
         */
        const developerIsAdmin =
            adminIDs.some(
                admin =>
                    String(admin.id) ===
                    DEVELOPER_ID
            );

        /*
         * هل لدينا حالة سابقة لهذه المجموعة؟
         */
        const previousState =
            developerAdminState.get(threadID);

        /*
         * أول مرة نرى المجموعة:
         *
         * نسجل الحالة فقط.
         *
         * إذا كان المطور أدمن:
         * نحفظ أنه أدمن.
         *
         * إذا لم يكن أدمن:
         * نحفظ أنه ليس أدمن.
         *
         * ولا نعطيه صلاحية.
         */
        if (previousState === undefined) {

            developerAdminState.set(
                threadID,
                developerIsAdmin
            );

            console.log(
                `[PROTECT] الحالة الأولية للمطور في ${threadID}: ${
                    developerIsAdmin
                        ? "ADMIN"
                        : "NOT ADMIN"
                }`
            );

            return;
        }

        /*
         * المطور كان أدمن سابقًا
         * والآن لم يعد موجودًا في قائمة الأدمن.
         *
         * هذا يعني أن صلاحية الأدمن أزيلت.
         */
        if (
            previousState === true &&
            developerIsAdmin === false
        ) {

            console.log(
                `[PROTECT] تم اكتشاف إزالة أدمن المطور في ${threadID}`
            );

            /*
             * نتأكد أن البوت نفسه أدمن
             */
            const botID =
                String(
                    api.getCurrentUserID()
                );

            const botIsAdmin =
                adminIDs.some(
                    admin =>
                        String(admin.id) ===
                        botID
                );

            if (!botIsAdmin) {

                console.log(
                    `[PROTECT] لا يمكن إعادة المطور لأن البوت ليس أدمن في ${threadID}`
                );

                developerAdminState.set(
                    threadID,
                    false
                );

                return;
            }

            /*
             * إعادة صلاحية الأدمن للمطور
             */
            await api.changeAdminStatus(
                threadID,
                DEVELOPER_ID,
                true
            );

            console.log(
                `[PROTECT] تمت إعادة أدمن المطور في ${threadID}`
            );

            /*
             * نعتبره أدمن مرة أخرى
             */
            developerAdminState.set(
                threadID,
                true
            );

            return;
        }

        /*
         * تحديث الحالة الحالية
         */
        developerAdminState.set(
            threadID,
            developerIsAdmin
        );

    } catch (error) {

        console.error(
            "❌ DEVELOPER ADMIN PROTECTION ERROR:",
            error.message
        );

    }

};