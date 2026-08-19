const fs = require("fs");

module.exports = function ({
    api,
    models,
    Users,
    Threads,
    Currencies
}) {

    const logger = require("../../utils/log.js");

    return async function ({ event }) {

        try {

            if (!event) {
                return;
            }

            const {
                allowInbox
            } = global.config;

            const {
                userBanned,
                threadBanned
            } = global.data;

            const {
                commands
            } = global.client;

            // ==================================================
            // IDs
            // ==================================================

            const senderID =
                String(event.senderID || "");

            const threadID =
                String(event.threadID || "");

            // ==================================================
            // منع المستخدمين والمجموعات المحظورة
            // ==================================================

            if (
                userBanned &&
                userBanned.has(senderID)
            ) {
                return;
            }

            if (
                threadBanned &&
                threadBanned.has(threadID)
            ) {
                return;
            }

            // ==================================================
            // منع الخاص إذا كان allowInbox = false
            // ==================================================

            if (
                allowInbox === false &&
                senderID === threadID
            ) {
                return;
            }

            // ==================================================
            // الحصول على Events المسجلة
            // ==================================================

            let registeredEvents = [];

            // الطريقة الأساسية
            if (
                global.client.events &&
                global.client.events instanceof Map
            ) {

                registeredEvents =
                    Array.from(
                        global.client.events.entries()
                    );

            }

            // دعم eventRegistered إذا كان مستخدمًا
            if (
                Array.isArray(
                    global.client.eventRegistered
                ) &&
                global.client.eventRegistered.length > 0
            ) {

                const oldEvents = [];

                for (
                    const eventName
                    of global.client.eventRegistered
                ) {

                    const eventModule =
                        global.client.events?.get(
                            eventName
                        );

                    if (eventModule) {
                        oldEvents.push([
                            eventName,
                            eventModule
                        ]);
                    }
                }

                if (oldEvents.length > 0) {
                    registeredEvents = oldEvents;
                }
            }

            // ==================================================
            // لا توجد Events
            // ==================================================

            if (
                registeredEvents.length === 0
            ) {

                if (
                    global.config.DeveloperMode
                ) {

                    console.log(
                        "[HANDLE EVENT] لا توجد Events مسجلة"
                    );

                }

                return;
            }

            // ==================================================
            // تشغيل جميع Events
            // ==================================================

            for (
                const [
                    eventName,
                    eventModule
                ] of registeredEvents
            ) {

                if (!eventModule) {
                    continue;
                }

                // يجب أن يحتوي الملف على handleEvent
                if (
                    typeof eventModule.handleEvent !==
                    "function"
                ) {

                    continue;
                }

                // ==================================================
                // getText
                // ==================================================

                let getText =
                    function () {
                        return "";
                    };

                if (
                    eventModule.languages &&
                    typeof eventModule.languages ===
                    "object"
                ) {

                    getText = function (...values) {

                        try {

                            const language =
                                global.config.language ||
                                "ar";

                            const languageData =
                                eventModule.languages[
                                    language
                                ];

                            if (!languageData) {

                                return "";
                            }

                            let text =
                                languageData[
                                    values[0]
                                ] || "";

                            for (
                                let i = 1;
                                i < values.length;
                                i++
                            ) {

                                const regex =
                                    new RegExp(
                                        "%" + i,
                                        "g"
                                    );

                                text =
                                    text.replace(
                                        regex,
                                        values[i]
                                    );
                            }

                            return text;

                        } catch (error) {

                            return "";
                        }
                    };
                }

                // ==================================================
                // Object الخاص بالـ Event
                // ==================================================

                const Obj = {

                    api,

                    event,

                    models,

                    Users,

                    Threads,

                    Currencies,

                    getText

                };

                // ==================================================
                // تشغيل Event
                // ==================================================

                try {

                    await eventModule.handleEvent(
                        Obj
                    );

                } catch (error) {

                    console.error(
                        `❌ EVENT ERROR: ${eventName}`
                    );

                    console.error(
                        error
                    );

                    try {

                        logger(
                            `❌ Event Error: ${eventName}\n${error.message}`,
                            "error"
                        );

                    } catch (e) {}

                }
            }

        } catch (error) {

            console.error(
                "❌ HANDLE EVENT ERROR:",
                error
            );

            try {

                logger(
                    `❌ HandleEvent Error: ${error.message}`,
                    "error"
                );

            } catch (e) {}
        }
    };
};