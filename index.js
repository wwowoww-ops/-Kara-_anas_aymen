const express = require('express');
const app = express();
const chalk = require('chalk');
const cron = require('node-cron');
const moment = require('moment-timezone');

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
chalk.bold.hex('#00FA9A')(
'[ DATA ] » تم الحفاظ على بيانات البوت وعدم حذفها عند التشغيل'
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
} = require('fs-extra');

const {
join,
resolve
} = require('path');

const logger = require('./utils/log.js');
const login = require('hut-chat-api');
const axios = require('axios');

console.log(
chalk.bold.hex('#03f0fc')(
'[ KIRA ] » '
) +
chalk.bold.hex('#fcba03')(
'Initializing variables...'
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

global.utils = require('./utils/index.js');
global.utils.config = require('./utils/config.js');
global.utils.decorations = require('./utils/decorations.js');

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
    'config.json'
);

configValue = require(
    global.client.configPath
);

logger.loader(
    'Found file config: config.json'
);

} catch {

return logger.loader(
    'config.json not found!',
    'error'
);

}

try {

for (const key in configValue) {
    global.config[key] = configValue[key];
}

logger.loader(
    'Config Loaded!'
);

} catch {

return logger.loader(
    "Can't load file config!",
    'error'
);

}

// ═══════════════════════════════════════════════
// DATABASE
// ═══════════════════════════════════════════════

const {
Sequelize,
sequelize
} = require(
'./includes/database/index.js'
);

writeFileSync(
global.client.configPath + '.temp',
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

const langFile = readFileSync(
    `${__dirname}/languages/${global.config.language || 'en'}.lang`,
    {
        encoding: 'utf-8'
    }
).split(/\r?\n|\r/);

const langData = langFile.filter(
    item =>
        item.indexOf('#') !== 0 &&
        item !== ''
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
        typeof global.language[head] ===
        'undefined'
    ) {

        global.language[head] =
            new Object();

    }

    global.language[head][key] =
        value;
}

} catch (e) {

console.log(
    'Language Load Error: ' +
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
'appstate.json'
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
        '💌 ───『 تم العثور على APPSTATE في إعدادات السيرفر 』─── 💌'
    );

} catch (e) {

    return logger.loader(
        'خطأ في تنسيق JSON الخاص بـ APPSTATE!',
        'error'
    );

}

} else {

try {

    appState =
        require(appStateFile);

    logger.loader(
        '💌 ───『 تم العثور على ملف appstate.json محلياً 』─── 💌'
    );

} catch {

    return logger.loader(
        'لم يتم العثور على ملف تسجيل الدخول أو متغير البيئة APPSTATE!',
        'error'
    );

}

}

// ═══════════════════════════════════════════════
// AUTO RECONNECT
// ═══════════════════════════════════════════════

let reconnectAttempts = 0;
let reconnectTimer = null;
let isConnecting = false;
let currentApi = null;

const MAX_RECONNECT_ATTEMPTS = 10;

// ═══════════════════════════════════════════════
// حساب وقت إعادة الاتصال
// ═══════════════════════════════════════════════

function getReconnectDelay() {

const delays = [
    5000,
    10000,
    15000,
    20000,
    30000,
    45000,
    60000
];

const index =
    Math.min(
        reconnectAttempts - 1,
        delays.length - 1
    );

return delays[
    Math.max(index, 0)
];

}

// ═══════════════════════════════════════════════
// إغلاق الاتصال القديم
// ═══════════════════════════════════════════════

function closeCurrentConnection() {

try {

    if (
        currentApi &&
        typeof currentApi.end === 'function'
    ) {

        currentApi.end(true);

    }

} catch (error) {

    console.log(
        chalk.gray(
            '[ MQTT ] تعذر إغلاق الاتصال القديم'
        )
    );

}

currentApi = null;

}

// ═══════════════════════════════════════════════
// جدولة إعادة الاتصال
// ═══════════════════════════════════════════════

