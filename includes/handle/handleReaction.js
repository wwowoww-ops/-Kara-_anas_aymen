module.exports = function ({
    api,
    models,
    Users,
    Threads,
    Currencies
}) {

    return async function ({ event }) {

        try {

            if (!event) return;

            const {
                handleReaction,
                commands
            } = global.client;

            // ==================================================
            // المعلومات الأساسية
            // ==================================================

            const messageID =
                String(
                    event.messageID ||
                    event.messageId ||
                    ""
                );

            const threadID =
                String(
                    event.threadID ||
                    event.threadId ||
                    ""
                );

            if (!messageID || !threadID) {
                return;
            }

            if (
                !Array.isArray(handleReaction) ||
                handleReaction.length === 0
            ) {
                return;
            }

            // ==================================================
            // البحث عن الـ Handler الخاص بالرسالة
            // ==================================================

            const indexOfHandle =
                handleReaction.findIndex(
                    item =>
                        String(
                            item.messageID ||
                            ""
                        ) === messageID
                );

            if (indexOfHandle < 0) {
                return;
            }

            const indexOfMessage =
                handleReaction[indexOfHandle];

            if (!indexOfMessage) {
                return;
            }

            // ==================================================
            // الحصول على الأمر
            // ==================================================

            const commandName =
                String(
                    indexOfMessage.name ||
                    ""
                );

            if (!commandName) {
                return;
            }

            const handleNeedExec =
                commands.get(commandName);

            if (!handleNeedExec) {

                try {

                    return api.sendMessage(
                        global.getText(
                            "handleReaction",
                            "missingValue"
                        ),
                        threadID,
                        messageID
                    );

                } catch (error) {

                    console.error(
                        "[HANDLE REACTION] MISSING COMMAND ERROR:",
                        error
                    );

                    return;
                }
            }

            // ==================================================
            // استخراج UID الشخص الذي قام بالتفاعل
            // ==================================================

            let reactionUserID = "";

            /*
             * الصيغ المباشرة
             */

            const directIDs = [
                event.reactionUserID,
                event.reactorID,
                event.userID,
                event.senderID,
                event.author,
                event.userFbId,
                event.userFbID,
                event.uid,
                event.uidUser
            ];

            for (const id of directIDs) {

                if (
                    id !== undefined &&
                    id !== null &&
                    String(id).trim()
                ) {

                    reactionUserID =
                        String(id).trim();

                    break;
                }
            }

            // ==================================================
            // صيغ إضافية محتملة
            // ==================================================

            if (!reactionUserID) {

                const possibleObjects = [
                    event.reaction,
                    event.reactionData,
                    event.data,
                    event.payload,
                    event.user,
                    event.actor,
                    event.reactor
                ];

                for (
                    const object
                    of possibleObjects
                ) {

                    if (
                        !object ||
                        typeof object !== "object"
                    ) {
                        continue;
                    }

                    const possibleID =
                        object.userID ||
                        object.userId ||
                        object.userFbId ||
                        object.userFbID ||
                        object.senderID ||
                        object.senderId ||
                        object.reactorID ||
                        object.reactorId ||
                        object.id ||
                        object.uid;

                    if (
                        possibleID !== undefined &&
                        possibleID !== null &&
                        String(possibleID).trim()
                    ) {

                        reactionUserID =
                            String(
                                possibleID
                            ).trim();

                        break;
                    }
                }
            }

            // ==================================================
            // إذا كان هناك حقل participant
            // ==================================================

            if (!reactionUserID) {

                const participant =
                    event.participant ||
                    event.participantID ||
                    event.participantId;

                if (
                    participant &&
                    typeof participant === "object"
                ) {

                    reactionUserID =
                        String(
                            participant.userFbId ||
                            participant.userFbID ||
                            participant.userID ||
                            participant.id ||
                            ""
                        ).trim();

                } else if (
                    participant !== undefined &&
                    participant !== null
                ) {

                    reactionUserID =
                        String(
                            participant
                        ).trim();
                }
            }

            // ==================================================
            // إذا كان الحدث يحتوي actor
            // ==================================================

            if (
                !reactionUserID &&
                event.actor &&
                typeof event.actor === "object"
            ) {

                reactionUserID =
                    String(
                        event.actor.id ||
                        event.actor.userID ||
                        event.actor.userId ||
                        event.actor.userFbId ||
                        ""
                    ).trim();
            }

            // ==================================================
            // حماية إضافية
            // ==================================================

            if (!reactionUserID) {

                console.error(
                    "[HANDLE REACTION] تعذر معرفة UID صاحب التفاعل"
                );

                return;
            }

            // ==================================================
            // إنشاء Event جديد
            // ==================================================

            const reactionEvent = {
                ...event,

                messageID,
                threadID,

                /*
                 * UID الحقيقي الذي تم استخراجه
                 */
                reactionUserID,

                /*
                 * نسخة إضافية ليستعملها أي أمر
                 */
                reactorID:
                    reactionUserID
            };

            // ==================================================
            // نظام اللغات
            // ==================================================

            let getText2;

            if (
                handleNeedExec.languages &&
                typeof handleNeedExec.languages === "object"
            ) {

                getText2 = (...value) => {

                    const react =
                        handleNeedExec.languages ||
                        {};

                    const language =
                        global.config.language;

                    if (
                        !Object.prototype.hasOwnProperty.call(
                            react,
                            language
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
                        react[language]?.[value[0]] ||
                        "";

                    for (
                        let i = value.length;
                        i > 0;
                        i--
                    ) {

                        const expReg =
                            new RegExp(
                                "%" + i,
                                "g"
                            );

                        lang =
                            lang.replace(
                                expReg,
                                value[i]
                            );
                    }

                    return lang;
                };

            } else {

                getText2 = () => {};
            }

            // ==================================================
            // تجهيز البيانات للأمر
            // ==================================================

            const Obj = {

                api,

                event:
                    reactionEvent,

                models,

                Users,

                Threads,

                Currencies,

                handleReaction:
                    indexOfMessage,

                getText:
                    getText2

            };

            // ==================================================
            // تشغيل Handler
            // ==================================================

            if (
                typeof handleNeedExec.handleReaction !==
                "function"
            ) {
                return;
            }

            await handleNeedExec.handleReaction(
                Obj
            );

        } catch (error) {

            console.error(
                "[HANDLE REACTION ERROR]",
                error
            );

            // ==================================================
            // إرسال الخطأ للمستخدم
            // ==================================================

            try {

                const threadID =
                    String(
                        event?.threadID ||
                        event?.threadId ||
                        ""
                    );

                const messageID =
                    String(
                        event?.messageID ||
                        event?.messageId ||
                        ""
                    );

                if (
                    threadID &&
                    messageID
                ) {

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