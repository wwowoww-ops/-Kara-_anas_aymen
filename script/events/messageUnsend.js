module.exports.config = {
    name: "messageUnsend",
    eventType: [
        "message",
        "message_unsend"
    ],
    version: "2.0.0",
    credits: "أبو هريرة",
    description: "اختبار حدث حذف الرسائل",
    category: "events"
};

module.exports.handleEvent = async function ({
    api,
    event
}) {

    try {

        if (!event) return;

        console.log(
            "\n=============================="
        );

        console.log(
            "[HINA EVENT]"
        );

        console.log(
            "TYPE:",
            event.type
        );

        console.log(
            "MESSAGE ID:",
            event.messageID
        );

        console.log(
            "THREAD ID:",
            event.threadID
        );

        console.log(
            "SENDER ID:",
            event.senderID
        );

        console.log(
            "BODY:",
            event.body
        );

        console.log(
            "FULL EVENT:",
            JSON.stringify(
                event,
                null,
                2
            )
        );

        console.log(
            "==============================\n"
        );

        // فقط لاختبار حدث الحذف
        if (
            event.type === "message_unsend"
        ) {

            api.sendMessage(
                "تم التقاط حدث حذف رسالة\n" +
                "Message ID: " +
                String(
                    event.messageID || "غير موجود"
                ),
                event.threadID
            );
        }

    } catch (error) {

        console.error(
            "[MESSAGE UNSEND TEST ERROR]",
            error
        );

    }

};