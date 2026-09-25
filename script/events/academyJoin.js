module.exports.config = {
    name: "academyJoin",
    eventType: ["log:subscribe"],
    version: "1.0.0",
    credits: "أبو هريرة",
    description: "إرسال اختبارات أكاديمية ANGELS عند دخول عضو جديد",
    category: "events"
};

// ==================================================
// مجموعة الأكاديمية فقط
// ==================================================

const ACADEMY_THREAD_ID =
    "28542121672141147";


// ==================================================
// الحدث
// ==================================================

module.exports.handleEvent = async function ({
    api,
    event
}) {

    try {

        if (!event) {
            return;
        }

        const threadID =
            String(
                event.threadID || ""
            );

        // ==================================================
        // السماح لمجموعة الأكاديمية فقط
        // ==================================================

        if (
            threadID !==
            ACADEMY_THREAD_ID
        ) {
            return;
        }

        const logMessageData =
            event.logMessageData || {};

        // ==================================================
        // الأعضاء الجدد
        // ==================================================

        const addedParticipants =
            Array.isArray(
                logMessageData.addedParticipants
            )
                ? logMessageData.addedParticipants
                : [];

        if (
            addedParticipants.length === 0
        ) {
            return;
        }

        // ==================================================
        // ID البوت
        // ==================================================

        const botID =
            String(
                api.getCurrentUserID()
            );

        // ==================================================
        // تجاهل دخول البوت نفسه
        // ==================================================

        const newMembers =
            addedParticipants.filter(
                participant =>
                    String(
                        participant.userFbId || ""
                    ) !== botID
            );

        if (
            newMembers.length === 0
        ) {
            return;
        }

        // ==================================================
        // تجهيز المنشنات
        // ==================================================

        const mentions = [];

        const memberNames = [];

        let mentionText = "";

        for (
            const participant
            of newMembers
        ) {

            const userID =
                String(
                    participant.userFbId || ""
                );

            if (!userID) {
                continue;
            }

            const name =
                String(
                    participant.fullName ||
                    participant.name ||
                    "عضو جديد"
                );

            memberNames.push(name);

            const tag =
                `@${name}`;

            const fromIndex =
                mentionText.length;

            mentionText +=
                tag + " ";

            mentions.push({
                tag,
                id: userID,
                fromIndex
            });
        }

        if (
            mentions.length === 0
        ) {
            return;
        }

        // ==================================================
        // رسالة الأكاديمية
        // ==================================================

        const message =
`⌬ ━━ 𝗛𝗜𝗡𝗔 〢 𝗔𝗡𝗚𝗘𝗟𝗦 𝗔𝗖𝗔𝗗𝗘𝗠𝗬 ━━ ⌬

${mentionText}

أهلاً وسهلاً بك في أكاديمية الفرقة

★ الاختبارات الخاصة بالأكاديمية ★

★ وضع الشعار:
وضع شعار الأكاديمية على صورة البروفايل بطريقة صحيحة وثابتة.

★ تصميم منشورات:
إعداد منشور يحمل شعار أكاديمية الفرقة.

❈『 #ANGELS_ACADEMY 』❈

★ التعليق التفاعلي (20 تعليق):
كتابة 20 تعليقًا يتماشى مع ضوابط التفاعل الرسمية، مع توثيق كل تعليق بسكرين شوت وتجميعها وإرسالها لنا.

❈『 ANGELS ~ ACADEMY 』❈

★ إضافة أعضاء (20 عضو):
دعوة 20 عضوًا إلى مجموعة "أنمي باور" مع توثيق ذلك بسكرين وإرساله مع التعليقات السابقة.

★ تأمين الحساب (اختياري):
لمن يرغب في تعزيز أمان حسابه.

━━━━━━━━━━━━━━━━━━

مدة الأكاديمية يومين كحد أدنى.

ويُذكر اسمك مع إرسال التوثيق الخاص بالاختبارات.

بالتوفيق لك في الأكاديمية.`;

        // ==================================================
        // إرسال الرسالة
        // ==================================================

        return api.sendMessage(
            {
                body: message,
                mentions
            },
            threadID,
            error => {

                if (error) {

                    console.error(
                        "[academyJoin] SEND ERROR:",
                        error
                    );

                }

            }
        );

    } catch (error) {

        console.error(
            "[academyJoin] ERROR:",
            error
        );
    }
};