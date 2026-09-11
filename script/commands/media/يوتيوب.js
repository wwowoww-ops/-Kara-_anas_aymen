const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const ytSearch = require("yt-search");

module.exports.config = {
    name: "يوتيوب",
    version: "3.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "البحث في يوتيوب وتحميل الفيديو أو الصوت",
    commandCategory: "Media",
    usages: "يوتيوب [اسم الفيديو]",
    cooldowns: 10
};

// ==================================================
// الإعدادات
// ==================================================

const NEW_API_BASE =
    "https://engez.a7a.online/api/v1/download/ytdl";

const OLD_API_BASE =
    "https://engez.a7a.online/api/v1/download/youtube";

const VIDEO_QUALITIES = [
    "144",
    "240",
    "360",
    "480",
    "720",
    "1080",
    "1440",
    "2160"
];

const AUDIO_QUALITIES = [
    "128",
    "320"
];

const CACHE_DIR =
    path.join(__dirname, "cache");

// ==================================================
// إنشاء الكاش
// ==================================================

function ensureCache() {

    if (!fs.existsSync(CACHE_DIR)) {
        fs.ensureDirSync(CACHE_DIR);
    }

}

// ==================================================
// تنظيف الملفات
// ==================================================

function removeFile(filePath) {

    try {

        if (
            filePath &&
            fs.existsSync(filePath)
        ) {

            fs.unlinkSync(filePath);

        }

    } catch (error) {

        console.error(
            "[HINA YOUTUBE] Cache Cleanup Error:",
            error.message
        );

    }

}

// ==================================================
// إرسال HandleReply
// ==================================================

function addHandleReply(data) {

    if (!global.client.handleReply) {
        global.client.handleReply = [];
    }

    global.client.handleReply.push(data);

}

// ==================================================
// استخراج رابط يوتيوب
// ==================================================

function extractYouTubeUrl(text) {

    if (!text) {
        return null;
    }

    const match = text.match(
        /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=[\w-]+|youtu\.be\/[\w-]+|youtube\.com\/shorts\/[\w-]+)/i
    );

    return match ? match[0] : null;

}

// ==================================================
// بناء رابط API
// ==================================================

function buildApiUrl(base, url, type, quality) {

    return (
        `${base}?url=${encodeURIComponent(url)}` +
        `&type=${encodeURIComponent(type)}` +
        `&quality=${encodeURIComponent(quality)}`
    );

}

// ==================================================
// API الجديد
// ==================================================

async function fetchFromNewApi(
    url,
    type,
    quality
) {

    const apiUrl =
        buildApiUrl(
            NEW_API_BASE,
            url,
            type,
            quality
        );

    console.log(
        "[HINA YOUTUBE] New API:",
        apiUrl
    );

    try {

        const response =
            await axios.get(
                apiUrl,
                {
                    timeout: 120000
                }
            );

        console.log(
            "[HINA YOUTUBE] New API Status:",
            response.status
        );

        console.log(
            "[HINA YOUTUBE] New API Response:",
            JSON.stringify(response.data)
        );

        const data =
            response.data;

        if (
            !data ||
            data.success !== true ||
            !data.response ||
            !data.response.download_url
        ) {

            throw new Error(
                "API الجديد لم يرجع رابط تحميل صالح"
            );

        }

        return {

            title:
                data.response.title ||
                "YouTube",

            thumbnail:
                data.response.thumbnail ||
                null,

            download_url:
                data.response.download_url,

            type,

            quality,

            source_used:
                "new"

        };

    } catch (error) {

        console.error(
            "[HINA YOUTUBE] New API Error:",
            error.response?.status ||
            error.message
        );

        if (error.response?.data) {

            console.error(
                "[HINA YOUTUBE] New API Error Data:",
                JSON.stringify(
                    error.response.data
                )
            );

        }

        throw error;

    }

}

// ==================================================
// API القديم
// ==================================================

async function fetchFromOldApi(
    url,
    type,
    quality
) {

    const apiUrl =
        buildApiUrl(
            OLD_API_BASE,
            url,
            type,
            quality
        );

    console.log(
        "[HINA YOUTUBE] Old API:",
        apiUrl
    );

    try {

        const response =
            await axios.get(
                apiUrl,
                {
                    timeout: 120000
                }
            );

        console.log(
            "[HINA YOUTUBE] Old API Status:",
            response.status
        );

        console.log(
            "[HINA YOUTUBE] Old API Response:",
            JSON.stringify(response.data)
        );

        const data =
            response.data;

        if (
            !data ||
            data.success !== true ||
            !data.data ||
            !data.data.download_url
        ) {

            throw new Error(
                "API القديم لم يرجع رابط تحميل صالح"
            );

        }

        return {

            title:
                data.data.title ||
                "YouTube",

            thumbnail:
                data.data.thumbnail ||
                null,

            download_url:
                data.data.download_url,

            type,

            quality,

            source_used:
                "old",

            is_fallback:
                true

        };

    } catch (error) {

        console.error(
            "[HINA YOUTUBE] Old API Error:",
            error.response?.status ||
            error.message
        );

        if (error.response?.data) {

            console.error(
                "[HINA YOUTUBE] Old API Error Data:",
                JSON.stringify(
                    error.response.data
                )
            );

        }

        throw error;

    }

}

