module.exports.config = {
    name: "سبوتي",
    version: "2.2.1",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "البحث عن الأغاني وإرسالها (نسخة مستقرة)",
    commandCategory: "media",
    usages: "سبوتي [اسم الأغنية]",
    cooldowns: 10
};

module.exports.run = async function ({ api, event, args }) {

    const axios = require("axios");
    const fs = require("fs-extra");
    const path = require("path");

    const {
        threadID,
        messageID
    } = event;

    // ==================================================
    // 🎵 اسم الأغنية
    // ==================================================

    const songName =
        args.join(" ");

    if (!songName) {

        return api.sendMessage(
            "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗦𝗣𝗢𝗧𝗜 ━━ ⌬\n\nيرجى كتابة اسم الأغنية التي تبحث عنها!",
            threadID,
            messageID
        );

    }

    // ==================================================
    // ❤️ دالة الرياكشن
    // ==================================================

    function setReaction(reaction) {

        if (
            !api ||
            typeof api.setMessageReaction !== "function"
        ) {

            console.error(
                "[SPOTI REACTION] setMessageReaction غير موجود"
            );

            return;

        }

        try {

            api.setMessageReaction(
                reaction,
                String(messageID),
                (error) => {

                    if (error) {

                        console.error(
                            `[SPOTI REACTION ERROR] ${reaction}`,
                            error
                        );

                        return;

                    }

                    console.log(
                        `[SPOTI REACTION SUCCESS] ${reaction}`
                    );

                },
                true
            );

        } catch (error) {

            console.error(
                `[SPOTI REACTION EXCEPTION] ${reaction}`,
                error
            );

        }

    }

    // ==================================================
    // 🔍 بدء البحث
    // ==================================================

    setReaction("🔍");

    try {

        // ==================================================
        // 🔎 البحث في Deezer
        // ==================================================

        const res =
            await axios.get(
                `https://api.deezer.com/search?q=${encodeURIComponent(songName)}&limit=1`
            );

        if (
            !res.data ||
            !res.data.data ||
            res.data.data.length === 0
        ) {

            setReaction("❌");

            return api.sendMessage(
                "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗦𝗣𝗢𝗧𝗜 ━━ ⌬\n\nلم أجد هذا المقطع، جرب كتابة اسم الفنان مع الأغنية.",
                threadID,
                messageID
            );

        }

        // ==================================================
        // 🎵 بيانات الأغنية
        // ==================================================

        const song =
            res.data.data[0];

        const audioUrl =
            song.preview;

        const title =
            song.title;

        const artist =
            song.artist?.name ||
            "غير معروف";

        const coverUrl =
            song.album?.cover_big;

        if (!audioUrl) {

            setReaction("❌");

            return api.sendMessage(
                "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗦𝗣𝗢𝗧𝗜 ━━ ⌬\n\nلم يتوفر مقطع صوتي لهذه الأغنية.",
                threadID,
                messageID
            );

        }

        if (!coverUrl) {

            setReaction("❌");

            return api.sendMessage(
                "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗦𝗣𝗢𝗧𝗜 ━━ ⌬\n\nلم تتوفر صورة للأغنية.",
                threadID,
                messageID
            );

        }

        // ==================================================
        // 📁 مجلد الكاش
        // ==================================================

        const cacheDir =
            path.join(
                __dirname,
                "cache"
            );

        if (
            !fs.existsSync(cacheDir)
        ) {

            fs.ensureDirSync(
                cacheDir
            );

        }

        const timestamp =
            Date.now();

        const audioPath =
            path.join(
                cacheDir,
                `${timestamp}_audio.mp3`
            );

        const coverPath =
            path.join(
                cacheDir,
                `${timestamp}_cover.jpg`
            );

        // ==================================================
        // 🎵 وجد الأغنية
        // ==================================================

        setReaction("🎵");

        // ==================================================
        // 📥 تحميل الصوت والصورة
        // ==================================================

        const [
            audioRes,
            coverRes
        ] =
            await Promise.all([

                axios.get(
                    audioUrl,
                    {
                        responseType:
                            "arraybuffer"
                    }
                ),

                axios.get(
                    coverUrl,
                    {
                        responseType:
                            "arraybuffer"
                    }
                )

            ]);

        // ==================================================
        // 💾 حفظ الملفات
        // ==================================================

        fs.writeFileSync(
            audioPath,
            Buffer.from(
                audioRes.data
            )
        );

        fs.writeFileSync(
            coverPath,
            Buffer.from(
                coverRes.data
            )
        );

        // ==================================================
        // 🖼️ إرسال الغلاف
        // ==================================================

        const msg = {

            body:
`⌬ ━━ 𝗛𝗜𝗡𝗔 𝗦𝗣𝗢𝗧𝗜 ━━ ⌬

🎤 الفنان: ${artist}
🎵 الأغنية: ${title}

جاري إرسال المقطع الصوتي...`,

            attachment:
                fs.createReadStream(
                    coverPath
                )

        };

        return api.sendMessage(
            msg,
            threadID,

            (err) => {

                if (err) {

                    console.error(
                        "❌ Cover Send Error:",
                        err
                    );

                    setReaction("❌");

                    return;

                }

                // ==================================================
                // 🎶 إرسال المقطع
                // ==================================================

                api.sendMessage(
                    {
                        body:
                            `🎶 مقطع: ${title}`,

                        attachment:
                            fs.createReadStream(
                                audioPath
                            )

                    },

                    threadID,

                    (audioError) => {

                        // ==================================================
                        // ❌ خطأ إرسال الصوت
                        // ==================================================

                        if (audioError) {

                            console.error(
                                "❌ Audio Send Error:",
                                audioError
                            );

                            setReaction("❌");

                        } else {

                            setReaction("✅");

                        }

                        // ==================================================
                        // 🧹 تنظيف الكاش
                        // ==================================================

                        try {

                            if (
                                fs.existsSync(
                                    audioPath
                                )
                            ) {

                                fs.unlinkSync(
                                    audioPath
                                );

                            }

                            if (
                                fs.existsSync(
                                    coverPath
                                )
                            ) {

                                fs.unlinkSync(
                                    coverPath
                                );

                            }

                        } catch (error) {

                            console.error(
                                "❌ Cache Cleanup Error:",
                                error
                            );

                        }

                    },

                    messageID
                );

            },

            messageID
        );

    } catch (error) {

        console.error(
            "❌ HINA SPOTI ERROR:",
            error
        );

        setReaction("❌");

        return api.sendMessage(
            "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗦𝗣𝗢𝗧𝗜 ━━ ⌬\n\nحدث خطأ أثناء الاتصال بالمخدم، حاول لاحقاً.",
            threadID,
            messageID
        );

    }

};