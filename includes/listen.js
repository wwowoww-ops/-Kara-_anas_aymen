/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║              🔥 KIRA SEPARATED LISTEN - SUPER CLEAN 🔥         ║
 * ║                   كل شيء منفصل - صفر دمج                     ║
 * ║                  By: Ayman - KIRA Team                        ║
 * ║                     Version: 12.0.0                           ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

module.exports = function({ api, models }) {
    
    // ═══════════════════════════════════════════════════════════
    // 📦 استيراد المكتبات فقط - بدون دمج
    // ═══════════════════════════════════════════════════════════
    
    const logger = require("../utils/log.js");
    const fs = require("fs");
    
    // ═══════════════════════════════════════════════════════════
    // 🎮 Controllers - استيراد فقط
    // ═══════════════════════════════════════════════════════════
    
    const Users = require("./controllers/users")({ models, api });
    const Threads = require("./controllers/threads")({ models, api });
    const Currencies = require("./controllers/currencies")({ models });
    
    // ═══════════════════════════════════════════════════════════
    // ⚙️ Handlers - كل واحد ملف منفصل
    // ═══════════════════════════════════════════════════════════
    
    const handleCommand = require("./handle/handleCommand")({ 
        api, models, Users, Threads, Currencies 
    });
    
    const handleCommandEvent = require("./handle/handleCommandEvent")({ 
        api, models, Users, Threads, Currencies 
    });
    
    const handleReply = require("./handle/handleReply")({ 
        api, models, Users, Threads, Currencies 
    });
    
    const handleReaction = require("./handle/handleReaction")({ 
        api, models, Users, Threads, Currencies 
    });
    
    const handleEvent = require("./handle/handleEvent")({ 
        api, models, Users, Threads, Currencies 
    });
    
    const handleRefresh = require("./handle/handleRefresh")({ 
        api, models, Users, Threads, Currencies 
    });
    
    const handleCreateDatabase = require("./handle/handleCreateDatabase")({ 
        api, Threads, Users, Currencies, models 
    });

    const handleNotification = require("./handle/handleNotification")({ 
        api 
    });

    // ═══════════════════════════════════════════════════════════
    // 🗄️ تحميل قاعدة البيانات - منفصل
    // ═══════════════════════════════════════════════════════════
    
    (async function() {
        try {
            logger('📊 جاري تحميل قاعدة البيانات...', '[ DATABASE ]');
            
            // تحميل المجموعات
            const threads = await Threads.getAll(['threadID', 'data', 'threadInfo']);
            for (const thread of threads) {
                const tid = String(thread.threadID);
                global.data.allThreadID.push(tid);
                global.data.threadData.set(tid, thread.data || {});
                global.data.threadInfo.set(tid, thread.threadInfo || {});
                
                if (thread.data?.banned == 1) {
                    global.data.threadBanned.set(tid, {
                        reason: thread.data.reason || '',
                        dateAdded: thread.data.dateAdded || Date.now()
                    });
                }
                
                if (thread.data?.commandBanned?.length > 0) {
                    global.data.commandBanned.set(tid, thread.data.commandBanned);
                }
                
                if (thread.data?.NSFW) {
                    global.data.threadAllowNSFW.push(tid);
                }
            }

            // تحميل المستخدمين
            const users = await Users.getAll(['userID', 'name', 'data']);
            for (const user of users) {
                const uid = String(user.userID);
                global.data.allUserID.push(uid);
                
                if (user.name) {
                    global.data.userName.set(uid, user.name);
                }
                
                if (user.data?.banned == 1) {
                    global.data.userBanned.set(uid, {
                        reason: user.data.reason || '',
                        dateAdded: user.data.dateAdded || Date.now()
                    });
                }
                
                if (user.data?.commandBanned?.length > 0) {
                    global.data.commandBanned.set(uid, user.data.commandBanned);
                }
            }

            // تحميل العملات
            const currencies = await Currencies.getAll(['userID']);
            for (const currency of currencies) {
                global.data.allCurrenciesID.push(String(currency.userID));
            }

            logger('✅ اكتمل تحميل قاعدة البيانات', '[ DATABASE ]');
            
        } catch (error) {
            logger(`❌ فشل التحميل: ${error.message}`, 'error');
        }
    }());

    // ═══════════════════════════════════════════════════════════
    // 🎨 رسالة البداية - منفصلة
    // ═══════════════════════════════════════════════════════════
    
    logger(`
╔═══════════════════════════════════════════════════════════════╗
║           ✨ ${global.config.BOTNAME || 'KIRA'} SYSTEM ✨         
║───────────────────────────────────────────────────────────────║
║  PREFIX: ${global.config.PREFIX || '.'}                                           
║  STATUS: 🟢 ONLINE                                            
╚═══════════════════════════════════════════════════════════════╝
    `, "[ SYSTEM ]");

    // ═══════════════════════════════════════════════════════════
    // 📊 إحصائيات - منفصلة
    // ═══════════════════════════════════════════════════════════
    
    setInterval(() => {
        logger(
            `📊 ${global.data.allThreadID.length} Groups | ` +
            `${global.data.allUserID.length} Users | ` +
            `${global.client.commands.size} Commands | ` +
            `${global.client.events.size} Events`, 
            '[ STATS ]'
        );
    }, 1800000);

    // ═══════════════════════════════════════════════════════════
    // 🔔 إشعارات - منفصلة
    // ═══════════════════════════════════════════════════════════
    
    if (global.config.NOTIFICATION) {
        setInterval(() => {
            try {
                if (handleNotification) handleNotification({ api });
            } catch (e) {
                // تجاهل
            }
        }, 60000);
    }

    // ═══════════════════════════════════════════════════════════
    // 🎯 المعالج الرئيسي - THE MAIN HANDLER
    // ═══════════════════════════════════════════════════════════
    
    return async function(event) {
        
        const { type, threadID, senderID } = event;
        const tid = String(threadID);
        const sid = String(senderID);

        // ═══════════════════════════════════════════════════════
        // 🚫 فلترة سريعة
        // ═══════════════════════════════════════════════════════
        
        if (global.data.userBanned.has(sid)) return;
        if (global.data.threadBanned.has(tid)) return;
        if (!global.config.allowInbox && sid === tid) return;

        // ═══════════════════════════════════════════════════════
        // 🎭 توجيه الأحداث - ROUTING ONLY
        // ═══════════════════════════════════════════════════════
        
        try {
            
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // 💬 MESSAGES (مع return لمنع التكرار)
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            
            if (type === "message" || type === "message_reply") {
                
                await handleCreateDatabase({ event });
                await handleCommand({ event });
                await handleReply({ event });
                await handleCommandEvent({ event });
                
                return; // ✅ منع التكرار
            }

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // ❌ MESSAGE UNSEND
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            
            if (type === "message_unsend") {
                
                await handleEvent({ event });
                
                return;
            }

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // 😊 REACTIONS
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            
            if (type === "message_reaction") {
                
                await handleReaction({ event });
                await handleEvent({ event });
                
                return;
            }

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // 👥 JOIN - يستدعي joinnoti.js, autosetname.js
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            
            if (type === "event" || event.logMessageType === "log:subscribe") {
                
                // 1. تحديث قاعدة البيانات
                await handleCreateDatabase({ event });
                
                // 2. تشغيل events (joinnoti, autosetname)
                await handleEvent({ event });
                
                // 3. تحديث البيانات
                await handleRefresh({ event });
                
                // 4. رسالة البوت (منفصلة)
                if (global.config.notiGroup) {
                    const added = event.logMessageData?.addedParticipants || [];
                    const botAdded = added.some(p => p.userFbId == api.getCurrentUserID());
                    
                    if (botAdded && event.logMessageType === "log:subscribe") {
                        try {
                            await api.changeNickname(
                                `『 ${global.config.PREFIX} 』• ${global.config.BOTNAME}`,
                                tid,
                                api.getCurrentUserID()
                            );
                            
                            await api.sendMessage(
                                `◈ ───『 ✨ ${global.config.BOTNAME} ✨ 』─── ◈\n\n` +
                                `✅ تم الاتصال بنجاح!\n` +
                                `📋 البادئة: ${global.config.PREFIX}\n` +
                                `💡 اكتب: ${global.config.PREFIX}أوامر\n\n` +
                                `◈ ────────────── ◈`,
                                tid
                            );
                        } catch (e) {
                            // تجاهل
                        }
                    }
                }
                
                return;
            }

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // 👋 LEAVE - يستدعي antiout.js, leavenoti.js
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            
            if (event.logMessageType === "log:unsubscribe") {
                
                // 1. تشغيل events (antiout, leavenoti)
                await handleEvent({ event });
                
                // 2. تحديث البيانات
                await handleRefresh({ event });
                
                return;
            }

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // 👑 ADMINS - يستدعي guard.js
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            
            if (event.logMessageType === "log:thread-admins") {
                
                // 1. تشغيل الحماية (guard.js)
                await handleEvent({ event });
                
                // 2. تحديث قائمة المشرفين
                await handleRefresh({ event });
                
                return;
            }

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // 📝 THREAD NAME
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            
            if (event.logMessageType === "log:thread-name") {
                
                await handleRefresh({ event });
                await handleEvent({ event });
                
                return;
            }

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // 🖼️ THREAD ICON/IMAGE
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            
            if (event.logMessageType === "log:thread-icon" || 
                type === "change_thread_image") {
                
                await handleEvent({ event });
                
                return;
            }

            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // 🎨 أي حدث آخر
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            
            await handleEvent({ event });

        } catch (error) {
            
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            // ❌ معالجة الأخطاء
            // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            
            console.error('═══════════════════════════════════════');
            console.error('❌ ERROR IN LISTEN');
            console.error('Type:', type);
            console.error('Thread:', tid);
            console.error('Error:', error.message);
            console.error('═══════════════════════════════════════');
            
            if (global.config.DeveloperMode && global.config.ADMINBOT[0]) {
                try {
                    await api.sendMessage(
                        `⚠️ Error in ${type}\n${error.message}`,
                        global.config.ADMINBOT[0]
                    );
                } catch (e) {
                    // تجاهل
                }
            }
        }

        return;
    };
};