// ==================================================
// جلب رابط التحميل
// ==================================================

async function fetchDownload(
    url,
    type,
    quality
) {

    try {

        return await fetchFromNewApi(
            url,
            type,
            quality
        );

    } catch (newError) {

        console.log(
            "[HINA YOUTUBE] محاولة استخدام API القديم..."
        );

        try {

            return await fetchFromOldApi(
                url,
                type,
                quality
            );

        } catch (oldError) {

            const newStatus =
                newError.response?.status ||
                "غير معروف";

            const oldStatus =
                oldError.response?.status ||
                "غير معروف";

            throw new Error(
                `فشل كلا الخادمين\nالجديد: ${newStatus}\nالقديم: ${oldStatus}`
            );

        }

    }

}

// ==================================================
// البحث في يوتيوب
// ==================================================

async function searchYouTube(query) {

    const result =
        await ytSearch(query);

    if (
        !result ||
        !result.videos ||
        result.videos.length === 0
    ) {

        return [];

    }

    return result.videos
        .slice(0, 10)
        .map(video => ({

            title:
                video.title,

            url:
                video.url,

            duration:
                video.timestamp ||
                video.duration?.timestamp ||
                "غير معروف",

            author:
                video.author?.name ||
                "غير معروف",

            thumbnail:
                video.thumbnail ||
                null

        }));

}

// ==================================================
// قائمة النتائج
// ==================================================

function sendSearchResults(
    api,
    event,
    videos
) {

    let message =
        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬\n\n";

    message +=
        "اختر الفيديو الذي تريد تحميله:\n\n";

    videos.forEach(
        (video, index) => {

            message +=
                `${index + 1}. ${video.title}\n`;

            message +=
                `   المدة: ${video.duration}\n`;

            message +=
                `   القناة: ${video.author}\n\n`;

        }
    );

    message +=
        "أرسل رقم الفيديو فقط";

    return api.sendMessage(
        message,
        event.threadID,
        (error, info) => {

            if (error) {

                console.error(
                    "[HINA YOUTUBE] Search Menu Error:",
                    error
                );

                return;

            }

            addHandleReply({

                name:
                    "يوتيوب",

                messageID:
                    info.messageID,

                author:
                    String(event.senderID),

                type:
                    "youtubeSearch",

                videos

            });

        },
        event.messageID
    );

}

// ==================================================
// قائمة النوع
// ==================================================

function sendTypeMenu(
    api,
    event,
    video
) {

    const message =
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬

الفيديو:
${video.title}

اختر نوع التحميل:

1. فيديو
2. صوت`;

    return api.sendMessage(
        message,
        event.threadID,
        (error, info) => {

            if (error) {

                console.error(
                    "[HINA YOUTUBE] Type Menu Error:",
                    error
                );

                return;

            }

            addHandleReply({

                name:
                    "يوتيوب",

                messageID:
                    info.messageID,

                author:
                    String(event.senderID),

                type:
                    "youtubeType",

                video

            });

        },
        event.messageID
    );

}

// ==================================================
// قائمة جودة الفيديو
// ==================================================

function sendVideoQualityMenu(
    api,
    event,
    video
) {

    let message =
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬

${video.title}

اختر جودة الفيديو:

`;

    VIDEO_QUALITIES.forEach(
        (quality, index) => {

            message +=
                `${index + 1}. ${quality}p\n`;

        }
    );

    return api.sendMessage(
        message,
        event.threadID,
        (error, info) => {

            if (error) {

                console.error(
                    "[HINA YOUTUBE] Video Quality Error:",
                    error
                );

                return;

            }

            addHandleReply({

                name:
                    "يوتيوب",

                messageID:
                    info.messageID,

                author:
                    String(event.senderID),

                type:
                    "youtubeQuality",

                video,

                mediaType:
                    "video"

            });

        },
        event.messageID
    );

}

// ==================================================
// قائمة جودة الصوت
// ==================================================

