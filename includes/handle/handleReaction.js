module.exports = function ({ api, models, Users, Threads, Currencies }) {
    return async function ({ event }) {
        try {
            if (!event) return;

            const { handleReaction, commands } = global.client;

            const messageID = String(event.messageID || "");
            const threadID = String(event.threadID || "");

            if (!messageID || !threadID) return;
            if (!Array.isArray(handleReaction) || handleReaction.length === 0) return;

            const indexOfHandle = handleReaction.findIndex(
                e => String(e.messageID || "") === messageID
            );

            if (indexOfHandle < 0) return;

            const indexOfMessage = handleReaction[indexOfHandle];

            const handleNeedExec = commands.get(indexOfMessage.name);

            if (!handleNeedExec) {
                return api.sendMessage(
                    global.getText(
                        "handleReaction",
                        "missingValue"
                    ),
                    threadID,
                    messageID
                );
            }

            /*
             * بعض نسخ الـAPI تضع UID صاحب التفاعل
             * في senderID وبعضها تستخدم userID أو author
             *
             * نحافظ على الحدث الأصلي ونضيف reactionUserID
             * حتى يستطيع الأمر استعماله بدون تخمين.
             */

            const reactionUserID = String(
                event.senderID ||
                event.userID ||
                event.reactorID ||
                event.author ||
                ""
            );

            const reactionEvent = {
                ...event,

                /*
                 * UID الشخص الذي ضغط على التفاعل
                 */
                reactionUserID,

                /*
                 * نحافظ على القيم الأصلية
                 */
                messageID,
                threadID
            };

            let getText2;

            if (
                handleNeedExec.languages &&
                typeof handleNeedExec.languages === "object"
            ) {
                getText2 = (...value) => {
                    const react = handleNeedExec.languages || {};

                    if (
                        !Object.prototype.hasOwnProperty.call(
                            react,
                            global.config.language
                        )
                    ) {
                        return api.sendMessage(
                            global.getText(
                                "handleCommand",
                                "notFoundLanguage",
                                handleNeedExec.config.name
                            ),
                            threadID,
                            messageID
                        );
                    }

                    let lang =
                        handleNeedExec.languages[
                            global.config.language
                        ][value[0]] || "";

                    for (let i = value.length; i > 0; i--) {
                        const expReg = RegExp("%" + i, "g");
                        lang = lang.replace(expReg, value[i]);
                    }

                    return lang;
                };
            } else {
                getText2 = () => {};
            }

            const Obj = {
                api,
                event: reactionEvent,
                models,
                Users,
                Threads,
                Currencies,
                handleReaction: indexOfMessage,
                getText: getText2
            };

            await handleNeedExec.handleReaction(Obj);

        } catch (error) {
            console.error(
                "[HANDLE REACTION ERROR]",
                error
            );

            try {
                const threadID = String(event?.threadID || "");
                const messageID = String(event?.messageID || "");

                if (threadID && messageID) {
                    api.sendMessage(
                        global.getText(
                            "handleReaction",
                            "executeError",
                            error
                        ),
                        threadID,
                        messageID
                    );
                }
            } catch (_) {}
        }
    };
};