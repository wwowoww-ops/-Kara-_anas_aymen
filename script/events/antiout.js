module.exports.config = {
    name: "antiout",
    eventType: ["log:unsubscribe"],
    version: "5.0.0",
    credits: "أبو هريرة",
    description: "منع الأعضاء من الخروج وإعادتهم تلقائياً",
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
        // العضو الذي غادر
        // ==================================================

        const leftID =
            String(
                logMessageData.leftParticipantFbId || ""
            );

        if (!leftID) {
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
        // إذا كان البوت هو الذي غادر
        // ==================================================

        if (leftID === botID) {
            return;
        }

        // ==================================================
        // التأكد أن العضو خرج بنفسه
        // ==================================================

        if (
            !author ||
            author !== leftID
        ) {
            return;
        }

        // ==================================================
        // الحصول على اسم العضو
        // ==================================================

        let memberName =
            "العضو";

        if (
            Users &&
            typeof Users.getData === "function"
        ) {

            try {

                const userData =
                    await Users.getData(leftID);

                if (
                    userData &&
                    userData.name
                ) {

                    memberName =
                        userData.name;
                }

            } catch (error) {

                console.error(
                    "[antiout] GET USER ERROR:",
                    error.message
                );

            }
        }

        // ==================================================
        // إعادة العضو
        // ==================================================

        api.addUserToGroup(
            leftID,
            threadID,
            async (error) => {

                if (error) {

                    console.error(
                        "[antiout] ADD USER ERROR:",
                        error.message || error
                    );

                    await api.sendMessage(
                        `⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬

⚠️ لم أستطع إعادة العضو

👤 ${memberName}

قد يكون العضو أغلق إمكانية إضافته للمجموعات`,
                        threadID
                    );

                    return;
                }

                // ==================================================
                // نجاح الإعادة
                // ==================================================

                const mentions = [
                    {
                        tag: memberName,
                        id: leftID
                    }
                ];

                const message =
`⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬

🛡️ ممنوع الخروج

👤 تم إعادة @${memberName} إلى المجموعة

يمكنك المغادرة مرة أخرى إذا أردت لكن الحماية ستعيدك`;

                try {

                    await api.sendMessage(
                        {
                            body: message,
                            mentions
                        },
                        threadID
                    );

                } catch (sendError) {

                    console.error(
                        "[antiout] SEND MESSAGE ERROR:",
                        sendError.message
                    );

                }

            }
        );

    } catch (error) {

        console.error(
            "❌ ANTI OUT ERROR:",
            error
        );

    }
};