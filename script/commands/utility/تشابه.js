/**
 * تشابه.js
 * البحث عن صور مشابهة باستخدام Google Lens
 *
 * الاستخدام:
 * 1. رد على أي صورة بـ:
 *    تشابه
 *
 * 2. البوت يجلب 5 صور مشابهة.
 *
 * 3. للنتائج الإضافية:
 *    المزيد
 *
 * النظام يستخدم HINA handleReply
 */

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "تشابه",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "البحث عن صور مشابهة باستخدام Google Lens",
    commandCategory: "utility",
    usages: "تشابه",
    cooldowns: 5
};

// ==================================================
// الإعدادات
// ==================================================

const RESULTS_PER_PAGE = 5;

const HINA_HEADER =
    "⌬ ━━ 𝗛𝗜𝗡𝗔  ━━ ⌬\n\n";

const CACHE_DIR = path.join(
    __dirname,
    "cache",
    "similar"
);

fs.ensureDirSync(CACHE_DIR);

// ==================================================
// أدوات مساعدة
// ==================================================

function hinaMessage(text) {
    return HINA_HEADER + text;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * تنظيف الرابط
 */
function cleanUrl(url) {

    if (!url) return null;

    try {
        url = String(url)
            .replace(/&amp;/g, "&")
            .replace(/\\u0026/g, "&")
            .trim();

        if (
            !url.startsWith("http://") &&
            !url.startsWith("https://")
        ) {
            return null;
        }

        return url;
    } catch {
        return null;
    }
}

/**
 * استخراج صورة من رسالة Facebook
 */
function getImageFromEvent(event) {

    if (!event) return null;

    const reply = event.messageReply;

    if (
        reply &&
        Array.isArray(reply.attachments)
    ) {

        for (const attachment of reply.attachments) {

            if (
                attachment &&
                attachment.type === "photo" &&
                attachment.url
            ) {
                return cleanUrl(attachment.url);
            }

            if (
                attachment &&
                attachment.type === "image" &&
                attachment.url
            ) {
                return cleanUrl(attachment.url);
            }
        }
    }

    if (Array.isArray(event.attachments)) {

        for (const attachment of event.attachments) {

            if (
                attachment &&
                (
                    attachment.type === "photo" ||
                    attachment.type === "image"
                ) &&
                attachment.url
            ) {
                return cleanUrl(attachment.url);
            }
        }
    }

    return null;
}

// ==================================================
// Google Lens
// ==================================================

/**
 * إنشاء رابط Google Lens
 *
 * Google يسمح بالبحث عن صورة باستخدام رابطها.
 */
function createLensUrl(imageUrl) {

    return (
        "https://lens.google.com/uploadbyurl?url=" +
        encodeURIComponent(imageUrl)
    );
}

/**
 * تحميل صفحة Google Lens
 */
async function fetchLensPage(imageUrl) {

    const lensUrl = createLensUrl(imageUrl);

    const response = await axios.get(
        lensUrl,
        {
            timeout: 30000,

            maxRedirects: 10,

            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 " +
                    "(KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",

                "Accept":
                    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

                "Accept-Language":
                    "en-US,en;q=0.9"
            }
        }
    );

    return {
        html: response.data,
        finalUrl: response.request?.res?.responseUrl || lensUrl
    };
}

// ==================================================
// استخراج النتائج
// ==================================================

/**
 * Google Lens يغيّر HTML باستمرار.
 *
 * لذلك نستخدم أكثر من طريقة لاستخراج روابط الصور.
 */