/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║                        📖 الدليل                              ║
 * ╚═══════════════════════════════════════════════════════════════╝
 * 
 * 🎯 الهدف:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ملف listen منفصل 100% - لا يدمج شيء
 * يستدعي الإيفنتات من مجلد events فقط
 * 
 * 🔍 كيف يعمل:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 1. يستقبل الحدث من Facebook
 * 2. يفلتر المحظورين
 * 3. يحدد نوع الحدث
 * 4. يستدعي الـ handler المناسب
 * 5. الـ handler يستدعي الإيفنتات
 * 
 * 📂 الإيفنتات التي يستدعيها:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * log:subscribe        → joinnoti.js, autosetname.js
 * log:unsubscribe      → antiout.js, leavenoti.js
 * log:thread-admins    → guard.js
 * message_reaction     → (أي إيفنت يدعم reactions)
 * 
 * 💡 ملاحظة مهمة:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * - listen.js لا يحتوي على كود الإيفنتات
 * - فقط يستدعيها عبر handleEvent
 * - handleEvent هو الذي يشغل الملفات من events/
 * - كل إيفنت ملف منفصل في script/events/
 * 
 * 🔧 للتعديل:
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * ✅ عدّل الإيفنتات في: script/events/
 * ✅ عدّل المعالجات في: includes/handle/
 * ✅ لا تعدّل listen.js إلا للضرورة
 * 
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║                  🌟 CLEAN & SEPARATED 🌟                      ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */