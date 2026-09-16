module.exports.config = {
    name: "protectDeveloperAdmin",
    eventType: ["log:thread-admins"],
    version: "1.0.0",
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

        const logMessageData =
            event.logMessageData || {};

        /*
         * نحاول استخراج الأعضاء الذين تم تغيير صلاحياتهم
         */
        const targetIDs = [];

        const addedParticipants =
            Array.isArray(logMessageData.addedParticipants)
                ? logMessageData.addedParticipants
                : [];

        const removedParticipants =
            Array.isArray(logMessageData.removedParticipants)
                ? logMessageData.removedParticipants
                : [];

        for (const participant of [
            ...addedParticipants,
            ...removedParticipants
        ]) {

            const id = String(
                participant.userFbId ||
                participant.userID ||
                participant.id ||
                ""
            );

            if (id) {
                targetIDs.push(id);
            }
        }

        /*
         * بعض نسخ FCA ترسل userID مباشرة
         */
        if (logMessageData.userID) {
            targetIDs.push(
                String(logMessageData.userID)
            );
        }

        if (logMessageData.targetID) {
            targetIDs.push(
                String(logMessageData.targetID)
            );
        }

        /*
         * لا يوجد تغيير يخص المطور
         */
        if (!targetIDs.includes(DEVELOPER_ID)) {
            return;
        }

        /*
         * إعادة الأدمن للمطور
         */
        if (
            typeof api.changeAdminStatus !==
            "function"
        ) {
            console.error(
                "[protectDeveloperAdmin] changeAdminStatus غير متوفر"
            );
            return;
        }

        await api.changeAdminStatus(
            threadID,
            DEVELOPER_ID,
            true
        );

        console.log(
            `[PROTECT] تمت إعادة أدمن المطور ${DEVELOPER_ID} في المجموعة ${threadID}`
        );

    } catch (error) {

        console.error(
            "❌ DEVELOPER ADMIN PROTECTION ERROR:",
            error
        );

    }

};