function extractImageUrls(html, sourceImage) {

    const results = [];
    const seen = new Set();

    if (!html) return results;

    const $ = cheerio.load(html);

    function add(url) {

        url = cleanUrl(url);

        if (!url) return;

        // تجاهل الصورة الأصلية
        if (sourceImage && url === sourceImage) {
            return;
        }

        // تجاهل صور Google الداخلية
        if (
            url.includes("google.com/images/branding") ||
            url.includes("gstatic.com/images/branding")
        ) {
            return;
        }

        // تجاهل الصور الصغيرة جدًا أو بيانات base64
        if (
            url.startsWith("data:") ||
            url.startsWith("blob:")
        ) {
            return;
        }

        if (seen.has(url)) return;

        seen.add(url);
        results.push(url);
    }

    // ----------------------------------------------
    // 1. img src
    // ----------------------------------------------

    $("img").each((index, element) => {

        const src =
            $(element).attr("src");

        add(src);

        const dataSrc =
            $(element).attr("data-src");

        add(dataSrc);

        const dataUrl =
            $(element).attr("data-url");

        add(dataUrl);
    });

    // ----------------------------------------------
    // 2. srcset
    // ----------------------------------------------

    $("img").each((index, element) => {

        const srcset =
            $(element).attr("srcset");

        if (!srcset) return;

        const parts =
            srcset.split(",");

        for (const part of parts) {

            const url =
                part.trim().split(/\s+/)[0];

            add(url);
        }
    });

    // ----------------------------------------------
    // 3. استخراج الروابط الموجودة داخل HTML
    // ----------------------------------------------

    const urlRegex =
        /https?:\/\/[^"'\\\s<>]+/g;

    const matches =
        html.match(urlRegex) || [];

    for (const rawUrl of matches) {

        let url = rawUrl;

        url = url
            .replace(/\\u003d/g, "=")
            .replace(/\\u0026/g, "&")
            .replace(/\\\//g, "/")
            .replace(/&quot;/g, "")
            .replace(/\\x26/g, "&");

        /*
         * نحاول فقط الروابط التي تبدو كصور
         */
        if (
            /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url) ||
            url.includes("encrypted-tbn") ||
            url.includes("gstatic") ||
            url.includes("googleusercontent")
        ) {
            add(url);
        }
    }

    return results;
}

// ==================================================
// التحقق من أن الرابط صورة
// ==================================================

async function isImageUrl(url) {

    try {

        const response =
            await axios.head(
                url,
                {
                    timeout: 8000,
                    maxRedirects: 5,

                    headers: {
                        "User-Agent":
                            "Mozilla/5.0"
                    }
                }
            );

        const type =
            String(
                response.headers["content-type"] || ""
            ).toLowerCase();

        return type.startsWith("image/");

    } catch {

        /*
         * بعض المواقع تمنع HEAD.
         * لا نعتبرها فاشلة مباشرة.
         */

        return true;
    }
}

// ==================================================
// تجهيز النتائج
// ==================================================

async function getSimilarImages(
    imageUrl,
    alreadySent = []
) {

    const {
        html
    } = await fetchLensPage(imageUrl);

    const candidates =
        extractImageUrls(
            html,
            imageUrl
        );

    const old =
        new Set(alreadySent);

    const finalResults = [];

    for (const url of candidates) {

        if (finalResults.length >= RESULTS_PER_PAGE) {
            break;
        }

        if (old.has(url)) {
            continue;
        }

        const valid =
            await isImageUrl(url);

        if (!valid) {
            continue;
        }

        finalResults.push(url);

        await sleep(150);
    }

    return finalResults;
}

// ==================================================
// إرسال الصور
// ==================================================

async function sendImages(
    api,
    event,
    imageUrls,
    page,
    totalSent
) {

    if (!imageUrls.length) {

        return api.sendMessage(
            hinaMessage(
                "لم أجد صورًا مشابهة جديدة لهذه الصورة."
            ),
            event.threadID,
            event.messageID
        );
    }

    await api.sendMessage(
        hinaMessage(
            `تم العثور على ${imageUrls.length} صور مشابهة\n\n` +
            `الدفعة رقم ${page}\n` +
            `للنتائج الإضافية اكتب: المزيد`
        ),
        event.threadID,
        event.messageID
    );

    for (const url of imageUrls) {

        try {

            await api.sendMessage(
                {
                    body: "",
                    attachment: await downloadImage(url)
                },
                event.threadID
            );

        } catch (error) {

            console.log(
                "[تشابه] فشل إرسال صورة:",
                error.message
            );
        }

        await sleep(500);
    }

    return true;
}

// ==================================================
// تحميل الصورة كملف مؤقت
// ==================================================

async function downloadImage(url) {

    const extension =
        getExtensionFromUrl(url);

    const fileName =
        "similar_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .slice(2) +
        extension;

    const filePath =
        path.join(
            CACHE_DIR,
            fileName
        );

    const response =
        await axios.get(
            url,
            {
                responseType: "arraybuffer",
                timeout: 20000,
                maxRedirects: 5,

                headers: {
                    "User-Agent":
                        "Mozilla/5.0"
                }
            }
        );

    const contentType =
        String(
            response.headers["content-type"] || ""
        ).toLowerCase();

    if (
        contentType &&
        !contentType.startsWith("image/")
    ) {

        throw new Error(
            "الرابط لا يحتوي على صورة"
        );
    }

    await fs.writeFile(
        filePath,
        response.data
    );

    return fs.createReadStream(
        filePath
    );
}

function getExtensionFromUrl(url) {

    const clean =
        String(url)
            .split("?")[0]
            .toLowerCase();

    if (clean.endsWith(".png")) {
        return ".png";
    }

    if (clean.endsWith(".webp")) {
        return ".webp";
    }

    if (clean.endsWith(".gif")) {
        return ".gif";
    }

    return ".jpg";
}

// ==================================================
// تنظيف الملفات القديمة
// ==================================================

async function cleanupCache() {

    try {

        const files =
            await fs.readdir(
                CACHE_DIR
            );

        const now =
            Date.now();

        for (const file of files) {

            const filePath =
                path.join(
                    CACHE_DIR,
                    file
                );

            const stat =
                await fs.stat(
                    filePath
                );

            /*
             * حذف الملفات الأقدم من 10 دقائق
             */

            if (
                now - stat.mtimeMs >
                10 * 60 * 1000
            ) {

                await fs.remove(
                    filePath
                );
            }
        }

    } catch {}
}

// ==================================================
// إنشاء اللعبة / جلسة البحث
// ==================================================

const searches = new Map();

function createSearch(
    threadID,
    author,
    imageUrl
) {

    const id =
        Date.now().toString(36) +
        "_" +
        Math.random()
            .toString(36)
            .slice(2);

    const search = {

        id,

        threadID,

        author,

        imageUrl,

        page: 0,

        sent: [],

        createdAt: Date.now(),

        active: true
    };

    searches.set(
        id,
        search
    );

    return search;
}

// ==================================================
// البحث عن جلسة المستخدم
// ==================================================

function getSearch(
    threadID,
    userID
) {

    for (const search of searches.values()) {

        if (
            search.threadID === threadID &&
            search.author === userID &&
            search.active
        ) {

            return search;
        }
    }

    return null;
}

// ==================================================
// إنهاء البحث
// ==================================================

function removeSearch(id) {

    const search =
        searches.get(id);

    if (!search) return;

    search.active = false;

    searches.delete(id);
}

// ==================================================
// الأمر الأساسي
// ==================================================

module.exports.run = async function ({
    api,
    event,
    args
}) {

    await cleanupCache();

    const senderID =
        event.senderID;

    const threadID =
        event.threadID;

    /*
     * ----------------------------------------------
     * المزيد
     * ----------------------------------------------
     */

    if (
        args &&
        args[0] &&
        String(args[0])
            .toLowerCase() === "المزيد"
    ) {

        const search =
            getSearch(
                threadID,
                senderID
            );

        if (!search) {

            return api.sendMessage(
                hinaMessage(
                    "لا توجد عملية بحث نشطة لك."
                ),
                threadID,
                event.messageID
            );
        }

        return loadMore(
            api,
            event,
            search
        );
    }

    /*
     * ----------------------------------------------
     * يجب أن يكون الأمر ردًا على صورة
     * ----------------------------------------------
     */

    const imageUrl =
        getImageFromEvent(event);

    if (!imageUrl) {

        return api.sendMessage(
            hinaMessage(
                "رد على صورة واكتب تشابه."
            ),
            threadID,
            event.messageID
        );
    }

    /*
     * إذا كان للمستخدم بحث سابق
     * نحذفه ونبدأ بحثًا جديدًا
     */

    const oldSearch =
        getSearch(
            threadID,
            senderID
        );

    if (oldSearch) {

        removeSearch(
            oldSearch.id
        );
    }

    const search =
        createSearch(
            threadID,
            senderID,
            imageUrl
        );

    await api.sendMessage(
        hinaMessage(
            "جاري البحث عن صور مشابهة عبر Google Lens..."
        ),
        threadID,
        event.messageID
    );

    try {

        const results =
            await getSimilarImages(
                imageUrl,
                []
            );

        if (!results.length) {

            removeSearch(
                search.id
            );

            return api.sendMessage(
                hinaMessage(
                    "لم أتمكن من العثور على صور مشابهة."
                ),
                threadID,
                event.messageID
            );
        }

        search.page = 1;

        search.sent.push(
            ...results
        );

        await sendImages(
            api,
            event,
            results,
            search.page,
            search.sent.length
        );

        registerReply(
            search,
            event,
            api
        );

        /*
         * حذف الجلسة بعد 30 دقيقة
         */

        setTimeout(() => {

            if (
                searches.has(search.id)
            ) {

                removeSearch(
                    search.id
                );
            }

        }, 30 * 60 * 1000);

    } catch (error) {

        console.error(
            "[تشابه] Lens Error:",
            error.message
        );

        removeSearch(
            search.id
        );

        return api.sendMessage(
            hinaMessage(
                "حدث خطأ أثناء البحث بالصورة."
            ),
            threadID,
            event.messageID
        );
    }
};

// ==================================================
// جلب المزيد
// ==================================================

async function loadMore(
    api,
    event,
    search
) {

    if (!search.active) {

        return api.sendMessage(
            hinaMessage(
                "انتهت عملية البحث."
            ),
            event.threadID,
            event.messageID
        );
    }

    await api.sendMessage(
        hinaMessage(
            "جاري البحث عن نتائج إضافية..."
        ),
        event.threadID,
        event.messageID
    );

    try {

        const results =
            await getSimilarImages(
                search.imageUrl,
                search.sent
            );

        if (!results.length) {

            return api.sendMessage(
                hinaMessage(
                    "لم أجد نتائج إضافية حاليًا."
                ),
                event.threadID,
                event.messageID
            );
        }

        search.page++;

        search.sent.push(
            ...results
        );

        await sendImages(
            api,
            event,
            results,
            search.page,
            search.sent.length
        );

        registerReply(
            search,
            event,
            api
        );

    } catch (error) {

        console.error(
            "[تشابه] More Error:",
            error.message
        );

        return api.sendMessage(
            hinaMessage(
                "حدث خطأ أثناء جلب المزيد من الصور."
            ),
            event.threadID,
            event.messageID
        );
    }
}

// ==================================================
// Handle Reply
// ==================================================

function registerReply(
    search,
    event,
    api
) {

    if (!global.client.handleReply) {

        global.client.handleReply = [];
    }

    /*
     * نحذف التسجيلات القديمة لنفس البحث
     */

    global.client.handleReply =
        global.client.handleReply.filter(
            item =>
                !(
                    item.name === "تشابه" &&
                    item.searchID === search.id
                )
        );

    global.client.handleReply.push({

        name: "تشابه",

        messageID:
            event.messageID,

        author:
            search.author,

        threadID:
            search.threadID,

        searchID:
            search.id
    });
}

// ==================================================
// Handle Reply Handler
// ==================================================

module.exports.handleReply = async function ({
    api,
    event,
    handleReply
}) {

    if (!handleReply) return;

    if (
        handleReply.name !== "تشابه"
    ) {
        return;
    }

    if (
        event.threadID !==
        handleReply.threadID
    ) {
        return;
    }

    if (
        event.senderID !==
        handleReply.author
    ) {
        return;
    }

    const search =
        searches.get(
            handleReply.searchID
        );

    if (!search || !search.active) {

        return api.sendMessage(
            hinaMessage(
                "انتهت عملية البحث."
            ),
            event.threadID,
            event.messageID
        );
    }

    const text =
        String(
            event.body || ""
        )
            .trim()
            .toLowerCase();

    if (
        text !== "المزيد"
    ) {

        return;
    }

    await loadMore(
        api,
        event,
        search
    );
};