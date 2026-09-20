/**
 * عدلي.js
 * تعديل الصور بالذكاء الاصطناعي
 *
 * الاستخدام:
 * رد على صورة واكتب:
 * عدلي خلي الشعر أسود
 *
 * أو:
 * عدلي حط نظارة شمسية
 */

const axios = require("axios");

module.exports.config = {
    name: "عدلي",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "تعديل الصور بالذكاء الاصطناعي",
    commandCategory: "pic",
    usages: "عدلي <وصف التعديل>",
    cooldowns: 10
};

const HINA_HEADER = "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n";

/**
 * استدعاء API تعديل الصورة
 */
async function editImage(imageUrl, prompt) {
    const response = await axios.get(
        "https://engez.a7a.online/api/v1/ai/ai/imgedit",
        {
            params: {
                image_url: imageUrl,
                prompt: prompt
            },
            timeout: 120000
        }
    );

    const data = response.data;

    if (
        !data ||
        !data.success ||
        !data.response ||
        !data.response.image
    ) {
        throw new Error(
            typeof data === "string"
                ? data
                : JSON.stringify(data || "فشل API في تعديل الصورة")
        );
    }

    return {
        image: data.response.image,
        originalImage: data.response.source_image || imageUrl,
        images: data.response.images || [],
        serial_no: data.response.serial_no || "غير متوفر",
        prompt: data.response.prompt || prompt
    };
}

module.exports.run = async function ({
    api,
    event,
    args
}) {
    const threadID = event.threadID;
    const messageReply = event.messageReply;

    /*
     * يجب أن يكون الأمر ردًا على صورة
     */
    if (!messageReply) {
        return api.sendMessage(
            HINA_HEADER +
            "🎨 تعديل الصور بالذكاء الاصطناعي\n\n" +
            "رد على صورة واكتب:\n" +
            "عدلي <وصف التعديل>\n\n" +
            "مثال:\n" +
            "عدلي خلي الشعر أسود\n\n" +
            "أو:\n" +
            "عدلي حط نظارة شمسية",
            threadID,
            event.messageID
        );
    }

    /*
     * البحث عن الصورة في المرفقات
     */
    const attachments = messageReply.attachments || [];

    const image = attachments.find(
        attachment =>
            attachment &&
            (
                attachment.type === "photo" ||
                attachment.type === "image" ||
                /\.(jpg|jpeg|png|webp)$/i.test(
                    attachment.url || ""
                )
            )
    );

    if (!image || !image.url) {
        return api.sendMessage(
            HINA_HEADER +
            "❌ الرسالة التي رددت عليها لا تحتوي على صورة.\n\n" +
            "رد على صورة مباشرة ثم اكتب وصف التعديل.",
            threadID,
            event.messageID
        );
    }

    /*
     * وصف التعديل
     */
    const prompt = args.join(" ").trim();

    if (!prompt) {
        return api.sendMessage(
            HINA_HEADER +
            "❌ يجب كتابة وصف التعديل.\n\n" +
            "مثال:\n" +
            "عدلي خلي الشعر أسود\n\n" +
            "عدلي حط نظارة شمسية\n\n" +
            "عدلي غير الخلفية إلى البحر",
            threadID,
            event.messageID
        );
    }

    /*
     * رسالة الانتظار
     */
    const waitMessage = await api.sendMessage(
        HINA_HEADER +
        "⏳ جاري تعديل الصورة...\n\n" +
        "✏️ التعديل: " + prompt + "\n\n" +
        "قد يستغرق الأمر بعض الوقت.",
        threadID
    );

    try {
        /*
         * إرسال الصورة إلى API
         */
        const result = await editImage(
            image.url,
            prompt
        );

        /*
         * حذف رسالة الانتظار
         */
        if (
            waitMessage &&
            waitMessage.messageID
        ) {
            await api.unsendMessage(
                waitMessage.messageID
            ).catch(() => {});
        }

        /*
         * إرسال الصورة الناتجة
         */
        await api.sendMessage(
            {
                body:
                    HINA_HEADER +
                    "✅ تم تعديل الصورة بنجاح\n\n" +
                    "✏️ التعديل: " +
                    result.prompt +
                    "\n" +
                    "🔢 رقم المهمة: " +
                    result.serial_no,

                attachment: await downloadImage(
                    result.image
                )
            },
            threadID,
            event.messageID
        );

    } catch (error) {

        /*
         * حذف رسالة الانتظار
         */
        if (
            waitMessage &&
            waitMessage.messageID
        ) {
            await api.unsendMessage(
                waitMessage.messageID
            ).catch(() => {});
        }

        let errorMessage =
            error && error.message
                ? error.message
                : "خطأ غير معروف";

        if (errorMessage.length > 1500) {
            errorMessage =
                errorMessage.slice(0, 1500) +
                "\n...";
        }

        return api.sendMessage(
            HINA_HEADER +
            "❌ فشل تعديل الصورة\n\n" +
            "الخطأ:\n" +
            errorMessage +
            "\n\n" +
            "جرب وصفًا آخر أو أعد المحاولة بعد قليل.",
            threadID,
            event.messageID
        );
    }
};

/**
 * تحميل الصورة الناتجة وتحويلها إلى Buffer
 */
async function downloadImage(url) {

    if (!url) {
        throw new Error(
            "API لم يرجع رابط الصورة المعدلة"
        );
    }

    const response = await axios.get(
        url,
        {
            responseType: "arraybuffer",
            timeout: 120000,
            maxContentLength: 25 * 1024 * 1024,
            maxBodyLength: 25 * 1024 * 1024
        }
    );

    return Buffer.from(response.data);
}