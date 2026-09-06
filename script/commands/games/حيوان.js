"use strict";

/*
============================================================
 HINA PET SYSTEM
 MAIN ENGINE
============================================================

 هذا الملف هو المحرك الرئيسي فقط.

 جميع الأنظمة الفعلية موجودة داخل:
 ./حيوان/

 pets.js
 leveling.js
 stars.js
 stats.js
 inventory.js
 shop.js
 care.js
 training.js
 mission.js
 achievements.js
 leaderboard.js
 Pdata.js

============================================================
*/

const Pdata = require("./حيوان/Pdata");
const Pets = require("./حيوان/pets");
const Leveling = require("./حيوان/leveling");
const Stars = require("./حيوان/stars");
const Stats = require("./حيوان/stats");
const Inventory = require("./حيوان/inventory");
const Shop = require("./حيوان/shop");
const Care = require("./حيوان/care");
const Training = require("./حيوان/training");
const Mission = require("./حيوان/mission");
const Achievements = require("./حيوان/achievements");
const Leaderboard = require("./حيوان/leaderboard");

/* =========================================================
   CONFIG
========================================================= */

module.exports.config = {
    name: "حيوان",
    version: "1.0.0",
    credits: "أبو هريرة",
    description:
        "المحرك الرئيسي لنظام الحيوانات الأليفة",
    commandCategory: "Games",
    hasPermssion: 0,

    usages:
        "حيوان | قائمة | متجر | حالة | حقيبة | تدريب | إطعام | علاج | مهام | إنجازات | نجوم | تصدر",

    cooldowns: 3
};

/* =========================================================
   HELPERS
========================================================= */

function getModel(models, name) {
    if (!models) {
        throw new Error(
            "Database models are required"
        );
    }

    if (
        typeof models.use === "function"
    ) {
        const model =
            models.use(name);

        if (model) {
            return model;
        }
    }

    if (models[name]) {
        return models[name];
    }

    throw new Error(
        `${name} model not found`
    );
}

function normalizeInput(args) {
    if (!Array.isArray(args)) {
        return "";
    }

    return args
        .join(" ")
        .trim();
}

function normalizeAction(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}

function formatNumber(value) {
    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return "0";
    }

    return Math.floor(number)
        .toLocaleString("en-US");
}

function getUserID(event) {
    return String(
        event?.senderID || ""
    );
}

/* =========================================================
   TARGET USER
========================================================= */

function getTargetUserID(event) {
    if (
        event?.mentions &&
        Object.keys(
            event.mentions
        ).length > 0
    ) {
        return String(
            Object.keys(
                event.mentions
            )[0]
        );
    }

    if (
        event?.messageReply?.senderID
    ) {
        return String(
            event.messageReply.senderID
        );
    }

    return String(
        event?.senderID || ""
    );
}

/* =========================================================
   PET DATA
========================================================= */

async function getPlayer(
    models,
    userID
) {
    return await Pdata.getPlayerData(
        models,
        userID
    );
}

async function getPet(
    models,
    userID
) {
    const player =
        await getPlayer(
            models,
            userID
        );

    return {
        player,
        pet:
            player?.pet || null,
        currency:
            player?.currency || null
    };
}

/* =========================================================
   PET LIST
========================================================= */

function buildPetsList() {
    const header =
        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n";

    let text =
        header +
        "🐾 قائمة الحيوانات\n\n";

    const rarities =
        Pets.RARITY_ORDER || [];

    for (
        const rarity of rarities
    ) {
        const list =
            Pets.getPetsByRarity(
                rarity
            );

        if (
            !Array.isArray(list) ||
            list.length === 0
        ) {
            continue;
        }

        text +=
            `〖 ${rarity} 〗\n\n`;

        for (
            const pet of list
        ) {
            text +=
                `${pet.id}. ` +
                `${pet.emoji || "🐾"} ` +
                `${pet.name}\n` +

                `   القوة الأساسية: ` +
                `${formatNumber(
                    pet.basePower
                )}\n` +

                `   الصحة الأساسية: ` +
                `${formatNumber(
                    pet.baseHealth
                )}\n` +

                `   السعر: ` +
                (
                    Number(pet.price) === 0
                        ? "مجاني"
                        : `${formatNumber(
                            pet.price
                        )} عملة`
                ) +

                "\n\n";
        }
    }

    return text.trim();
}

/* =========================================================
   PET STATUS
========================================================= */

