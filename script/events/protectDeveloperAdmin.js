module.exports.config = {
    name: "protectDeveloperAdmin",
    eventType: ["log:thread-admins"],
    version: "1.1.0",
    credits: "أبو هريرة",
    description: "منع إزالة صلاحية الأدمن من المطور",
    category: "events"
};

const DEVELOPER_ID = "100080215660819";

module.exports.handleEvent = async function ({
    api,
    event
}) {

    try {

        if (!event) return;

        const threadID =
            String(event.threadID || "");

        if (!threadID) return;

        const data =
            event.logMessageData || {};

        /*
         * مهم:
         * لا نقوم بأي شيء عند إضافة المطور
         * أو عند دخوله للمجموعة.
         *
         * نتحقق فقط من عملية إزالة الأدمن.
         */

        const removedAdmin =
            data.removedParticipants ||
            data.removedAdmins ||
            data.removedAdmin ||
            [];

        const removedIDs = [];

        if (Array.isArray(removedAdmin)) {

            for (const user of removedAdmin) {

                const id =
                    String(
                        user.userFbId ||
                        user.userID ||
                        user.id ||
                        ""
                    );

                if (id) {
                    removedIDs.push(id);
                }
            }

        } else if (removedAdmin) {

            const id =
                String(
                    removedAdmin.userFbId ||
                    removedAdmin.userID ||
                    removedAdmin.id ||
                    removedAdmin ||
                    ""
                );

            if (id) {
                removedIDs.push(id);
            }
        }

        /*
         * بعض نسخ FCA ترسل userID مباشرة
         * عند تغيير صلاحيات الأدمن.
         */

        if (data.userID) {
            removedIDs.push(
                String(data.userID)
            );
        }

        if (data.targetID) {
            removedIDs.push(
                String(data.targetID)
            );
        }

        /*
         * لا يوجد أي دليل على إزالة أدمن
         */
        if (!removedIDs.includes(DEVELOPER_ID)) {
            return;
        }

        /*
         * نتأكد أن المطور كان هو المستهدف
         * بعملية إزالة الأدمن.
         */

        if (
            typeof api.changeAdminStatus !==
            "function"
        ) {

            console.error(
                "[PROTECT] api.changeAdminStatus غير متوفر"
            );

            return;
        }

        /*
         * إعادة الأدمن فقط بعد إزالة الصلاحية
         */

        await api.changeAdminStatus(
            threadID,
            DEVELOPER_ID,
            true
        );

        console.log(
            `[PROTECT] تمت إعادة أدمن المطور في المجموعة ${threadID}`
        );

    } catch (error) {

        console.error(
            "❌ DEVELOPER ADMIN PROTECTION ERROR:",
            error
        );

    }

};