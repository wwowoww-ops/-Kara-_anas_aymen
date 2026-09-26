module.exports.config = {
    name: "leaveNoti",
    eventType: ["log:unsubscribe"],
    version: "10.0.0",
    credits: "HINA System - Abu Huraira",
    description: "نظام وداع سريع عند مغادرة أو طرد أعضاء المجموعة",
    category: "events"
};

module.exports.handleEvent = async function ({
    api,
    event,
    Users,
    Threads
}) {

    try {

        if (!event) return;

        // ==================================================
        // التأكد من نوع الحدث
        // ==================================================

        if (
            event.logMessageType &&
            event.logMessageType !== "log:unsubscribe"
        ) {
            return;
        }

        // ==================================================
        // البيانات الأساسية
        // ==================================================

        const threadID =
            String(event.threadID || "");

        if (!threadID) return;

        const logData =
            event.logMessageData || {};

        const leftID =
            String(
                logData.leftParticipantFbId || ""
            );

        if (!leftID) return;

        // ==================================================
        // ID البوت
        // ==================================================

        const botID =
            String(
                api.getCurrentUserID()
            );

        // ==================================================
        // تجاهل خروج البوت
        // ==================================================

        if (leftID === botID) {
            return;
        }

        // ==================================================
        // تنظيف الاسم
        // ==================================================

        function cleanUserName(name) {

            if (
                name === undefined ||
                name === null
            ) {
                return "";
            }

            return String(name)
                .replace(
                    /[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF]/g,
                    ""
                )
                .replace(/\s+/g, " ")
                .trim();

        }

        // ==================================================
        // استخراج الاسم من الحدث
        // ==================================================

        let userName =
            cleanUserName(
                logData.leftParticipantName ||
                logData.leftParticipantFullName ||
                ""
            );

        // ==================================================
        // استخراج الاسم من Users
        // ==================================================

        if (
            !userName &&
            Users &&
            typeof Users.getData === "function"
        ) {

            try {

                const userData =
                    await Users.getData(
                        leftID
                    );

                if (userData) {

                    userName =
                        cleanUserName(
                            userData.name ||
                            userData.fullName ||
                            userData.data?.name ||
                            userData.data?.fullName ||
                            ""
                        );

                }

            } catch (error) {

                console.error(
                    "[LEAVE] GET USER NAME ERROR:",
                    error.message
                );

            }

        }

        // ==================================================
        // محاولة من Users.getName
        // ==================================================

        if (
            !userName &&
            Users &&
            typeof Users.getName === "function"
        ) {

            try {

                const fetchedName =
                    await Users.getName(
                        leftID
                    );

                userName =
                    cleanUserName(
                        fetchedName
                    );

            } catch (error) {

                console.error(
                    "[LEAVE] GET USER NAME FALLBACK ERROR:",
                    error.message
                );

            }

        }

        // ==================================================
        // محاولة أخيرة من API
        // ==================================================

        if (
            !userName &&
            api &&
            typeof api.getUserInfo === "function"
        ) {

            try {

                const info =
                    await api.getUserInfo(
                        leftID
                    );

                const userInfo =
                    info &&
                    (
                        info[leftID] ||
                        info[String(leftID)]
                    );

                if (userInfo) {

                    userName =
                        cleanUserName(
                            userInfo.name ||
                            userInfo.fullName ||
                            ""
                        );

                }

            } catch (error) {

                console.error(
                    "[LEAVE] API GET USER NAME ERROR:",
                    error.message
                );

            }

        }

        // ==================================================
        // الاسم الاحتياطي
        // ==================================================

        if (!userName) {
            userName = "العضو";
        }

        // ==================================================
        // معرفة نوع المغادرة
        // ==================================================

        const author =
            String(event.author || "");

        const leftVoluntarily =
            author === leftID;

        // ==================================================
        // إعداد المنشن الحقيقي
        // ==================================================

        const tag =
            `@${userName}`;

        // ==================================================
        // الرسالة
        // ==================================================

        let message;
        let mentionStart;

        // ==================================================
        // خروج العضو بنفسه
        // ==================================================

        if (leftVoluntarily) {

            const prefix =
`⌬ ━ 𝗛𝗜𝗡𝗔 〢 𝗚𝗢𝗢𝗗𝗕𝗬𝗘 ━⌬

`;

            const line =
`قرر ${tag} ينسحب من الخدمة`;

            message =
`${prefix}${tag}

${line}

☕ شال قهوته
🍰 وخلى القاطو ورانا

قال تحرك تموت
وطلع يجري قبل ما نلحقه

الله يعينك على الطريق
ونشوفك على خير`;

            // أول منشن
            mentionStart =
                prefix.length;

        }

        // ==================================================
        // تم طرد العضو
        // ==================================================

        else {

            const prefix =
`⌬ ━ 𝗛𝗜𝗡𝗔 〢 𝗞𝗜𝗖𝗞 ━⌬

`;

            const line =
`تم طرد ${tag} بنجاح`;

            message =
`${prefix}${tag}

${line}

☕ القهوة قالت خليه يمشي
🍰 والقاطو رفض يروح معاه

بعد دراسة الوضع
قررنا أن وجوده خارج المجموعة أفضل للجميع

مع السلامة يا ${userName}
الباب مفتوح من الجهة الثانية`;

            // أول منشن
            mentionStart =
                prefix.length;

        }

        // ==================================================
        // المنشن الحقيقي
        // ==================================================

        const mentions = [
            {
                tag,
                id: leftID,
                fromIndex: mentionStart
            }
        ];

        // ==================================================
        // الإرسال
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
                        "❌ LEAVE SEND ERROR:",
                        error
                    );

                }

            }
        );

        // ==================================================
        // تحديث البيانات في الخلفية
        // ==================================================

        setImmediate(async () => {

            try {

                // ------------------------------------------
                // تحديث بيانات العضو
                // ------------------------------------------

                if (
                    Users &&
                    typeof Users.getData === "function"
                ) {

                    try {

                        await Users.getData(
                            leftID
                        );

                    } catch (error) {

                        console.error(
                            "[LEAVE] USER UPDATE ERROR:",
                            error.message
                        );

                    }

                }

                // ------------------------------------------
                // تحديث بيانات الشخص الذي قام بالطرد
                // ------------------------------------------

                if (
                    !leftVoluntarily &&
                    author &&
                    Users &&
                    typeof Users.getData === "function"
                ) {

                    try {

                        await Users.getData(
                            author
                        );

                    } catch (error) {

                        console.error(
                            "[LEAVE] KICKER UPDATE ERROR:",
                            error.message
                        );

                    }

                }

                // ------------------------------------------
                // تحديث بيانات المجموعة
                // ------------------------------------------

                if (
                    Threads &&
                    typeof Threads.getInfo === "function"
                ) {

                    try {

                        await Threads.getInfo(
                            threadID
                        );

                    } catch (error) {

                        console.error(
                            "[LEAVE] THREAD UPDATE ERROR:",
                            error.message
                        );

                    }

                }

            } catch (error) {

                console.error(
                    "❌ BACKGROUND LEAVE ERROR:",
                    error
                );

            }

        });

    } catch (error) {

        console.error(
            "❌ LEAVE EVENT ERROR:",
            error
        );

    }

};