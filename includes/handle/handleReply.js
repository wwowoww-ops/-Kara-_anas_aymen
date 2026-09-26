module.exports = function ({ api, models, Users, Threads, Currencies }) {

    // منع التكرار
    const processedReplies = new Set();

    return function ({ event }) {

        // تفاعل بسنجاب فقط إذا كانت الرسالة تحتوي على "زنجوبة"
        try {

            const currentUserID =
                api.getCurrentUserID();

            if (
                event.senderID &&
                event.senderID !== currentUserID &&
                event.body
            ) {

                const keywords = [
                    "زنجوبة",
                    "zanjouba",
                    "ZANJOUBA",
                    "زنجوبه"
                ];

                const containsKeyword =
                    keywords.some(keyword =>
                        event.body
                            .toLowerCase()
                            .includes(keyword.toLowerCase())
                    );

                if (containsKeyword) {

                    api.setMessageReaction(
                        "🐿️",
                        event.messageID,
                        (err) => {

                            if (err) {
                                console.log(
                                    "❌ فشل التفاعل بسنجاب:",
                                    err.message
                                );
                            }

                        }
                    );

                }

            }

        } catch (e) {

            // تجاهل الأخطاء

        }

        if (!event.messageReply) {
            return;
        }

        const replyKey =
            `${event.messageReply.messageID}_${event.senderID}`;

        if (processedReplies.has(replyKey)) {

            console.log(
                `⏭️ تخطي رد مكرر: ${replyKey}`
            );

            return;
        }

        processedReplies.add(replyKey);

        setTimeout(() => {

            processedReplies.delete(replyKey);

        }, 5000);

        const {
            handleReply,
            commands
        } = global.client;

        const {
            messageID,
            threadID,
            messageReply
        } = event;

        if (handleReply.length !== 0) {

            const indexOfHandle =
                handleReply.findIndex(
                    e =>
                        e.messageID ==
                        messageReply.messageID
                );

            if (indexOfHandle < 0) {
                return;
            }

            const indexOfMessage =
                handleReply[indexOfHandle];

            /*
             * البحث أولاً داخل الأوامر
             * ثم داخل الأحداث
             *
             * هذا يسمح للأحداث التي تحتوي
             * على handleReply مثل academyJoin
             * باستقبال الردود بدون تحويلها إلى Command.
             */

            let handleNeedExec = null;

            if (
                commands &&
                typeof commands.get === "function"
            ) {

                handleNeedExec =
                    commands.get(
                        indexOfMessage.name
                    );

            }

            if (
                !handleNeedExec &&
                global.client.events &&
                typeof global.client.events.get === "function"
            ) {

                handleNeedExec =
                    global.client.events.get(
                        indexOfMessage.name
                    );

            }

            if (!handleNeedExec) {

                return api.sendMessage(
                    global.getText(
                        'handleReply',
                        'missingValue'
                    ),
                    threadID,
                    messageID
                );

            }

            try {

                var getText2;

                if (
                    handleNeedExec.languages &&
                    typeof handleNeedExec.languages == 'object'
                ) {

                    getText2 =
                        (...value) => {

                            const reply =
                                handleNeedExec.languages ||
                                {};

                            if (
                                !reply.hasOwnProperty(
                                    global.config.language
                                )
                            ) {

                                return api.sendMessage(
                                    global.getText(
                                        'handleCommand',
                                        'notFoundLanguage',
                                        handleNeedExec.config.name
                                    ),
                                    threadID,
                                    messageID
                                );

                            }

                            var lang =
                                handleNeedExec
                                    .languages[
                                        global.config.language
                                    ][value[0]] ||
                                '';

                            for (
                                var i = value.length;
                                i >
                                -0x4 * 0x4db +
                                0x6d * 0x55 +
                                -0x597 * 0x3;
                                i--
                            ) {

                                const expReg =
                                    RegExp(
                                        '%' + i,
                                        'g'
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

                const Obj = {};

                Obj.api =
                    api;

                Obj.event =
                    event;

                Obj.models =
                    models;

                Obj.Users =
                    Users;

                Obj.Threads =
                    Threads;

                Obj.Currencies =
                    Currencies;

                Obj.handleReply =
                    indexOfMessage;

                Obj.models =
                    models;

                Obj.getText =
                    getText2;

                handleNeedExec.handleReply(
                    Obj
                );

                return;

            } catch (error) {

                return api.sendMessage(
                    global.getText(
                        'handleReply',
                        'executeError',
                        error
                    ),
                    threadID,
                    messageID
                );

            }

        }

    };

};