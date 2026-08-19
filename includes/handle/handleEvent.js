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

        if (!event) return;

        try {

            // ==================================================
            // الإعدادات والبيانات
            // ==================================================

            const config = global.config || {};
            const data = global.data || {};
            const client = global.client || {};

            const allowInbox =
                config.allowInbox !== false;

            const userBanned =
                data.userBanned instanceof Map
                    ? data.userBanned
                    : new Map();

            const threadBanned =
                data.threadBanned instanceof Map
                    ? data.threadBanned
                    : new Map();

            // ==================================================
            // IDs
            // ==================================================

            const senderID =
                String(event.senderID || "");

            const threadID =
                String(event.threadID || "");

            // ==================================================
            // حماية من الأحداث بدون Thread
            // ==================================================

            if (!threadID) {
                if (config.DeveloperMode) {
                    console.log(
                        "[HANDLE EVENT] Event بدون threadID"
                    );
                }

                return;
            }

            // ==================================================
            // الحظر
            // ==================================================

            if (
                senderID &&
                userBanned.has(senderID)
            ) {
                return;
            }

            if (
                threadBanned.has(threadID)
            ) {
                return;
            }

            // ==================================================
            // منع الخاص
            // ==================================================

            if (
                allowInbox === false &&
                senderID &&
                senderID === threadID
            ) {
                return;
            }

            // ==================================================
            // تحديد نوع الحدث
            //
            // مهم جدًا:
            // logMessageType يجب أن تكون له الأولوية
            // على event.type
            // ==================================================

            const currentEventType =
                event.logMessageType ||
                event.type ||
                "";

            // ==================================================
            // Debug
            // ==================================================

            if (config.DeveloperMode) {

                console.log(
                    "\n════════ HANDLE EVENT ════════"
                );

                console.log(
                    "Type:",
                    event.type
                );

                console.log(
                    "LogMessageType:",
                    event.logMessageType
                );

                console.log(
                    "Detected:",
                    currentEventType
                );

                console.log(
                    "Thread:",
                    threadID
                );

                console.log(
                    "Sender:",
                    senderID
                );

                console.log(
                    "══════════════════════════════\n"
                );
            }

            // ==================================================
            // الحصول على Events
            // ==================================================

            const eventsMap =
                client.events instanceof Map
                    ? client.events
                    : new Map();

            if (eventsMap.size === 0) {

                if (config.DeveloperMode) {
                    console.log(
                        "[HANDLE EVENT] لا توجد Events محملة"
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
                ] of eventsMap.entries()
            ) {

                if (!eventModule) {
                    continue;
                }

                // ==================================================
                // قراءة eventType من Config
                // ==================================================

                const eventConfig =
                    eventModule.config || {};

                let eventTypes =
                    eventConfig.eventType ||
                    eventConfig.eventTypes ||
                    [];

                if (!Array.isArray(eventTypes)) {
                    eventTypes = [eventTypes];
                }

                eventTypes =
                    eventTypes
                        .filter(Boolean)
                        .map(type => String(type));

                // ==================================================
                // التحقق من نوع الحدث
                // ==================================================

                if (
                    eventTypes.length > 0 &&
                    !eventTypes.includes(
                        String(currentEventType)
                    )
                ) {
                    continue;
                }

                // ==================================================
                // الحصول على دالة التشغيل
                //
                // يدعم:
                // module.exports.run
                // module.exports.handleEvent
                // ==================================================

                let eventHandler = null;

                if (
                    typeof eventModule.handleEvent ===
                    "function"
                ) {

                    eventHandler =
                        eventModule.handleEvent;

                } else if (
                    typeof eventModule.run ===
                    "function"
                ) {

                    eventHandler =
                        eventModule.run;

                }

                // ==================================================
                // Event بدون Handler
                // ==================================================

                if (!eventHandler) {

                    if (config.DeveloperMode) {

                        console.log(
                            `⚠️ Event بدون run/handleEvent: ${eventName}`
                        );

                    }

                    continue;
                }

                // ==================================================
                // getText
                // ==================================================

                const getText =
                    function (...values) {

                        try {

                            if (
                                !eventModule.languages ||
                                typeof eventModule.languages !==
                                "object"
                            ) {
                                return "";
                            }

                            const language =
                                config.language ||
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

                                text =
                                    text.replace(
                                        new RegExp(
                                            "%" + i,
                                            "g"
                                        ),
                                        String(values[i])
                                    );

                            }

                            return text;

                        } catch (error) {

                            return "";

                        }
                    };

                // ==================================================
                // Object الذي سيتم إرساله للـEvent
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
                // Debug لكل Event سيتم تشغيله
                // ==================================================

                if (config.DeveloperMode) {

                    console.log(
                        `▶️ تشغيل Event: ${eventName}`
                    );

                    console.log(
                        `   Type: ${currentEventType}`
                    );

                }

                // ==================================================
                // تشغيل Event
                // ==================================================

                try {

                    await Promise.resolve(
                        eventHandler(Obj)
                    );

                    if (config.DeveloperMode) {

                        console.log(
                            `✅ انتهى Event: ${eventName}`
                        );

                    }

                } catch (error) {

                    console.error(
                        `❌ EVENT ERROR: ${eventName}`
                    );

                    console.error(
                        error
                    );

                    try {

                        logger(
                            `❌ Event Error: ${eventName}\n${error.stack || error.message}`,
                            "error"
                        );

                    } catch (e) {}

                }
            }

        } catch (error) {

            console.error(
                "════════════════════════════════"
            );

            console.error(
                "❌ HANDLE EVENT ERROR"
            );

            console.error(
                error
            );

            console.error(
                "════════════════════════════════"
            );

            try {

                logger(
                    `❌ HandleEvent Error:\n${error.stack || error.message}`,
                    "error"
                );

            } catch (e) {}

        }
    };
};