const express = require('express');
const app = express();
const chalk = require('chalk');
const cron = require("node-cron");
const moment = require("moment-timezone");

const port = process.env.PORT || 8000;

// ═══════════════════════════════════════════════
//           KIRA — HELLGATE UPTIME PAGE
// ═══════════════════════════════════════════════

app.get('/', (req, res) => {
res.send("<!DOCTYPE html> <html> <head> <meta charset="UTF-8"> <title>KIRA BOT</title> </head> <body> <h1>KIRA BOT</h1> <p>Bot is online.</p> </body> </html>");
});

app.listen(port, () => {
console.log(
chalk.cyan(
"📡 Health check server is running on port ${port}"
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

console.log(
chalk.bold.hex("#03f0fc").bold(
"[ KIRA ] » "
) +
chalk.bold.hex("#fcba03").bold(
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
global.client.configPath = join(
global.client.mainPath,
"config.json"
);

configValue = require(global.client.configPath);

logger.loader(
    "Found file config: config.json"
);

} catch {
return logger.loader(
"config.json not found!",
"error"
);
}

try {

for (const key in configValue) {
    global.config[key] = configValue[key];
}

logger.loader(
    "Config Loaded!"
);

} catch {
return logger.loader(
"Can't load file config!",
"error"
);
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
'utf8'
);

// ═══════════════════════════════════════════════
// تحميل اللغة
// ═══════════════════════════════════════════════

try {

const langFile = (
    readFileSync(
        `${__dirname}/languages/${global.config.language || "en"}.lang`,
        {
            encoding: 'utf-8'
        }
    )
).split(/\r?\n|\r/);

const langData = langFile.filter(
    item =>
        item.indexOf('#') != 0 &&
        item != ''
);

for (const item of langData) {

    const getSeparator =
        item.indexOf('=');

    const itemKey =
        item.slice(
            0,
            getSeparator
        );

    const itemValue =
        item.slice(
            getSeparator + 1,
            item.length
        );

    const head =
        itemKey.slice(
            0,
            itemKey.indexOf('.')
        );

    const key =
        itemKey.replace(
            head + '.',
            ''
        );

    const value =
        itemValue.replace(
            /\\n/gi,
            '\n'
        );

    if (
        typeof global.language[head] ==
        "undefined"
    ) {
        global.language[head] =
            new Object();
    }

    global.language[head][key] =
        value;
}

} catch (e) {

console.log(
    "Language Load Error: " +
    e.message
);

}

// ═══════════════════════════════════════════════
// GET TEXT
// ═══════════════════════════════════════════════

global.getText = function (...args) {

try {

    const langText =
        global.language;

    var text =
        langText[args[0]][args[1]];

    if (!text) {
        return `[${args[1]}]`;
    }

    for (
        var i = args.length - 1;
        i > 0;
        i--
    ) {

        const regEx =
            RegExp(
                `%${i}`,
                'g'
            );

        text =
            text.replace(
                regEx,
                args[i + 1]
            );
    }

    return text;

} catch (e) {

    return `[${args[1]}]`;

}

};

// ═══════════════════════════════════════════════
// APPSTATE
// ═══════════════════════════════════════════════

var appStateFile =
resolve(
join(
global.client.mainPath,
global.config.APPSTATEPATH ||
"appstate.json"
)
);

var appState;

if (process.env.APPSTATE) {

try {

    appState =
        JSON.parse(
            process.env.APPSTATE
        );

    logger.loader(
        "💌 ───『 تم العثور على APPSTATE في إعدادات السيرفر 』─── 💌"
    );

} catch (e) {

    return logger.loader(
        "خطأ في تنسيق JSON الخاص بـ APPSTATE!",
        "error"
    );

}

} else {

try {

    appState =
        require(appStateFile);

    logger.loader(
        "💌 ───『 تم العثور على ملف appstate.json محلياً 』─── 💌"
    );

} catch {

    return logger.loader(
        "لم يتم العثور على ملف تسجيل الدخول أو متغير البيئة APPSTATE!",
        "error"
    );

}

}

// ═══════════════════════════════════════════════
// AUTO RECONNECT
// ═══════════════════════════════════════════════

// عدد محاولات تسجيل الدخول
let reconnectAttempts = 0;

// مؤقت إعادة الاتصال
let reconnectTimer = null;

// هل توجد محاولة إعادة اتصال مجدولة؟
let reconnectScheduled = false;

// هل البوت يعمل حاليًا؟
let botConnected = false;

// هل يتم حاليًا إنشاء جلسة؟
let loginInProgress = false;

// مرجع آخر API لمنع الاتصالات المتداخلة
let activeApi = null;

const MAX_RECONNECT_ATTEMPTS = 10;

// ------------------------------------------------
// تنظيف اتصال MQTT القديم
// ------------------------------------------------

function closeOldConnection() {

try {

    if (
        activeApi &&
        typeof activeApi.end === "function"
    ) {

        activeApi.end(
            true
        );

    }

} catch (error) {

    console.log(
        chalk.gray(
            "[ MQTT ] تعذر إغلاق الاتصال القديم"
        )
    );

}

activeApi = null;
botConnected = false;

}

// ------------------------------------------------
// حساب مدة الانتظار
// ------------------------------------------------

function getReconnectDelay() {

const attempt =
    Math.max(
        reconnectAttempts,
        1
    );

// 5s → 10s → 20s → 30s → 45s → 60s
return Math.min(
    5000 * Math.pow(2, attempt - 1),
    60000
);

}

// ------------------------------------------------
// جدولة إعادة الاتصال
// ------------------------------------------------

function scheduleReconnect(
botModel,
reason = ""
) {

// منع إنشاء أكثر من مؤقت
if (
    reconnectScheduled ||
    reconnectTimer
) {

    return;

}

if (
    reconnectAttempts >=
    MAX_RECONNECT_ATTEMPTS
) {

    console.log(
        chalk.red(
            `❌ توقف نظام إعادة الاتصال بعد ${MAX_RECONNECT_ATTEMPTS} محاولات.`
        )
    );

    return;

}

reconnectAttempts++;
reconnectScheduled = true;

const delay =
    getReconnectDelay();

console.log(
    chalk.yellow(
        `🔄 إعادة الاتصال رقم ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`
    )
);

if (reason) {

    console.log(
        chalk.gray(
            `↳ السبب: ${reason}`
        )
    );

}

console.log(
    chalk.yellow(
        `⏳ المحاولة القادمة بعد ${Math.round(delay / 1000)} ثانية...`
    )
);

reconnectTimer =
    setTimeout(
        () => {

            reconnectTimer = null;
            reconnectScheduled = false;

            onBot({
                models: botModel,
                isReconnect: true
            });

        },
        delay
    );

}

// ═══════════════════════════════════════════════
// تشغيل البوت
// ═══════════════════════════════════════════════

function onBot({
models: botModel,
isReconnect = false
}) {

// منع تشغيل login جديد إذا كان هناك واحد قيد التنفيذ
if (loginInProgress) {

    console.log(
        chalk.gray(
            "[ RECONNECT ] توجد محاولة اتصال قيد التنفيذ، تم تجاهل الطلب الجديد."
        )
    );

    return;

}

// عند إعادة الاتصال نغلق الجلسة السابقة أولًا
if (isReconnect) {
    closeOldConnection();
}

loginInProgress = true;

const loginData = {
    appState
};

login(
    loginData,
    async (
        loginError,
        loginApiData
    ) => {

        loginInProgress = false;

        // ═══════════════════════════════════
        // LOGIN ERROR
        // ═══════════════════════════════════

        if (loginError) {

            botConnected = false;

            console.error(
                chalk.red(
                    `❌ خطأ في تسجيل الدخول: ${
                        loginError.message ||
                        loginError
                    }`
                )
            );

            scheduleReconnect(
                botModel,
                loginError.message ||
                String(loginError)
            );

            return;
        }

        // ═══════════════════════════════════
        // LOGIN SUCCESS
        // ═══════════════════════════════════

        reconnectAttempts = 0;
        botConnected = true;

        activeApi =
            loginApiData;

        console.log(
            chalk.green(
                `✅ تم تسجيل الدخول بنجاح!`
            )
        );

        loginApiData.setOptions(
            global.config.FCAOption
        );

        try {

            writeFileSync(
                appStateFile,
                JSON.stringify(
                    loginApiData.getAppState(),
                    null,
                    '\x09'
                )
            );

        } catch (e) {}

        global.config.version =
            '1.2.14';

        global.client.timeStart =
            new Date().getTime();

        // ═══════════════════════════════════
        // تحميل الأوامر
        // ═══════════════════════════════════

        const commandsPath =
            join(
                global.client.mainPath,
                'script',
                'commands'
            );

        const categories =
            readdirSync(
                commandsPath
            ).filter(
                item =>
                    require('fs').statSync(
                        join(
                            commandsPath,
                            item
                        )
                    ).isDirectory()
            );

        for (
            const category of categories
        ) {

            const categoryPath =
                join(
                    commandsPath,
                    category
                );

            const listCommand =
                readdirSync(
                    categoryPath
                ).filter(
                    command =>
                        command.endsWith('.js') &&
                        !global.config.commandDisabled.includes(
                            command
                        )
                );

            for (
                const command of listCommand
            ) {

                try {

                    const module =
                        require(
                            join(
                                categoryPath,
                                command
                            )
                        );

                    if (
                        module.config &&
                        module.run
                    ) {

                        global.client.commands.set(
                            module.config.name,
                            module
                        );

                        logger.loader(
                            `🌸『 تـم تحميل: ${module.config.name} 』🌸`
                        );

                    }

                } catch (error) {

                    logger.loader(
                        `Fail load command: ${command}`,
                        'error'
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
                'script',
                'events'
            );

        if (
            existsSync(eventsPath)
        ) {

            const events =
                readdirSync(
                    eventsPath
                ).filter(
                    ev =>
                        ev.endsWith('.js')
                );

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

                    global.client.events.set(
                        event.config.name,
                        event
                    );

                } catch (err) {

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

        if (
            existsSync(
                global.client.configPath +
                '.temp'
            )
        ) {

            unlinkSync(
                global.client.configPath +
                '.temp'
            );

        }

        // ═══════════════════════════════════
        // LISTENER
        // ═══════════════════════════════════

        const listenerData = {
            api: loginApiData,
            models: botModel
        };

        const listener =
            require(
                './includes/listen.js'
            )(
                listenerData
            );

        loginApiData.listenMqtt(
            (
                error,
                message
            ) => {

                // ═════════════════════════════
                // MQTT ERROR
                // ═════════════════════════════

                if (error) {

                    botConnected = false;

                    console.log(
                        chalk.red(
                            `⚠️ قطع اتصال MQTT: ${
                                error.message ||
                                error
                            }`
                        )
                    );

                    // تجاهل الأخطاء الناتجة عن جلسة قديمة
                    if (
                        activeApi !==
                        loginApiData
                    ) {

                        return;

                    }

                    // إزالة المرجع قبل إعادة الاتصال
                    activeApi = null;

                    // إغلاق الاتصال القديم إن أمكن
                    try {

                        if (
                            typeof loginApiData.end ===
                            "function"
                        ) {

                            loginApiData.end(
                                true
                            );

                        }

                    } catch (e) {}

                    scheduleReconnect(
                        botModel,
                        error.message ||
                        String(error)
                    );

                    return;

                }

                // ═════════════════════════════
                // MQTT MESSAGE
                // ═════════════════════════════

                if (
                    !message
                ) {

                    return;

                }

                return listener(
                    message
                );

            }
        );

        global.client.api =
            loginApiData;

        logger(
            `KIRA ✨`,
            '[ by ayman ]'
        );

        // ═══════════════════════════════════
        // رسالة تشغيل البوت
        // ═══════════════════════════════════

        const timeNow =
            moment()
                .tz("Africa/Casablanca")
                .format("HH:mm:ss");

        if (
            global.config.ADMINBOT &&
            global.config.ADMINBOT[0]
        ) {

            loginApiData.sendMessage(
                `لـقـد تـم تـشـغـيـل الـبـوت فـي ${timeNow} ✅`,
                global.config.ADMINBOT[0]
            );

        }

        // ═══════════════════════════════════
        // تحديث البايو
        // ═══════════════════════════════════

        cron.schedule(
            `0 0 */1 * * *`,
            () => {

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

            },
            {
                scheduled: true,
                timezone:
                    "Africa/Casablanca"
            }
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

    const models =
        require(
            './includes/database/model.js'
        )({
            Sequelize,
            sequelize
        });

    onBot({
        models
    });

} catch (error) {

    console.log(error);

    logger(
        "DB Error",
        "error"
    );

}

console.log(
    chalk.bold.hex("#eff1f0").bold(
        "════════════════ SUCCESFULLY ═════════════════"
    )
);

})();

// ═══════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════

process.on(
'unhandledRejection',
(err) => {
console.log(err);
}
);