function reconnect(botModel, reason) {

if (reconnectTimer) {
    return;
}

if (
    reconnectAttempts >=
    MAX_RECONNECT_ATTEMPTS
) {

    console.log(
        chalk.red(
            `❌ فشل الاتصال بعد ${MAX_RECONNECT_ATTEMPTS} محاولات`
        )
    );

    return;

}

reconnectAttempts++;

const delay =
    getReconnectDelay();

console.log(
    chalk.yellow(
        `🔄 إعادة الاتصال ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`
    )
);

if (reason) {

    console.log(
        chalk.gray(
            `↳ ${reason}`
        )
    );

}

console.log(
    chalk.yellow(
        `⏳ المحاولة القادمة بعد ${delay / 1000} ثانية`
    )
);

reconnectTimer =
    setTimeout(
        () => {

            reconnectTimer = null;

            onBot({
                models: botModel,
                reconnecting: true
            });

        },
        delay
    );

}

// ═══════════════════════════════════════════════
// ON BOT
// ═══════════════════════════════════════════════

function onBot({
models: botModel,
reconnecting = false
}) {

if (isConnecting) {

    console.log(
        chalk.gray(
            '[ RECONNECT ] توجد محاولة اتصال قيد التنفيذ'
        )
    );

    return;

}

if (reconnecting) {

    closeCurrentConnection();

}

isConnecting = true;

const loginData = {
    appState
};

login(
    loginData,
    async (
        loginError,
        loginApiData
    ) => {

        isConnecting = false;

        // ═══════════════════════════════════
        // LOGIN ERROR
        // ═══════════════════════════════════

        if (loginError) {

            console.error(
                chalk.red(
                    `❌ خطأ في تسجيل الدخول: ${
                        loginError.message ||
                        loginError
                    }`
                )
            );

            reconnect(
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
        currentApi = loginApiData;

        console.log(
            chalk.green(
                '✅ تم تسجيل الدخول بنجاح!'
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
                        'Fail load event: ' +
                        ev,
                        'error'
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

        // ═══════════════════════════════════
        // MQTT LISTENER
        // ═══════════════════════════════════

        loginApiData.listenMqtt(
            (
                error,
                message
            ) => {

                if (error) {

                    console.log(
                        chalk.red(
                            `⚠️ قطع اتصال MQTT: ${
                                error.message ||
                                error
                            }`
                        )
                    );

                    // إذا كان هذا اتصالًا قديمًا
                    if (
                        currentApi !==
                        loginApiData
                    ) {

                        return;

                    }

                    currentApi = null;

                    try {

                        if (
                            typeof loginApiData.end ===
                            'function'
                        ) {

                            loginApiData.end(true);

                        }

                    } catch (e) {}

                    reconnect(
                        botModel,
                        error.message ||
                        String(error)
                    );

                    return;

                }

                if (!message) {
                    return;
                }

                try {

                    return listener(
                        message
                    );

                } catch (error) {

                    console.error(
                        '❌ LISTENER ERROR:',
                        error
                    );

                }

            }
        );

        global.client.api =
            loginApiData;

        logger(
            'KIRA ✨',
            '[ by ayman ]'
        );

        // ═══════════════════════════════════
        // رسالة تشغيل البوت
        // ═══════════════════════════════════

        const timeNow =
            moment()
                .tz('Africa/Casablanca')
                .format('HH:mm:ss');

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
            '0 0 */1 * * *',
            () => {

                const dateStr =
                    moment()
                        .tz('Asia/Manila')
                        .format('MM/DD/YYYY');

                try {

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
                        '[ BIO ] ERROR:',
                        error.message
                    );

                }

            },
            {
                scheduled: true,
                timezone:
                    'Africa/Casablanca'
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
        'DB Error',
        'error'
    );

}

console.log(
    chalk.bold.hex('#eff1f0')(
        '════════════════ SUCCESFULLY ═════════════════'
    )
);

})();

// ═══════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════

process.on(
'unhandledRejection',
(err) => {

    console.log(
        err
    );

}

);