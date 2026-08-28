module.exports.config = {
    name: "joinNoti",
    eventType: ["log:subscribe"],
    version: "6.1.0",
    credits: "أبو هريرة",
    description: "نظام ترحيب عند دخول الأعضاء",
    category: "events"
};

module.exports.handleEvent = async function ({
    api,
    event,
    Users
}) {

    try {

        if (!event) {
            return;
        }

        const threadID =
            String(event.threadID || "");

        const logMessageData =
            event.logMessageData || {};

        const author =
            String(event.author || "");

        if (!threadID) {
            return;
        }

        // ==================================================
        // الأعضاء الجدد
        // ==================================================

        const addedParticipants =
            Array.isArray(
                logMessageData.addedParticipants
            )
                ? logMessageData.addedParticipants
                : [];

        if (
            addedParticipants.length === 0
        ) {
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
        // إذا كان البوت هو المضاف
        // ==================================================

        const botAdded =
            addedParticipants.some(
                participant =>
                    String(
                        participant.userFbId || ""
                    ) === botID
            );

        if (botAdded) {
            return;
        }

        // ==================================================
        // تجهيز المنشنات وأسماء الأعضاء
        // ==================================================

        const mentions = [];
        const memberNames = [];

        for (
            const participant
            of addedParticipants
        ) {

            const userID =
                String(
                    participant.userFbId || ""
                );

            if (!userID) {
                continue;
            }

            // الاسم الموجود في الحدث كاحتياط
            let fullName =
                participant.fullName ||
                "عضو جديد";

            // محاولة جلب الاسم الحالي من قاعدة Users
            if (
                Users &&
                typeof Users.getData === "function"
            ) {

                try {

                    const userData =
                        await Users.getData(
                            userID
                        );

                    if (
                        userData &&
                        userData.name
                    ) {

                        fullName =
                            String(
                                userData.name
                            );

                    }

                } catch (error) {

                    console.error(
                        "[joinNoti] GET MEMBER ERROR:",
                        error.message
                    );

                }
            }

            memberNames.push(
                fullName
            );

            mentions.push({
                tag: fullName,
                id: userID
            });
        }

        if (
            mentions.length === 0
        ) {
            return;
        }

        // ==================================================
        // اسم الشخص الذي أضاف العضو
        // ==================================================

        let adderName = null;

        if (
            author &&
            author !== botID &&
            Users &&
            typeof Users.getData === "function"
        ) {

            try {

                const adderData =
                    await Users.getData(
                        author
                    );

                if (
                    adderData &&
                    adderData.name
                ) {

                    adderName =
                        String(
                            adderData.name
                        );

                }

            } catch (error) {

                console.error(
                    "[joinNoti] GET ADDER ERROR:",
                    error.message
                );

            }
        }

        // ==================================================
        // منشن المضيف
        // ==================================================

        let adderText =
            "";

        if (
            author &&
            adderName
        ) {

            mentions.push({
                tag: adderName,
                id: author
            });

            adderText =
                `\n\n👤 المضيف\n@${adderName}`;

        }

        // ==================================================
        // أسماء الأعضاء
        // ==================================================

        const memberText =
            memberNames
                .map(
                    name => `@${name}`
                )
                .join("، ");

        // ==================================================
        // رسالة الترحيب
        // ==================================================

        const message =
`⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬

👋 أهلاً بـ ${memberText}

💫 نورت المجموعة بانضمامك
نتمنى لك وقتًا ممتعًا معنا${adderText}`;

        // ==================================================
        // إرسال الرسالة
        // ==================================================

        await api.sendMessage(
            {
                body: message,
                mentions
            },
            threadID
        );

    } catch (error) {

        console.error(
            "❌ JOIN NOTIFICATION ERROR:",
            error
        );

    }
};