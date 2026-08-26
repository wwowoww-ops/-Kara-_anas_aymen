const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "احصائيات",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "عرض إحصائيات المجموعة وأكثر الأعضاء نشاطًا",
    commandCategory: "Utility",
    usages: "احصائيات",
    cooldowns: 5
};

const ACTIVITY_DIR = path.join(
    process.cwd(),
    "data",
    "groupActivity"
);

async function getUserName(api, Users, uid) {

    try {

        if (
            Users &&
            typeof Users.getNameUser === "function"
        ) {

            const name =
                await Users.getNameUser(
                    String(uid)
                );

            if (name) {
                return name;
            }
        }

    } catch (e) {}

    try {

        if (
            api &&
            typeof api.getUserInfo === "function"
        ) {

            const info =
                await api.getUserInfo(
                    String(uid)
                );

            if (
                info &&
                info[String(uid)] &&
                info[String(uid)].name
            ) {

                return info[String(uid)].name;
            }
        }

    } catch (e) {}

    return "عضو غير معروف";
}

module.exports.run = async function ({
    api,
    event,
    Users,
    Threads
}) {

    const {
        threadID,
        messageID
    } = event;

    try {

        // ==================================================
        // معلومات المجموعة
        // ==================================================

        let info = null;

        try {

            if (
                Threads &&
                typeof Threads.getInfo === "function"
            ) {

                info =
                    await Threads.getInfo(
                        String(threadID)
                    );
            }

        } catch (e) {}

        if (!info) {

            try {

                info =
                    await api.getThreadInfo(
                        String(threadID)
                    );

            } catch (e) {}
        }

        if (!info) {

            return api.sendMessage(
                `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬

❌ تعذر الحصول على معلومات المجموعة.`,
                threadID,
                messageID
            );
        }

        // ==================================================
        // عدد الأعضاء
        // ==================================================

        let participants = [];

        if (
            Array.isArray(
                info.participantIDs
            )
        ) {

            participants =
                info.participantIDs.map(
                    id => String(id)
                );

        } else if (
            Array.isArray(
                info.participants
            )
        ) {

            participants =
                info.participants
                    .map(user => {

                        if (
                            typeof user === "string" ||
                            typeof user === "number"
                        ) {

                            return String(user);
                        }

                        return String(
                            user?.id ||
                            user?.userID ||
                            ""
                        );
                    })
                    .filter(Boolean);
        }

        // ==================================================
        // المشرفون
        // ==================================================

        let admins = [];

        if (
            Array.isArray(
                info.adminIDs
            )
        ) {

            admins =
                info.adminIDs.map(
                    id => String(id)
                );

        } else if (
            Array.isArray(
                info.admins
            )
        ) {

            admins =
                info.admins
                    .map(user => {

                        if (
                            typeof user === "string" ||
                            typeof user === "number"
                        ) {

                            return String(user);
                        }

                        return String(
                            user?.id ||
                            user?.userID ||
                            ""
                        );
                    })
                    .filter(Boolean);
        }

        // ==================================================
        // قراءة النشاط
        // ==================================================

        const activityFile =
            path.join(
                ACTIVITY_DIR,
                `${String(threadID)}.json`
            );

        let activity = {};

        if (
            await fs.pathExists(
                activityFile
            )
        ) {

            try {

                activity =
                    await fs.readJson(
                        activityFile
                    );

            } catch (e) {

                activity = {};
            }
        }

        // ==================================================
        // الاقتصار على أعضاء المجموعة الحاليين
        // ==================================================

        const currentMembers =
            new Set(
                participants
            );

        const ranking =
            Object.entries(activity)
                .filter(
                    ([uid]) =>
                        currentMembers.has(
                            String(uid)
                        )
                )
                .sort(
                    (a, b) =>
                        (
                            Number(
                                b[1]?.messages || 0
                            )
                        ) -
                        (
                            Number(
                                a[1]?.messages || 0
                            )
                        )
                )
                .slice(0, 10);

        // ==================================================
        // ترتيب النشاط
        // ==================================================

        let rankingText =
            "";

        if (
            ranking.length === 0
        ) {

            rankingText =
                "لا توجد بيانات نشاط كافية حتى الآن.";

        } else {

            const medals = [
                "🥇",
                "🥈",
                "🥉"
            ];

            for (
                let i = 0;
                i < ranking.length;
                i++
            ) {

                const [
                    uid,
                    data
                ] = ranking[i];

                const name =
                    await getUserName(
                        api,
                        Users,
                        uid
                    );

                const medal =
                    medals[i] ||
                    `${i + 1}.`;

                const messages =
                    Number(
                        data?.messages || 0
                    );

                rankingText +=
                    `${medal} ${name} — ${messages} رسالة\n`;
            }
        }

        // ==================================================
        // إجمالي الرسائل المسجلة
        // ==================================================

        let totalMessages = 0;

        for (
            const data
            of Object.values(activity)
        ) {

            totalMessages +=
                Number(
                    data?.messages || 0
                );
        }

        // ==================================================
        // الرسالة
        // ==================================================

        const groupName =
            info.threadName ||
            "بدون اسم";

        const text =
`⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬

📊 إحصائيات المجموعة

━━━━━━━━━━━━━━━━━━

🏷️ الاسم:
${groupName}

👥 عدد الأعضاء:
${participants.length}

👑 عدد المشرفين:
${admins.length}

💬 الرسائل المسجلة:
${totalMessages}

━━━━━━━━━━━━━━━━━━

🔥 أكثر الأعضاء نشاطًا:

${rankingText}
━━━━━━━━━━━━━━━━━━

🆔 ID:
${threadID}`;

        return api.sendMessage(
            text,
            threadID,
            messageID
        );

    } catch (error) {

        console.error(
            "[احصائيات ERROR]",
            error
        );

        return api.sendMessage(
            `⌬ ━━ 𝗛𝗜𝗡𝗔 UTILITY ━━ ⌬

❌ حدث خطأ أثناء حساب الإحصائيات.`,
            threadID,
            messageID
        );
    }
};