function buildPetStatus(pet) {
    if (!pet) {
        return (
            "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +
            "❌ لا تملك حيوانًا حاليًا."
        );
    }

    /*
    ========================================================
       قراءة بيانات Sequelize بشكل آمن
    ========================================================
    */

    const petValues =
        pet?.dataValues &&
        typeof pet.dataValues === "object"
            ? pet.dataValues
            : pet;

    const petType =
        petValues?.type ||
        pet.type;

    const petName =
        petValues?.name ||
        pet.name;

    const petLevel =
        petValues?.level;

    const petStars =
        petValues?.stars;

    const petHealth =
        petValues?.health;

    const petHunger =
        petValues?.hunger;

    const petXP =
        petValues?.exp;

    const petStatus =
        petValues?.status;

    const petRarity =
        petValues?.rarity;

    const petData =
        Pets.getPetByType(
            petType
        );

    if (!petData) {
        return (
            "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +
            "❌ تعذر العثور على بيانات هذا الحيوان."
        );
    }

    /* =====================================================
       المستوى
    ===================================================== */

    const level =
        Leveling.normalizeLevel(
            petLevel,
            petType
        );

    /* =====================================================
       النجوم
    ===================================================== */

    const stars =
        Stars.normalizeStars(
            petStars
        );

    /* =====================================================
       الإحصائيات
    ===================================================== */

    const currentHealth =
        petHealth === undefined ||
        petHealth === null
            ? null
            : Number(petHealth);

    const currentHunger =
        petHunger === undefined ||
        petHunger === null
            ? null
            : Number(petHunger);

    const stats =
        Stats.getStats(
            petData,
            level,
            stars,
            currentHealth,
            currentHunger
        );

    /* =====================================================
       البيانات النهائية
    ===================================================== */

    const emoji =
        petData.emoji ||
        "🐾";

    const rarity =
        petRarity ||
        petData.rarity ||
        "شائع";

    const status =
        petStatus ||
        "سعيد";

    const xp =
        Leveling.normalizeXP(
            petXP
        );

    const effectiveLevel =
        stats.effectiveLevel;

    return (
        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

        `${emoji} ${petName || petData.name}\n\n` +

        `النوع: ${petType}\n` +
        `الندرة: ${rarity}\n\n` +

        `⭐ المستوى: ${level}/${Stats.MAX_LEVEL}\n` +
        `✦ النجوم: ${"⭐".repeat(stars) || "—"}\n` +
        `⚡ المستوى الفعلي: ${effectiveLevel}\n\n` +

        `💪 القوة: ${formatNumber(
            stats.power
        )}\n` +

        `❤️ الصحة: ${formatNumber(
            stats.health
        )}/${formatNumber(
            stats.maxHealth
        )}\n` +

        `🍖 الشبع: ${formatNumber(
            stats.hunger
        )}/${formatNumber(
            stats.maxHunger
        )}\n` +

        `📊 نسبة الشبع: ${stats.hungerPercentage}%\n` +

        `⚡ XP: ${formatNumber(
            xp
        )}\n` +

        `💠 الحالة: ${status}`
    );
}

/* =========================================================
   INVENTORY
========================================================= */

function buildInventoryMessage(
    currency
) {
    const data =
        currency?.data || {};

    const items = {
        food:
            Number(data.food || 0),

        medicine:
            Number(data.medicine || 0),

        shields:
            Number(data.shields || 0),

        investmentCards:
            Number(
                data.investmentCards || 0
            ),

        xpCards:
            Number(
                data.xpCards || 0
            ),

        trainingBoosters:
            Number(
                data.trainingBoosters || 0
            ),

        developmentStones:
            Number(
                data.developmentStones || 0
            )
    };

    return (
        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗕𝗔𝗚 ━━ ⌬\n\n" +

        `🍖 الطعام × ${items.food}\n` +
        `💊 الدواء × ${items.medicine}\n` +
        `🛡️ دروع الحماية × ${items.shields}\n` +
        `🎫 بطاقات الاستثمار × ${items.investmentCards}\n` +
        `⚡ بطاقات XP × ${items.xpCards}\n` +
        `🧪 منشطات التدريب × ${items.trainingBoosters}\n` +
        `💎 أحجار التطوير × ${items.developmentStones}`
    );
}

/* =========================================================
   BALANCE
========================================================= */

