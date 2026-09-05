module.exports.config = {
    name: "messageUnsend",
    eventType: ["message_unsend"],
    version: "5.0.0",
    credits: "أبو هريرة",
    description: "تشخيص حدث حذف الرسائل",
    category: "events"
};

module.exports.handleEvent = async function ({
    api,
    event
}) {

    try {

        if (
            !event ||
            event.type !== "message_unsend"
        ) {
            return;
        }

        console.log(
            "\n========== UNSEND EVENT =========="
        );

        console.log(
            JSON.stringify(
                event,
                null,
                2
            )
        );

        console.log(
            "==================================\n"
        );

    } catch (error) {

        console.error(
            "[UNSEND DEBUG ERROR]",
            error
        );

    }

};