const express = require("express");
const app = express();
const chalk = require("chalk");
const cron = require("node-cron");
const moment = require("moment-timezone");

const port = process.env.PORT || 8000;

// ═══════════════════════════════════════════════
//           KIRA — HELLGATE UPTIME PAGE
// ═══════════════════════════════════════════════

app.get("/", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>KIRA BOT</title>
</head>
<body>
    <h1>KIRA BOT</h1>
    <p>Bot is online.</p>
</body>
</html>
    `);
});

app.listen(port, () => {
    console.log(
        chalk.cyan(
            `📡 Health check server is running on port ${port}`
        )
    );
});

// ═══════════════════════════════════════════════
// لا يتم حذف بيانات البوت عند إعادة التشغيل
// ═══════════════════════════════════════════════

console.log(
    chalk.bold.hex("#00FA9A")(
        "[ DATA ] » تم الحفاظ على بيانات البوت وعدم حذفها عند التشغيل"
    )
);

// ═══════════════════════════════════════════════
//           SYSTEM FILES
// ═══════════════════════════════════════════════

const {
    readdirSync,
    readFileSync,
    writeFileSync,
    existsSync,
    unlinkSync
} = require("fs-extra");

const {
    join,
    resolve
} = require("path");

const logger = require("./utils/log.js");
const login = require("hut-chat-api");
const axios = require("axios");

// ═══════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════

console.log(
    chalk.bold.hex("#03f0fc")(
        "[ KIRA ] » "
    ) +
    chalk.bold.hex("#fcba03")(
        "Initializing variables..."
    )
);

// ═══════════════════════════════════════════════
// GLOBAL CLIENT
// ═══════════════════════════════════════════════

global.client = new Object({
    commands: new Map(),
    events: new Map(),
    cooldowns: new Map(),
    eventRegistered: new Array(),
    handleSchedule: new Array(),
    handleReaction: new Array(),
    handleReply: new Array(),
    mainPath: process.cwd(),
    configPath: new String()
});

// ═══════════════════════════════════════════════
// GLOBAL DATA
// ═══════════════════════════════════════════════

global.data = new Object({
    threadInfo: new Map(),
    threadData: new Map(),
    userName: new Map(),
    userBanned: new Map(),
    threadBanned: new Map(),
    commandBanned: new Map(),
    threadAllowNSFW: new Array(),
    allUserID: new Array(),
    allCurrenciesID: new Array(),
    allThreadID: new Array()
});

// ═══════════════════════════════════════════════
// GLOBAL UTILS
// ═══════════════════════════════════════════════

global.utils = require("./utils/index.js");
global.utils.config = require("./utils/config.js");
global.utils.decorations = require("./utils/decorations.js");

global.nodemodule = new Object();
global.config = new Object();
global.configModule = new Object();
global.moduleData = new Array();
global.language = new Object();

// ═══════════════════════════════════════════════
// تحميل الإعدادات
// ═══════════════════════════════════════════════

var configValue;

try {

    global.client.configPath =
        join(
            global.client.mainPath,
            "config.json"
        );

    configValue =
        require(
            global.client.configPath
        );

    logger.loader(
        "Found file config: config.json"
    );

} catch (error) {

    logger.loader(
        "config.json not found!",
        "error"
    );

    process.exit(1);
}

try {

    for (const key in configValue) {

        global.config[key] =
            configValue[key];

    }

    logger.loader(
        "Config Loaded!"
    );

} catch (error) {

    logger.loader(
        "Can't load file config!",
        "error"
    );

    process.exit(1);
}

// ═══════════════════════════════════════════════
// DATABASE
// ═══════════════════════════════════════════════

const {
    Sequelize,
    sequelize
} = require(
    "./includes/database/index.js"
);

writeFileSync(
    global.client.configPath + ".temp",
    JSON.stringify(
        global.config,
        null,
        4
    ),
    "utf8"
);

// ═══════════════════════════════════════════════
// تحميل اللغة
// ═══════════════════════════════════════════════

try {

    const languagePath =
        `${__dirname}/languages/${global.config.language || "en"}.lang`;

    const langFile =
        readFileSync(
            languagePath,
            {
                encoding: "utf-8"
            }
        ).split(/\r?\n|\r/);

    const langData =
        langFile.filter(
            item =>
                item.indexOf("#") !== 0 &&
                item !== ""
        );

    for (const item of langData) {

        const getSeparator =
            item.indexOf("=");

        if (getSeparator === -1) {
            continue;
        }

        const itemKey =
            item.slice(
                0,
                getSeparator
            );

        const itemValue =
            item.slice(
                getSeparator + 1
            );

        const dotIndex =
            itemKey.indexOf(".");

        if (dotIndex === -1) {
            continue;
        }

        const head =
            itemKey.slice(
                0,
                dotIndex
            );

        const key =
            itemKey.replace(
                head + ".",
                ""
            );

        const value =
            itemValue.replace(
                /\\n/gi,
                "\n"
            );

        if (
            typeof global.language[head] ===
            "undefined"
        ) {

            global.language[head] =
                new Object();

        }

        global.language[head][key] =
            value;

    }

} catch (error) {

    console.log(
        "Language Load Error: " +
        error.message
    );

}

// ═══════════════════════════════════════════════
// GET TEXT
// ═══════════════════════════════════════════════

global.getText = function (...args) {

    try {

        const langText =
            global.language;

        let text =
            langText[args[0]][args[1]];

        if (!text) {
            return `[${args[1]}]`;
        }

        for (
            let i = args.length - 1;
            i > 0;
            i--
        ) {

            const regEx =
                RegExp(
                    `%${i}`,
                    "g"
                );

            text =
                text.replace(
                    regEx,
                    args[i + 1]
                );

        }

        return text;

    } catch (error) {

        return `[${args[1]}]`;

    }

};

// ═══════════════════════════════════════════════
// APPSTATE
// ═══════════════════════════════════════════════

const appStateFile =
    resolve(
        join(
            global.client.mainPath,
            global.config.APPSTATEPATH ||
            "appstate.json"
        )
    );

let appState;

if (process.env.APPSTATE) {

    try {

        appState =
            JSON.parse(
                process.env.APPSTATE
            );

        logger.loader(
            "💌 ───『 تم العثور على APPSTATE في إعدادات السيرفر 』─── 💌"
        );

    } catch (error) {

        logger.loader(
            "خطأ في تنسيق JSON الخاص بـ APPSTATE!",
            "error"
        );

        process.exit(1);

    }

} else {

    try {

        appState =
            require(
                appStateFile
            );

        logger.loader(
            "💌 ───『 تم العثور على ملف appstate.json محلياً 』─── 💌"
        );

    } catch (error) {

        logger.loader(
            "لم يتم العثور على ملف تسجيل الدخول أو متغير البيئة APPSTATE!",
            "error"
        );

        process.exit(1);

    }

}

// ═══════════════════════════════════════════════
// AUTO RECONNECT SYSTEM
// ═══════════════════════════════════════════════

let reconnectAttempts = 0;

const MAX_RECONNECT_ATTEMPTS = 10;

const INITIAL_RECONNECT_DELAY = 5000;

const MAX_RECONNECT_DELAY = 60000;

let isConnecting = false;

let reconnectTimer = null;

let connectionGeneration = 0;

let activeApi = null;

let isConnected = false;

// ═══════════════════════════════════════════════
// حساب وقت إعادة الاتصال
// ═══════════════════════════════════════════════

function getReconnectDelay() {

    const delay =
        INITIAL_RECONNECT_DELAY *
        Math.pow(
            2,
            Math.max(
                reconnectAttempts - 1,
                0
            )
        );

    return Math.min(
        delay,
        MAX_RECONNECT_DELAY
    );

}

// ═══════════════════════════════════════════════
// إلغاء مؤقت إعادة الاتصال
// ═══════════════════════════════════════════════

function clearReconnectTimer() {

    if (reconnectTimer) {

        clearTimeout(
            reconnectTimer
        );

        reconnectTimer = null;

    }

}

// ═══════════════════════════════════════════════
// محاولة إيقاف الاتصال القديم
// ═══════════════════════════════════════════════

function closeOldConnection() {

    if (!activeApi) {
        return;
    }

    try {

        if (
            typeof activeApi.stopListening ===
            "function"
        ) {

            activeApi.stopListening();

        } else if (
            typeof activeApi.stopListenMqtt ===
            "function"
        ) {

            activeApi.stopListenMqtt();

        }

    } catch (error) {

        console.log(
            chalk.gray(
                "[ MQTT ] لا يمكن إيقاف الاتصال القديم: " +
                error.message
            )
        );

    }

    activeApi = null;
    isConnected = false;

}

// ═══════════════════════════════════════════════
// جدولة إعادة الاتصال
// ═══════════════════════════════════════════════

function scheduleReconnect(botModel) {

    if (reconnectTimer) {

        console.log(
            chalk.gray(
                "[ MQTT ] توجد بالفعل محاولة إعادة اتصال مجدولة."
            )
        );

        return;

    }

    reconnectAttempts++;

    if (
        reconnectAttempts >
        MAX_RECONNECT_ATTEMPTS
    ) {

        console.log(
            chalk.red(
                `❌ تم الوصول إلى الحد الأقصى لمحاولات إعادة الاتصال (${MAX_RECONNECT_ATTEMPTS}).`
            )
        );

        return;

    }

    const delay =
        getReconnectDelay();

    console.log(
        chalk.yellow(
            `⏳ إعادة الاتصال بعد ${delay / 1000} ثوانٍ — المحاولة ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`
        )
    );

    reconnectTimer =
        setTimeout(
            () => {

                reconnectTimer = null;

                onBot({
                    models: botModel
                });

            },
            delay
        );

}

// ═══════════════════════════════════════════════
// LOGIN / BOT
// ═══════════════════════════════════════════════

function onBot({ models: botModel }) {

    if (isConnecting) {

        console.log(
            chalk.gray(
                "[ MQTT ] توجد محاولة اتصال قيد التنفيذ بالفعل."
            )
        );

        return;

    }

    isConnecting = true;

    clearReconnectTimer();

    connectionGeneration++;

    const currentGeneration =
        connectionGeneration;

    closeOldConnection();

    const loginData = {
        appState
    };

    console.log(
        chalk.cyan(
            `🔌 محاولة الاتصال بـ Facebook... [${currentGeneration}]`
        )
    );

    login(
        loginData,
        async (
            loginError,
            loginApiData
        ) => {

            isConnecting = false;

            if (
                currentGeneration !==
                connectionGeneration
            ) {

                console.log(
                    chalk.gray(
                        "[ MQTT ] تم تجاهل نتيجة اتصال قديم."
                    )
                );

                return;

            }

            // ═══════════════════════════════════
            // LOGIN ERROR
            // ═══════════════════════════════════

            if (loginError) {

                isConnected = false;

                console.error(
                    chalk.red(
                        `❌ خطأ في تسجيل الدخول: ${
                            loginError.message ||
                            loginError
                        }`
                    )
                );

                scheduleReconnect(
                    botModel
                );

                return;

            }

            // ═══════════════════════════════════
            // LOGIN SUCCESS
            // ═══════════════════════════════════

            reconnectAttempts = 0;

            clearReconnectTimer();

            activeApi =
                loginApiData;

            isConnected = true;

            console.log(
                chalk.green(
                    "✅ تم تسجيل الدخول بنجاح!"
                )
            );

            // ═══════════════════════════════════
            // OPTIONS
            // ═══════════════════════════════════

            try {

                loginApiData.setOptions(
                    global.config.FCAOption
                );

            } catch (error) {

                console.log(
                    chalk.yellow(
                        "[ KIRA ] فشل تطبيق FCAOption: " +
                        error.message
                    )
                );

            }

            // ═══════════════════════════════════
            // حفظ APPSTATE
            // ═══════════════════════════════════

            try {

                writeFileSync(
                    appStateFile,
                    JSON.stringify(
                        loginApiData.getAppState(),
                        null,
                        "\t"
                    )
                );

            } catch (error) {

                console.log(
                    chalk.gray(
                        "[ APPSTATE ] " +
                        error.message
                    )
                );

            }

            global.config.version =
                "1.2.14";

            global.client.timeStart =
                new Date().getTime();

            // ═══════════════════════════════════
            // تحميل الأوامر
            // ═══════════════════════════════════

            const commandsPath =
                join(
                    global.client.mainPath,
                    "script",
                    "commands"
                );

            let categories = [];

            try {

                categories =
                    readdirSync(
                        commandsPath
                    ).filter(
                        item =>
                            require("fs").statSync(
                                join(
                                    commandsPath,
                                    item
                                )
                            ).isDirectory()
                    );

            } catch (error) {

                console.error(
                    chalk.red(
                        "[ COMMANDS ] فشل قراءة مجلد الأوامر: " +
                        error.message
                    )
                );

            }

            for (
                const category of categories
            ) {

                const categoryPath =
                    join(
                        commandsPath,
                        category
                    );

                let listCommand = [];

                try {

                    listCommand =
                        readdirSync(
                            categoryPath
                        ).filter(
                            command =>
                                command.endsWith(".js") &&
                                !(
                                    Array.isArray(
                                        global.config.commandDisabled
                                    )
                                        ? global.config.commandDisabled
                                        : []
                                ).includes(
                                    command
                                )
                        );

                } catch (error) {

                    console.log(
                        chalk.red(
                            `[ COMMANDS ] فشل قراءة ${category}: ${error.message}`
                        )
                    );

                    continue;

                }

                for (
                    const command of listCommand
                ) {

                    try {

                        const commandModule =
                            require(
                                join(
                                    categoryPath,
                                    command
                                )
                            );

                        if (
                            commandModule.config &&
                            commandModule.run
                        ) {

                            global.client.commands.set(
                                commandModule.config.name,
                                commandModule
                            );

                            logger.loader(
                                `🌸『 تـم تحميل: ${commandModule.config.name} 』🌸`
                            );

                        }

                    } catch (error) {

                        logger.loader(
                            `Fail load command: ${command}`,
                            "error"
                        );

                        console.log(
                            error
                        );

                    }

                }

            }

            // ═══════════════════════════════════
            // تحميل الأحداث
            // ═══════════════════════════════════

            const eventsPath =
                join(
                    global.client.mainPath,
                    "script",
                    "events"
                );

            if (
                existsSync(
                    eventsPath
                )
            ) {

                let events = [];

                try {

                    events =
                        readdirSync(
                            eventsPath
                        ).filter(
                            ev =>
                                ev.endsWith(".js")
                        );

                } catch (error) {

                    console.log(
                        chalk.red(
                            "[ EVENTS ] فشل قراءة الأحداث: " +
                            error.message
                        )
                    );

                    events = [];

                }

                for (
                    const ev of events
                ) {

                    try {

                        const event =
                            require(
                                join(
                                    eventsPath,
                                    ev
                                )
                            );

                        if (
                            event &&
                            event.config &&
                            event.config.name
                        ) {

                            global.client.events.set(
                                event.config.name,
                                event
                            );

                        }

                    } catch (error) {

                        logger.loader(
                            "Fail load event: " +
                            ev,
                            "error"
                        );

                    }

                }

            }

            logger.loader(
                `Loaded ${
                    global.client.commands.size
                } commands and ${
                    global.client.events.size
                } events`
            );

            // ═══════════════════════════════════════════════
            // حذف ملف config المؤقت
            // ═══════════════════════════════════════════════

            if (
                existsSync(
                    global.client.configPath +
                    ".temp"
                )
            ) {

                try {

                    unlinkSync(
                        global.client.configPath +
                        ".temp"
                    );

                } catch (error) {}

            }

            // ═══════════════════════════════════════════════
            // LISTENER
            // ═══════════════════════════════════════════════

            const listenerData = {
                api: loginApiData,
                models: botModel
            };

            let listener;

            try {

                listener =
                    require(
                        "./includes/listen.js"
                    )(
                        listenerData
                    );

            } catch (error) {

                console.error(
                    chalk.red(
                        "❌ فشل تحميل listen.js:"
                    ),
                    error
                );

                isConnected = false;

                scheduleReconnect(
                    botModel
                );

                return;

            }

            // ═══════════════════════════════════════════════
            // MQTT LISTENER
            // ═══════════════════════════════════════════════

            try {

                loginApiData.listenMqtt(
                    async (
                        error,
                        message
                    ) => {

                        // تجاهل أحداث اتصال قديم
                        if (
                            currentGeneration !==
                            connectionGeneration
                        ) {

                            return;

                        }

                        // ═══════════════════════════
                        // MQTT ERROR
                        // ═══════════════════════════

                        if (error) {

                            isConnected = false;

                            console.log(
                                chalk.red(
                                    `⚠️ قطع اتصال MQTT: ${
                                        error.message ||
                                        error
                                    }`
                                )
                            );

                            if (
                                activeApi !==
                                loginApiData
                            ) {

                                return;

                            }

                            activeApi = null;

                            try {

                                if (
                                    typeof loginApiData.stopListening ===
                                    "function"
                                ) {

                                    loginApiData.stopListening();

                                } else if (
                                    typeof loginApiData.stopListenMqtt ===
                                    "function"
                                ) {

                                    loginApiData.stopListenMqtt();

                                }

                            } catch (closeError) {}

                            console.log(
                                chalk.yellow(
                                    "🔄 سيتم إعادة الاتصال بشكل منظم..."
                                )
                            );

                            scheduleReconnect(
                                botModel
                            );

                            return;

                        }

                        // ═══════════════════════════
                        // MESSAGE
                        // ═══════════════════════════

                        if (!message) {
                            return;
                        }

                        // ═══════════════════════════
                        // HINA LISTENER
                        // ═══════════════════════════

                        try {

                            return await listener(
                                message
                            );

                        } catch (listenerError) {

                            console.error(
                                chalk.red(
                                    "❌ LISTENER ERROR:"
                                ),
                                listenerError
                            );

                        }

                    }
                );

            } catch (mqttError) {

                isConnected = false;

                console.error(
                    chalk.red(
                        "❌ فشل تشغيل MQTT:"
                    ),
                    mqttError
                );

                activeApi = null;

                scheduleReconnect(
                    botModel
                );

                return;

            }

            // ═══════════════════════════════════════════════
            // API
            // ═══════════════════════════════════════════════

            global.client.api =
                loginApiData;

            logger(
                "KIRA ✨",
                "[ by ayman ]"
            );

            // ═══════════════════════════════════════════════
            // رسالة تشغيل البوت
            // ═══════════════════════════════════════════════

            const timeNow =
                moment()
                    .tz("Africa/Casablanca")
                    .format("HH:mm:ss");

            if (
                global.config.ADMINBOT &&
                global.config.ADMINBOT[0]
            ) {

                try {

                    loginApiData.sendMessage(
                        `لـقـد تـم تـشـغـيـل الـبـوت فـي ${timeNow} ✅`,
                        global.config.ADMINBOT[0]
                    );

                } catch (error) {

                    console.log(
                        chalk.gray(
                            "[ ADMIN MESSAGE ] " +
                            error.message
                        )
                    );

                }

            }

            // ═══════════════════════════════════════════════
            // تحديث البايو
            // ═══════════════════════════════════════════════

            try {

                cron.schedule(
                    "0 0 */1 * * *",
                    () => {

                        if (
                            !activeApi ||
                            activeApi !==
                            loginApiData ||
                            !isConnected
                        ) {

                            return;

                        }

                        try {

                            const dateStr =
                                moment()
                                    .tz("Asia/Manila")
                                    .format("MM/DD/YYYY");

                            loginApiData.changeBio(
                                `Prefix: ${
                                    global.config.PREFIX
                                }\n\nBot Name: ${
                                    global.config.BOTNAME
                                }\nDate: ${
                                    dateStr
                                }`
                            );

                        } catch (error) {

                            console.log(
                                chalk.gray(
                                    "[ BIO ] " +
                                    error.message
                                )
                            );

                        }

                    },
                    {
                        scheduled: true,
                        timezone:
                            "Africa/Casablanca"
                    }
                );

            } catch (error) {

                console.log(
                    chalk.gray(
                        "[ CRON ] " +
                        error.message
                    )
                );

            }

            console.log(
                chalk.green(
                    "🟢 KIRA MQTT connection is active."
                )
            );

        }
    );

}

// ═══════════════════════════════════════════════
// START BOT
// ═══════════════════════════════════════════════

(async () => {

    try {

        await sequelize.authenticate();

        console.log(
            chalk.green(
                "✅ Database connection established."
            )
        );

        const models =
            require(
                "./includes/database/model.js"
            )({
                Sequelize,
                sequelize
            });

        onBot({
            models
        });

    } catch (error) {

        console.log(
            chalk.red(
                "❌ Database Error:"
            )
        );

        console.log(
            error
        );

        logger(
            "DB Error",
            "error"
        );

    }

    console.log(
        chalk.bold.hex("#eff1f0")(
            "════════════════ SUCCESFULLY ═════════════════"
        )
    );

})();

// ═══════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════

process.on(
    "unhandledRejection",
    (error) => {

        console.error(
            chalk.red(
                "❌ UNHANDLED REJECTION:"
            ),
            error
        );

    }
);

process.on(
    "uncaughtException",
    (error) => {

        console.error(
            chalk.red(
                "❌ UNCAUGHT EXCEPTION:"
            ),
            error
        );

    }
);