function buildBalanceMessage(
    currency
) {
    const money =
        Number(
            currency?.money || 0
        );

    const data =
        currency?.data || {};

    const investmentPoints =
        Number(
            data.investmentPoints || 0
        );

    return (
        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗕𝗔𝗟𝗔𝗡𝗖𝗘 ━━ ⌬\n\n" +

        `💰 الرصيد: ${formatNumber(
            money
        )} عملة\n` +

        `📈 نقاط الاستثمار: ${formatNumber(
            investmentPoints
        )}`
    );
}

/* =========================================================
   STARS
========================================================= */

async function handleStars(
    api,
    event,
    models
) {
    const userID =
        getUserID(event);

    const {
        pet
    } =
        await getPet(
            models,
            userID
        );

    if (!pet) {
        return api.sendMessage(
            "❌ لا تملك حيوانًا حاليًا.",
            event.threadID,
            event.messageID
        );
    }

    const info =
        Stars.getStarInfo(
            pet.level,
            pet.stars
        );

    let message =
        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗦𝗧𝗔𝗥𝗦 ━━ ⌬\n\n" +

        `⭐ النجوم: ${info.stars}/${info.maxStars}\n` +
        `⭐ المستوى: ${info.level}/${info.maxLevel}\n` +
        `✦ المستوى الفعلي: ${info.effectiveLevel}\n\n`;

    if (info.canPromote) {
        message +=
            "✓ الحيوان جاهز للترقية إلى النجمة التالية";
    } else if (info.isGameCompleted) {
        message +=
            "🏆 أكملت نظام الحيوانات بالكامل";
    } else {
        message +=
            `✦ الترقية متاحة عند الوصول إلى المستوى ${info.maxLevel}`;
    }

    return api.sendMessage(
        message,
        event.threadID,
        event.messageID
    );
}

/* =========================================================
   MISSIONS
========================================================= */

async function handleMissions(
    api,
    event,
    models,
    args
) {
    const action =
        normalizeAction(
            args?.[1] ||
            "status"
        );

    const missionType =
        args?.[1];

    const missionID =
        args?.[2];

    const result =
        await Mission.missionsCommand({
            models,
            userID:
                getUserID(event),
            action,
            missionType,
            missionID
        });

    return api.sendMessage(
        result.message ||
        "تم تنفيذ العملية",
        event.threadID,
        event.messageID
    );
}

/* =========================================================
   CARE
========================================================= */

async function handleCare(
    api,
    event,
    models,
    action,
    amount
) {
    const result =
        await Care.careCommand({
            api,
            event,
            models,

            userID:
                getUserID(event),

            action,

            amount:
                amount || 1
        });

    if (
        result &&
        result.message
    ) {
        return;
    }

    return result;
}

/* =========================================================
   TRAINING
========================================================= */

async function handleTraining(
    api,
    event,
    models,
    action
) {
    const result =
        await Training.trainingCommand({
            models,

            userID:
                getUserID(event),

            action
        });

    if (
        result?.message
    ) {
        return api.sendMessage(
            result.message,
            event.threadID,
            event.messageID
        );
    }

    return api.sendMessage(
        result?.success
            ? "تم تنفيذ التدريب بنجاح"
            : (
                result?.message ||
                "تعذر تنفيذ التدريب"
            ),
        event.threadID,
        event.messageID
    );
}

/* =========================================================
   LEADERBOARD
========================================================= */

async function handleLeaderboard(
    api,
    event,
    models
) {
    const PetsModel =
        getModel(
            models,
            "Pets"
        );

    const CurrencyModel =
        getModel(
            models,
            "PetCurrency"
        );

    const UsersModel =
        getModel(
            models,
            "Users"
        );

    const text =
        await Leaderboard.getLeaderboard(
            api,
            PetsModel,
            CurrencyModel,
            UsersModel
        );

    const sent =
        await new Promise(
            resolve => {
                api.sendMessage(
                    text,
                    event.threadID,
                    (
                        error,
                        info
                    ) => {
                        if (error) {
                            resolve(null);
                            return;
                        }

                        resolve(info);
                    },
                    event.messageID
                );
            }
        );

    if (
        sent?.messageID
    ) {
        registerReply({
            name:
                module.exports.config.name,

            messageID:
                sent.messageID,

            author:
                String(
                    event.senderID
                ),

            type:
                "leaderboard_choice"
        });
    }

    return sent;
}

/* =========================================================
   REGISTER REPLY
========================================================= */

