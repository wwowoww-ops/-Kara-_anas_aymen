module.exports.config = {
    name: "joinNoti",
    eventType: ["log:subscribe"],
    version: "7.1.0",
    credits: "أبو هريرة",
    description: "نظام ترحيب سريع عند دخول الأعضاء",
    category: "events"
};

module.exports.handleEvent = async function ({
    api,
    event,
    Users
}) {

    try {

        if (!event) return;

        const threadID =
            String(event.threadID || "");

        if (!threadID) return;

        const logMessageData =
            event.logMessageData || {};

        const author =
            String(event.author || "");

        // ==================================================
        // الأعضاء الجدد
        // ==================================================

        const addedParticipants =
            Array.isArray(
                logMessageData.addedParticipants
            )
                ? logMessageData.addedParticipants
                : [];

        if (!addedParticipants.length) {
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
        // إذا تمت إضافة البوت نفسه
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
        // تجهيز المنشنات والأسماء
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

            if (!userID) continue;

            const name =
                String(
                    participant.fullName ||
                    participant.name ||
                    "عضو جديد"
                );

            memberNames.push(name);

            mentions.push({
                tag: name,
                id: userID
            });
        }

        if (!mentions.length) {
            return;
        }

        // ==================================================
        // أسماء الأعضاء
        // ==================================================

        const memberText =
            memberNames
                .map(
                    name => `@${name}`
                )
                .join(" و ");

        // ==================================================
        // الترحيب
        // ==================================================

        const message =
`╭━━━━━━━━━━━━━━━━╮
     𝗛𝗜𝗡𝗔       〢       تـرحـيـب
╰━━━━━━━━━━━━━━━━╯

👋 أهلاً بـ  
    ${memberText}

✦ نورت المجموعة بانضمامك
✦ نتمنى لك وقتًا ممتعًا معنا

╭━━━━━━━━━━━━━━━━╮
              أهـلاً وسـهـلاً بـك
╰━━━━━━━━━━━━━━━━╯`;

        // ==================================================
        // إرسال الترحيب فورًا
        // ==================================================

        api.sendMessage(
            {
                body: message,
                mentions
            },
            threadID,
            error => {

                if (error) {

                    console.error(
                        "❌ WELCOME SEND ERROR:",
                        error
                    );

                }

            }
        );

        // ==================================================
        // تحديث قاعدة البيانات في الخلفية
        // ==================================================

        setImmediate(async () => {

            try {

                if (
                    !Users ||
                    typeof Users.getData !== "function"
                ) {
                    return;
                }

                // تحديث الأعضاء الجدد
                for (
                    const participant
                    of addedParticipants
                ) {

                    const userID =
                        String(
                            participant.userFbId || ""
                        );

                    if (!userID) continue;

                    try {

                        await Users.getData(
                            userID
                        );

                    } catch (error) {

                        console.error(
                            "[joinNoti] USER UPDATE ERROR:",
                            error.message
                        );

                    }
                }

                // تحديث الشخص الذي أضافهم
                if (
                    author &&
                    author !== botID
                ) {

                    try {

                        await Users.getData(
                            author
                        );

                    } catch (error) {

                        console.error(
                            "[joinNoti] ADDER UPDATE ERROR:",
                            error.message
                        );

                    }
                }

            } catch (error) {

                console.error(
                    "❌ BACKGROUND USER UPDATE ERROR:",
                    error
                );

            }

        });

    } catch (error) {

        console.error(
            "❌ JOIN NOTIFICATION ERROR:",
            error
        );

    }

};