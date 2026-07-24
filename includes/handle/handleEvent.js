/**
 * ═══════════════════════════════════════════════════════════
 * 🔧 handleEvent.js - نسخة محسّنة ومصححة مع دعم التتبع
 * ═══════════════════════════════════════════════════════════
 * الغرض: معالجة جميع أحداث Events بشكل صحيح
 * التحسينات: error handling + logging + دعم الطريقتين + تتبع الأعضاء
 * ═══════════════════════════════════════════════════════════
 */

module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");
    const moment = require("moment-timezone");
    const fs = require("fs");
    const path = "./data/tracking.json";
    const permissionsPath = "./data/permissions.json";

    return async function ({ event }) {
        const timeStart = Date.now();
        const time = moment.tz("Asia/Baghdad").format("HH:mm:ss DD/MM/YYYY");
        
        const { userBanned, threadBanned } = global.data;
        const { events } = global.client;
        const { allowInbox, DeveloperMode } = global.config;
        
        var { senderID, threadID, reaction, messageReply, type } = event;
        senderID = String(senderID);
        threadID = String(threadID);

        // ════════════════════════════════════════════════════════════
        // 🗑️ نظام حذف رسائل البوت المُحسّن
        // ════════════════════════════════════════════════════════════
        
        if (type === "message_reaction" && messageReply?.senderID === api.getCurrentUserID()) {
            const deleteReactions = ["👍", "😡", "🗑️", "❌", "💔", "🚫", "⛔"];
            
            if (deleteReactions.includes(reaction)) {
                console.log(`\n🗑️ ═══ طلب حذف رسالة ═══`);
                console.log(`   التفاعل: ${reaction}`);
                console.log(`   المستخدم: ${senderID}`);
                console.log(`   الرسالة: ${messageReply.messageID}`);
                console.log(`   الوقت: ${time}`);
                
                try {
                    await api.unsendMessage(messageReply.messageID);
                    console.log(`   ✅ تم الحذف بنجاح!\n`);
                    return;
                    
                } catch (error) {
                    console.error(`   ❌ فشل الحذف: ${error.message}`);
                    
                    setTimeout(async () => {
                        try {
                            await api.unsendMessage(messageReply.messageID);
                            console.log(`   ✅ تم الحذف في المحاولة الثانية!\n`);
                        } catch (retryError) {
                            console.error(`   ❌ فشلت المحاولة الثانية: ${retryError.message}\n`);
                        }
                    }, 1000);
                    
                    return;
                }
            }
        }

        // ════════════════════════════════════════════════════════════
        // 🚫 فلترة المحظورين
        // ════════════════════════════════════════════════════════════
        
        if (userBanned.has(senderID) || threadBanned.has(threadID) || 
            (allowInbox == false && senderID == threadID)) {
            return;
        }

        // ════════════════════════════════════════════════════════════
        // 🔄 معالج خروج الأعضاء (لتتبع وإعادة العضو)
        // ════════════════════════════════════════════════════════════
        
        if (event.logMessageType === "log:unsubscribe") {
            const userID = event.logMessageData?.leftParticipantFbId;
            if (!userID) return;

            // قراءة ملف التتبع
            if (fs.existsSync(path)) {
                let trackingData = JSON.parse(fs.readFileSync(path));
                
                // التأكد من تفعيل التتبع في هذه المجموعة
                if (trackingData[threadID] && trackingData[threadID].active) {
                    
                    // التحقق من وجود إذن خروج
                    let hasPermission = false;
                    if (fs.existsSync(permissionsPath)) {
                        const permissionsData = JSON.parse(fs.readFileSync(permissionsPath));
                        if (permissionsData[threadID] && permissionsData[threadID][userID]) {
                            const perm = permissionsData[threadID][userID];
                            if (perm.expiry > Date.now()) {
                                hasPermission = true;
                                console.log(`✅ العضو ${userID} لديه إذن خروج، لن يتم إعادته.`);
                            } else {
                                // انتهى الإذن، حذفه
                                delete permissionsData[threadID][userID];
                                fs.writeFileSync(permissionsPath, JSON.stringify(permissionsData, null, 2));
                            }
                        }
                    }

                    // إذا كان لديه إذن، لا نعيده
                    if (hasPermission) return;

                    // التحقق من أن البوت أدمن
                    try {
                        const threadInfo = await api.getThreadInfo(threadID);
                        const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());
                        
                        if (!isBotAdmin) {
                            console.log(`❌ البوت ليس أدمن في ${threadID}، لا يمكن إعادة الأعضاء.`);
                            return;
                        }

                        // ✅ إعادة العضو إلى المجموعة
                        await api.addUserToGroup(userID, threadID);
                        console.log(`✅ تم إعادة العضو ${userID} إلى المجموعة ${threadID}`);

                        // جلب اسم العضو وإرسال رسالة
                        try {
                            const userInfo = await api.getUserInfo(userID);
                            const userName = userInfo[userID]?.name || "حبيبي/حبيبتي";
                            
                            await api.sendMessage(
                                `🥺 تعال يا ${userName} 💕\n\n` +
                                `مامي قالت مين عطاك إذن تخرج؟! 😤💢\n` +
                                `ما تطلعش غير بإذن مامي تاني مرة 🌸✨\n\n` +
                                `🔄 تم إعادتك يا قمر 🌙💖`,
                                threadID
                            );
                        } catch (e) {}

                    } catch (error) {
                        console.error(`❌ فشل إعادة العضو ${userID}:`, error);
                    }
                }
            }
        }

        // ════════════════════════════════════════════════════════════
        // ⚙️ معالجة الأحداث - النسخة المحسّنة
        // ════════════════════════════════════════════════════════════
        
        const currentEventType = event.type || event.logMessageType;
        let processedEvents = 0;
        
        if (DeveloperMode) {
            console.log(`\n📊 ═══ handleEvent Debug ═══`);
            console.log(`   Event Type: ${currentEventType}`);
            console.log(`   Thread: ${threadID}`);
            console.log(`   Sender: ${senderID}`);
            console.log(`   Loaded Events: ${events.size}`);
        }
        
        for (const [eventName, eventModule] of events.entries()) {
            
            if (!eventModule.config || !eventModule.config.eventType) {
                if (DeveloperMode) {
                    console.log(`   ⚠️ ${eventName}: مفقود eventType`);
                }
                continue;
            }
            
            const eventTypes = eventModule.config.eventType;
            
            if (!eventTypes.includes(currentEventType)) {
                continue;
            }
            
            try {
                const eventObject = {
                    api,
                    event,
                    models,
                    Users,
                    Threads,
                    Currencies
                };
                
                if (typeof eventModule.run === 'function') {
                    await eventModule.run(eventObject);
                    processedEvents++;
                    
                } else if (typeof eventModule.handleEvent === 'function') {
                    await eventModule.handleEvent(eventObject);
                    processedEvents++;
                    
                } else {
                    console.warn(`⚠️ Event ${eventName} لا يحتوي على run أو handleEvent`);
                    continue;
                }

                if (DeveloperMode) {
                    const executionTime = Date.now() - timeStart;
                    logger(
                        `✅ Event: ${eventName} | ` +
                        `Type: ${currentEventType} | ` +
                        `Time: ${executionTime}ms | ` +
                        `Thread: ${threadID}`, 
                        "EVENT"
                    );
                }
                
            } catch (error) {
                console.error(`\n❌ ═══ خطأ في Event: ${eventName} ═══`);
                console.error(`   الوقت: ${time}`);
                console.error(`   المجموعة: ${threadID}`);
                console.error(`   النوع: ${currentEventType}`);
                console.error(`   الخطأ: ${error.message}`);
                console.error(`   Stack:\n${error.stack}\n`);
                
                logger(
                    `❌ Event Error: ${eventName} - ${error.message}`, 
                    "error"
                );
            }
        }
        
        if (DeveloperMode && processedEvents > 0) {
            const totalTime = Date.now() - timeStart;
            console.log(`   ✅ معالجة: ${processedEvents} events في ${totalTime}ms`);
            console.log(`   ═══════════════════════════\n`);
        } else if (DeveloperMode && processedEvents === 0) {
            console.log(`   ℹ️ لم يتم معالجة أي events لهذا النوع`);
            console.log(`   ═══════════════════════════\n`);
        }
        
        return;
    };
};