function registerReply(data) {
    if (
        !global.client
    ) {
        return;
    }

    if (
        !Array.isArray(
            global.client.handleReply
        )
    ) {
        global.client.handleReply = [];
    }

    global.client.handleReply.push(
        data
    );
}

/* =========================================================
   REMOVE REPLY
========================================================= */

function removeReply(
    handleReply
) {
    if (
        !Array.isArray(
            global.client?.handleReply
        )
    ) {
        return;
    }

    const index =
        global.client.handleReply
            .indexOf(
                handleReply
            );

    if (index !== -1) {
        global.client.handleReply.splice(
            index,
            1
        );
    }
}

/* =========================================================
   MAIN MENU
========================================================= */

function buildMainMenu(
    hasPet
) {
    return (
        "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +

        (
            hasPet
                ? "🐾 حيوانك جاهز\n\n"
                : "🐾 لا تملك حيوانًا بعد\n\n"
        ) +

        "الأوامر:\n\n" +

        "حيوان قائمة\n" +
        "حيوان حالة\n" +
        "حيوان حقيبة\n" +
        "حيوان متجر\n" +
        "حيوان تدريب\n" +
        "حيوان إطعام\n" +
        "حيوان علاج\n" +
        "حيوان مهام\n" +
        "حيوان إنجازات\n" +
        "حيوان نجوم\n" +
        "حيوان تصدر\n" +
        "حيوان رصيد"
    );
}

/* =========================================================
   RUN
========================================================= */

module.exports.run =
async function ({
    api,
    event,
    models,
    args
}) {
    const userID =
        getUserID(event);

    try {
        const input =
            normalizeInput(args);

        const parts =
            input
                ? input.split(/\s+/)
                : [];

        const action =
            normalizeAction(
                parts[0]
            );

        /* =====================================================
           لا يوجد أمر
        ===================================================== */

        if (!action) {
            const {
                pet
            } =
                await getPet(
                    models,
                    userID
                );

            return api.sendMessage(
                buildMainMenu(
                    Boolean(pet)
                ),
                event.threadID,
                event.messageID
            );
        }

        /* =====================================================
           القائمة
        ===================================================== */

        if (
            action === "قائمة" ||
            action === "list" ||
            action === "pets"
        ) {
            return api.sendMessage(
                buildPetsList(),
                event.threadID,
                event.messageID
            );
        }

        /* =====================================================
           الحالة
        ===================================================== */

        if (
            action === "حالة" ||
            action === "status" ||
            action === "معلومات"
        ) {
            const {
                pet
            } =
                await getPet(
                    models,
                    userID
                );

            return api.sendMessage(
                buildPetStatus(
                    pet
                ),
                event.threadID,
                event.messageID
            );
        }

        /* =====================================================
           الحقيبة
        ===================================================== */

        if (
            action === "حقيبة" ||
            action === "حقيبه" ||
            action === "bag" ||
            action === "inventory"
        ) {
            const {
                currency
            } =
                await getPet(
                    models,
                    userID
                );

            return api.sendMessage(
                buildInventoryMessage(
                    currency
                ),
                event.threadID,
                event.messageID
            );
        }

        /* =====================================================
           الرصيد
        ===================================================== */

        if (
            action === "رصيد" ||
            action === "balance"
        ) {
            const targetID =
                getTargetUserID(
                    event
                );

            const {
                currency
            } =
                await getPet(
                    models,
                    targetID
                );

            return api.sendMessage(
                buildBalanceMessage(
                    currency
                ),
                event.threadID,
                event.messageID
            );
        }

        /* =====================================================
           المتجر
        ===================================================== */

        if (
            action === "متجر" ||
            action === "shop"
        ) {
            return Shop.openShop({
                api,
                event,
                models
            });
        }

        /* =====================================================
           التدريب
        ===================================================== */

        if (
            action === "تدريب" ||
            action === "train" ||
            action === "منشط" ||
            action === "منشّط" ||
            action === "booster" ||
            action === "بطاقة" ||
            action === "xp"
        ) {
            return handleTraining(
                api,
                event,
                models,
                action
            );
        }

        /* =====================================================
           العناية
        ===================================================== */

        if (
            action === "إطعام" ||
            action === "اطعام" ||
            action === "أطعم" ||
            action === "طعام" ||
            action === "feed"
        ) {
            const amount =
                Number(
                    parts[1]
                );

            return handleCare(
                api,
                event,
                models,
                action,
                Number.isSafeInteger(
                    amount
                ) && amount > 0
                    ? amount
                    : 1
            );
        }

        if (
            action === "علاج" ||
            action === "عالج" ||
            action === "دواء" ||
            action === "heal"
        ) {
            const amount =
                Number(
                    parts[1]
                );

            return handleCare(
                api,
                event,
                models,
                action,
                Number.isSafeInteger(
                    amount
                ) && amount > 0
                    ? amount
                    : 1
            );
        }

        /* =====================================================
           المهام
        ===================================================== */

        if (
            action === "مهام" ||
            action === "مهمة" ||
            action === "missions" ||
            action === "mission"
        ) {
            return handleMissions(
                api,
                event,
                models,
                parts
            );
        }

        /* =====================================================
           الإنجازات
        ===================================================== */

        if (
            action === "إنجازات" ||
            action === "انجازات" ||
            action === "achievements"
        ) {
            const result =
                await Achievements.achievementsCommand({
                    models,
                    userID
                });

            return api.sendMessage(
                result?.message ||
                "تعذر تحميل الإنجازات",
                event.threadID,
                event.messageID
            );
        }

        /* =====================================================
           النجوم
        ===================================================== */

        if (
            action === "نجوم" ||
            action === "نجمة" ||
            action === "stars"
        ) {
            return handleStars(
                api,
                event,
                models
            );
        }

        /* =====================================================
           التصدر
        ===================================================== */

        if (
            action === "تصدر" ||
            action === "تصدّر" ||
            action === "leaderboard"
        ) {
            return handleLeaderboard(
                api,
                event,
                models
            );
        }

        /* =====================================================
           أمر غير معروف
        ===================================================== */

        const {
            pet
        } =
            await getPet(
                models,
                userID
            );

        return api.sendMessage(
            buildMainMenu(
                Boolean(pet)
            ),
            event.threadID,
            event.messageID
        );

    } catch (error) {
        console.error(
            "[HINA PET ENGINE ERROR]",
            error
        );

        return api.sendMessage(
            "⌬ ━━ 𝗛𝗜𝗡𝗔 𝗣𝗘𝗧 ━━ ⌬\n\n" +
            "❌ حدث خطأ أثناء تنفيذ أمر الحيوانات\n" +
            "حاول مرة أخرى لاحقًا.",
            event.threadID,
            event.messageID
        );
    }
};