function sendAudioQualityMenu(
    api,
    event,
    video
) {

    let message =
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧ُوب ━━ ⌬

${video.title}

اختر جودة الصوت:

1. 128kbps
2. 320kbps`;

    return api.sendMessage(
        message,
        event.threadID,
        (error, info) => {

            if (error) {

                console.error(
                    "[HINA YOUTUBE] Audio Quality Error:",
                    error
                );

                return;

            }

            addHandleReply({

                name:
                    "يوتيوب",

                messageID:
                    info.messageID,

                author:
                    String(event.senderID),

                type:
                    "youtubeQuality",

                video,

                mediaType:
                    "audio"

            });

        },
        event.messageID
    );

}

// ==================================================
// تحميل وإرسال الملف
// ==================================================

async function downloadAndSend(
    api,
    event,
    video,
    mediaType,
    quality
) {

    let filePath = null;

    try {

        const typeText =
            mediaType === "audio"
                ? "صوت"
                : "فيديو";

        const qualityText =
            mediaType === "audio"
                ? `${quality}kbps`
                : `${quality}p`;

        await api.sendMessage(
            `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬

جاري تجهيز التحميل...

النوع: ${typeText}
الجودة: ${qualityText}`,
            event.threadID,
            event.messageID
        );

        // ==========================================
        // جلب رابط التحميل
        // ==========================================

        const result =
            await fetchDownload(
                video.url,
                mediaType,
                quality
            );

        if (
            !result ||
            !result.download_url
        ) {

            throw new Error(
                "لم يتم الحصول على رابط تحميل"
            );

        }

        console.log(
            "[HINA YOUTUBE] Download URL:",
            result.download_url
        );

        // ==========================================
        // تجهيز اسم الملف
        // ==========================================

        ensureCache();

        const timestamp =
            Date.now();

        const extension =
            mediaType === "audio"
                ? "mp3"
                : "mp4";

        filePath =
            path.join(
                CACHE_DIR,
                `${timestamp}_youtube.${extension}`
            );

        // ==========================================
        // تنزيل الملف
        // ==========================================

        console.log(
            "[HINA YOUTUBE] Downloading file..."
        );

        const fileResponse =
            await axios.get(
                result.download_url,
                {
                    responseType:
                        "arraybuffer",

                    timeout:
                        120000,

                    maxContentLength:
                        Infinity,

                    maxBodyLength:
                        Infinity,

                    headers: {

                        "User-Agent":
                            "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36"

                    }

                }
            );

        if (
            !fileResponse.data ||
            fileResponse.data.length === 0
        ) {

            throw new Error(
                "الملف الذي تم تنزيله فارغ"
            );

        }

        // ==========================================
        // حفظ الملف
        // ==========================================

        fs.writeFileSync(
            filePath,
            Buffer.from(
                fileResponse.data
            )
        );

        console.log(
            "[HINA YOUTUBE] File saved:",
            filePath
        );

        if (
            !fs.existsSync(filePath)
        ) {

            throw new Error(
                "تعذر إنشاء ملف التحميل"
            );

        }

        const stats =
            fs.statSync(filePath);

        if (
            !stats ||
            stats.size <= 0
        ) {

            throw new Error(
                "ملف التحميل فارغ"
            );

        }

        console.log(
            "[HINA YOUTUBE] File size:",
            stats.size
        );

        // ==========================================
        // إرسال الملف
        // ==========================================

        const sendMessage =
            {

                body:
                    `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬

${video.title}

النوع: ${typeText}
الجودة: ${qualityText}`,

                attachment:
                    fs.createReadStream(
                        filePath
                    )

            };

        return api.sendMessage(
            sendMessage,
            event.threadID,

            (sendError) => {

                if (sendError) {

                    console.error(
                        "[HINA YOUTUBE] Send File Error:",
                        sendError
                    );

                    api.sendMessage(
                        `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬

فشل إرسال الملف.

${sendError.message || sendError}`,
                        event.threadID,
                        event.messageID
                    );

                } else {

                    console.log(
                        "[HINA YOUTUBE] File sent successfully"
                    );

                }

                // ==================================
                // تنظيف الكاش
                // ==================================

                removeFile(
                    filePath
                );

            },

            event.messageID
        );

    } catch (error) {

        console.error(
            "================================="
        );

        console.error(
            "[HINA YOUTUBE] DOWNLOAD ERROR"
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Status:",
            error.response?.status
        );

        console.error(
            "Response:",
            error.response?.data
        );

        console.error(
            "URL:",
            error.config?.url
        );

        console.error(
            "================================="
        );

        removeFile(
            filePath
        );

        return api.sendMessage(
            `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧𝗨𝗕𝗘 ━━ ⌬

فشل تجهيز الملف.

السبب:
${error.message || "خطأ غير معروف"}`,
            event.threadID,
            event.messageID
        );

    }

}

// ==================================================
// الأمر الأساسي
// ==================================================

module.exports.run = async function ({
    api,
    event,
    args
}) {

    const query =
        args.join(" ").trim();

    if (!query) {

        return api.sendMessage(
            `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧ُوب ━━ ⌬

اكتب اسم الفيديو الذي تريد البحث عنه.

مثال:
.يوتيوب Aizen Bankai`,
            event.threadID,
            event.messageID
        );

    }

    try {

        // ==========================================
        // إذا أرسل رابط مباشر
        // ==========================================

        const directUrl =
            extractYouTubeUrl(query);

        if (directUrl) {

            const video = {

                title:
                    "YouTube",

                url:
                    directUrl,

                duration:
                    "غير معروف",

                author:
                    "غير معروف",

                thumbnail:
                    null

            };

            return sendTypeMenu(
                api,
                event,
                video
            );

        }

        // ==========================================
        // البحث بالاسم
        // ==========================================

        await api.sendMessage(
            `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧ُوب ━━ ⌬

جاري البحث عن:
${query}`,
            event.threadID,
            event.messageID
        );

        const videos =
            await searchYouTube(
                query
            );

        if (
            !videos ||
            videos.length === 0
        ) {

            return api.sendMessage(
                `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧ُوب ━━ ⌬

لم أجد نتائج لهذا البحث.`,
                event.threadID,
                event.messageID
            );

        }

        return sendSearchResults(
            api,
            event,
            videos
        );

    } catch (error) {

        console.error(
            "[HINA YOUTUBE] SEARCH ERROR:",
            error
        );

        return api.sendMessage(
            `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧ُوب ━━ ⌬

حدث خطأ أثناء البحث.

${error.message || "خطأ غير معروف"}`,
            event.threadID,
            event.messageID
        );

    }

};

// ==================================================
// HandleReply
// ==================================================

module.exports.handleReply = async function ({
    api,
    event,
    handleReply
}) {

    try {

        // ==========================================
        // حماية المستخدم
        // ==========================================

        if (
            handleReply.author &&
            String(event.senderID) !==
            String(handleReply.author)
        ) {

            return;

        }

        // ==========================================
        // مرحلة اختيار الفيديو
        // ==========================================

        if (
            handleReply.type ===
            "youtubeSearch"
        ) {

            const number =
                parseInt(
                    String(
                        event.body || ""
                    ).trim()
                );

            if (
                isNaN(number) ||
                number < 1 ||
                number > handleReply.videos.length
            ) {

                return api.sendMessage(
                    "أرسل رقمًا صحيحًا من قائمة النتائج.",
                    event.threadID,
                    event.messageID
                );

            }

            const video =
                handleReply.videos[
                    number - 1
                ];

            return sendTypeMenu(
                api,
                event,
                video
            );

        }

        // ==========================================
        // مرحلة اختيار النوع
        // ==========================================

        if (
            handleReply.type ===
            "youtubeType"
        ) {

            const choice =
                String(
                    event.body || ""
                ).trim();

            if (
                choice === "1"
            ) {

                return sendVideoQualityMenu(
                    api,
                    event,
                    handleReply.video
                );

            }

            if (
                choice === "2"
            ) {

                return sendAudioQualityMenu(
                    api,
                    event,
                    handleReply.video
                );

            }

            return api.sendMessage(
                "أرسل 1 للفيديو أو 2 للصوت.",
                event.threadID,
                event.messageID
            );

        }

        // ==========================================
        // مرحلة اختيار الجودة
        // ==========================================

        if (
            handleReply.type ===
            "youtubeQuality"
        ) {

            const choice =
                parseInt(
                    String(
                        event.body || ""
                    ).trim()
                );

            let qualities;

            if (
                handleReply.mediaType ===
                "audio"
            ) {

                qualities =
                    AUDIO_QUALITIES;

            } else {

                qualities =
                    VIDEO_QUALITIES;

            }

            if (
                isNaN(choice) ||
                choice < 1 ||
                choice > qualities.length
            ) {

                return api.sendMessage(
                    "أرسل رقم الجودة الصحيح من القائمة.",
                    event.threadID,
                    event.messageID
                );

            }

            const quality =
                qualities[
                    choice - 1
                ];

            return downloadAndSend(
                api,
                event,
                handleReply.video,
                handleReply.mediaType,
                quality
            );

        }

    } catch (error) {

        console.error(
            "[HINA YOUTUBE] HANDLE REPLY ERROR:",
            error
        );

        return api.sendMessage(
            `⌬ ━━ 𝗛𝗜𝗡𝗔 𝗬𝗢𝗨𝗧ُوب ━━ ⌬

حدث خطأ أثناء معالجة اختيارك.

${error.message || "خطأ غير معروف"}`,
            event.threadID,
            event.messageID
        );

    }

};