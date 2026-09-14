module.exports = function (input) {

    const force = false;

    const Users =
        require("./models/users")(input);

    const Threads =
        require("./models/threads")(input);

    const Currencies =
        require("./models/currencies")(input);

    const Pets =
        require("./models/Pets")(input);

    const PetCurrency =
        require("./models/PetCurrency")(input);


    // ============================================================
    // مزامنة الجداول بشكل آمن
    // ============================================================

    async function safeSync(name, model) {

        try {

            await model.sync({
                force
            });

            console.log(
                `✅ [DB] ${name} جاهز`
            );

            return true;

        } catch (error) {

            const message =
                error?.original?.message ||
                error?.parent?.message ||
                error?.message ||
                String(error);

            console.error(
                `❌ [DB] فشل مزامنة ${name}: ${message}`
            );

            return false;
        }
    }


    // ============================================================
    // تشغيل المزامنة بدون تعطيل تحميل البوت
    // ============================================================

    Promise.allSettled([

        safeSync(
            "Users",
            Users
        ),

        safeSync(
            "Threads",
            Threads
        ),

        safeSync(
            "Currencies",
            Currencies
        ),

        safeSync(
            "Pets",
            Pets
        ),

        safeSync(
            "PetCurrency",
            PetCurrency
        )

    ]).then(results => {

        const successCount =
            results.filter(
                result =>
                    result.status === "fulfilled" &&
                    result.value === true
            ).length;

        if (successCount === 5) {

            console.log(
                "✅ [DB] جميع الجداول جاهزة"
            );

        } else {

            console.warn(
                `⚠️ [DB] تم تجهيز ${successCount}/5 من الجداول`
            );

            console.warn(
                "⚠️ [DB] البوت سيستمر في التشغيل رغم مشكلة قاعدة البيانات"
            );
        }

    }).catch(error => {

        console.error(
            "❌ [DB] خطأ أثناء تهيئة قاعدة البيانات:",
            error?.message || error
        );

    });


    // ============================================================
    // إرجاع الـModels
    // ============================================================

    return {

        model: {

            Users,

            Threads,

            Currencies,

            Pets,

            PetCurrency

        },

        use: function (modelName) {

            return this.model[
                `${modelName}`
            ];

        }

    };

};