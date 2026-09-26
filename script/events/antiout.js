module.exports.config = {
    name: "antiout",
    eventType: ["log:unsubscribe"],
    version: "6.0.0",
    credits: "أبو هريرة",
    description: "منع الأعضاء من الخروج وإعادتهم تلقائياً",
    category: "events"
};

const ACADEMY_THREAD_ID =
    "8555825081107393";

/**
 * الحصول على اسم المستخدم بأفضل طريقة ممكنة
 */
async function getMemberName(api, Users, userID, event) {

    // ==================================================
    // 1. محاولة Users
    // ==================================================

    if (
        Users &&
        typeof Users.getData === "function"
    ) {

        try {

            const userData =
                await Users.getData(userID);

            if (
                userData &&
                typeof userData.name === "string" &&
                userData.name.trim()
            ) {

                return userData.name.trim();

            }

        } catch (error) {

            console.error(
                "[antiout] USERS NAME ERROR:",
                error.message
            );

        }

    }

    // ==================================================
    // 2. محاولة API getUserInfo
    // ==================================================

    if (
        api &&
        typeof api.getUserInfo === "function"
    ) {

        try {

            const info =
                await api.getUserInfo(userID);

            const user =
                info &&
                (
                    info[userID] ||
                    info[String(userID)]
                );

            if (
                user &&
                typeof user.name === "string" &&
                user.name.trim()
            ) {

                return user.name.trim();

            }

        } catch (error) {

            console.error(
                "[antiout] API NAME ERROR:",
                error.message
            );

        }

    }

    // ==================================================
    // 3. محاولة الاسم الموجود في الحدث
    // ==================================================

    if (
        event &&
        event.logMessageData
    ) {

        const data =
            event.logMessageData;

        const possibleName =
            data.leftParticipantName ||
            data.participantName ||
            data.userName;

        if (
            typeof possibleName === "string" &&
            possibleName.trim()
        ) {

            return possibleName.trim();

        }

    }

    // ==================================================
    // اسم احتياطي
    // ==================================================

    return "العضو";
}


/**
 * إرسال رسالة مع Mention حقيقي
 */
async function sendMentionMessage(
    api,
    threadID,
    userID,
    memberName
) {

    const tag =
        `@${memberName}`;

    const prefix =
`⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬

🛡️ ممنوع الخروج

👤 تم إعادة `;

    const suffix =
` إلى المجموعة

يمكنك المغادرة مرة أخرى إذا أردت لكن الحماية ستعيدك`;

    const body =
        prefix +
        tag +
        suffix;

    const mentionStart =
        prefix.length;

    return api.sendMessage(
        {
            body,
            mentions: [
                {
                    tag,
                    id: String(userID),
                    fromIndex: mentionStart
                }
            ]
        },
        threadID
    );
}


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

        if (!threadID) {
            return;
        }

        // ==================================================
        // استثناء أكاديمية ANGELS
        // ==================================================

        if (
            threadID ===
            ACADEMY_THREAD_ID
        ) {
            return;
        }

        const logMessageData =
            event.logMessageData || {};

        const author =
            String(event.author || "");

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

        const memberName =
            await getMemberName(
                api,
                Users,
                leftID,
                event
            );

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

                    try {

                        await api.sendMessage(
`⌬ ━━ 𝗛𝗜𝗡𝗔 ━━ ⌬

⚠️ لم أستطع إعادة العضو

👤 ${memberName}

قد يكون العضو أغلق إمكانية إضافته للمجموعات`,
                            threadID
                        );

                    } catch (sendError) {

                        console.error(
                            "[antiout] ERROR MESSAGE SEND:",
                            sendError.message
                        );

                    }

                    return;
                }

                // ==================================================
                // نجاح الإعادة + Mention حقيقي
                // ==================================================

                try {

                    await sendMentionMessage(
                        api,
                        threadID,
                        leftID,
                        memberName
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