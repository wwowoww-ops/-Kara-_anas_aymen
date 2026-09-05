module.exports.config = {
    name: "messageUnsend",
    eventType: ["message", "message_unsend"],
    version: "4.0.0",
    credits: "أبو هريرة",
    description: "اختبار حفظ الرسائل المحذوفة",
    category: "events"
};

const messages = new Map();

module.exports.handleEvent = async function ({
    api,
    event
}) {

    try {

        if (!event) return;

        // ================================================
        // رسالة عادية
        // ================================================

        if (event.type === "message") {

            if (!event.messageID) return;

            messages.set(
                String(event.messageID),
                {
                    body: String(
                        event.body || ""
                    ),
                    senderID: String(
                        event.senderID ||
                        event.authorID ||
                        ""
                    ),
                    threadID: String(
                        event.threadID || ""
                    )
                }
            );

            console.log(
                "[محذوف] SAVED:",
                event.messageID,
                event.body
            );

            return;
        }

        // ================================================
        // رسالة محذوفة
        // ================================================

        if (event.type === "message_unsend") {

            console.log(
                "[محذوف] UNSEND:",
                event.messageID
            );

            const data =
                messages.get(
                    String(event.messageID)
                );

            if (!data) {

                return api.sendMessage(
                    "تم حذف رسالة لكن لم أجدها في الذاكرة",
                    event.threadID
                );
            }

            return api.sendMessage(
                "╭━━━━━━━━━━━━━━━━╮\n" +
                "       𝗛𝗜𝗡𝗔 〢 مـحـذوف\n" +
                "╰━━━━━━━━━━━━━━━━╯\n\n" +
                "الرسالة المحذوفة:\n\n" +
                data.body,
                event.threadID
            );
        }

    } catch (error) {

        console.error(
            "[محذوف ERROR]",
            error
        );

    }

};