/* =========================================================
   HANDLE REPLY
========================================================= */

module.exports.handleReply =
async function ({
    api,
    event,
    handleReply,
    models
}) {
    try {
        if (!handleReply) {
            return;
        }

        /* =====================================================
           التحقق من صاحب الرد
        ===================================================== */

        if (
            handleReply.author &&
            String(
                handleReply.author
            ) !==
            String(
                event.senderID
            )
        ) {
            return;
        }

        /* =====================================================
           SHOP
        ===================================================== */

        if (
            handleReply.type ===
                "pet_shop" ||
            handleReply.type ===
                "pet_shop_quantity"
        ) {
            return Shop.handleReply({
                api,
                event,
                handleReply,
                models
            });
        }

        /* =====================================================
           LEADERBOARD
        ===================================================== */

        if (
            handleReply.type ===
            "leaderboard_choice"
        ) {
            removeReply(
                handleReply
            );

            return Leaderboard.handleReply({
                api,
                event,
                handleReply,
                models
            });
        }

        /* =====================================================
           CARE
        ===================================================== */

        if (
            typeof Care.handleReply ===
            "function"
        ) {
            const result =
                await Care.handleReply({
                    api,
                    event,
                    handleReply,
                    models
                });

            if (
                result !== undefined
            ) {
                return result;
            }
        }

        /* =====================================================
           UNKNOWN
        ===================================================== */

        return;

    } catch (error) {
        console.error(
            "[HINA PET REPLY ERROR]",
            error
        );

        return api.sendMessage(
            "❌ حدث خطأ أثناء معالجة الرد.",
            event.threadID,
            event.messageID
        );
    }
};

/* =========================================================
   EXPORT INTERNALS
========================================================= */

module.exports.engine = {
    Pdata,
    Pets,
    Leveling,
    Stars,
    Stats,
    Inventory,
    Shop,
    Care,
    Training,
    Mission,
    Achievements,
    Leaderboard
};