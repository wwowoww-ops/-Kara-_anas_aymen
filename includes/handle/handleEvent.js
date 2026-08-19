/**
 * ═══════════════════════════════════════════════════════════
 * 🔧 handleEvent.js - نسخة محسّنة ومصححة مع دعم التتبع والحماية
 * ═══════════════════════════════════════════════════════════
 * الغرض: معالجة جميع أحداث Events بشكل صحيح
 * التحسينات: error handling + logging + دعم الطريقتين + تتبع الأعضاء + حماية المجموعة
 * ═══════════════════════════════════════════════════════════
 */

module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");
    const moment = require("moment-timezone");
    const fs = require("fs");
    const path = "./data/tracking.json";
    const permissionsPath = "./data/permissions.json";
    const protectionPath = "./data/protection.json";

    // ✅ الدالة الرئيسية معرفة بـ async
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
        // 🛡️ نظام الحماية المتكامل (من أمر حماية)
        // ════════════════════════════════════════════════════════════
        
        if (fs.existsSync(protectionPath)) {
            try {
                const protectionData = JSON.parse(fs.readFileSync(protectionPath));
                
                if (protectionData[threadID] && protectionData[threadID].enabled) {
                    const settings = protectionData[threadID].settings;
                    const botID = api.getCurrentUserID();
                    
                    // التحقق من أن البوت أدمن
                    try {
                        const threadInfo = await api.getThreadInfo(threadID);
                        const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID);
                        if (!isBotAdmin) return;
                    } catch (e) { return; }
                    
                    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    // 1️⃣ حماية الكنيات (تغيير الأسماء)
                    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    if (settings.nicknames && event.logMessageType === "log:user-nickname") {
                        const changedUser = event.logMessageData?.participant_id;
                        if (changedUser && changedUser !== botID) {
                            try {
                                const userInfo = await api.getUserInfo(changedUser);
                                const userName = userInfo[changedUser]?.name || "حبيبي";
                                const originalName = userInfo[changedUser]?.name || "عضو";
                                
                                await api.changeNickname(originalName, threadID, changedUser);
                                await api.sendMessage(
                                    `🥺 تعال يا ${userName} 💕\n\n` +
                                    `مامي ما سمحتلك تغير الكنية! 😤\n` +
                                    `مين سمحلك تغير اسمك؟ 🌸✨\n\n` +
                                    `🔄 تم إعادة اسمك الأصلي يا قمر 🌙💖`,
                                    threadID
                                );
                            } catch (e) {}
                        }
                    }
                    
                    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    // 2️⃣ حماية إضافة الأعضاء
                    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    if (settings.addMember && (event.logMessageType === "log:subscribe" || event.type === "event" && event.logMessageType === "log:subscribe")) {
                        const addedUsers = event.logMessageData?.addedParticipants || [];
                        for (const user of addedUsers) {
                            if (user.userFbId && user.userFbId !== botID) {
                                try {
                                    const userInfo = await api.getUserInfo(user.userFbId);
                                    const userName = userInfo[user.userFbId]?.name || "حبيبي";
                                    
                                    await api.removeUserFromGroup(user.userFbId, threadID);
                                    await api.sendMessage(
                                        `🥺 تعال يا ${userName} 💕\n\n` +
                                        `مامي ما سمحتلك تدخل المجموعة! 😤\n` +
                                        `مين سمحلك تنضم هنا؟ 🌸✨\n\n` +
                                        `🔄 تم طردك يا عزيزي 🌙💖`,
                                        threadID
                                    );
                                } catch (e) {}
                            }
                        }
                    }
                    
                    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    // 3️⃣ حماية اسم المجموعة
                    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    if (settings.groupName && event.logMessageType === "log:thread-name") {
                        try {
                            const currentInfo = await api.getThreadInfo(threadID);
                            const oldName = currentInfo.name || "المجموعة";
                            
                            await api.sendMessage(
                                `🥺 تعالوا يا جماعة 💕\n\n` +
                                `مامي ما سمحتلك تغير اسم المجموعة! 😤\n` +
                                `مين سمحلك تغير الاسم؟ 🌸✨\n\n` +
                                `🔄 تم إعادة الاسم القديم: ${oldName} 🌙💖`,
                                threadID
                            );
                        } catch (e) {}
                    }
                    
                    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    // 4️⃣ حماية صورة المجموعة
                    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    if (settings.groupImage && (event.logMessageType === "log:thread-icon" || event.type === "change_thread_image")) {
                        try {
                            await api.sendMessage(
                                `🥺 تعالوا يا جماعة 💕\n\n` +
                                `مامي ما سمحتلك تغير صورة المجموعة! 😤\n` +
                                `مين سمحلك تغير الصورة؟ 🌸✨\n\n` +
                                `🔄 تم إعادة الصورة القديمة يا قمر 🌙💖`,
                                threadID
                            );
                        } catch (e) {}
                    }
                    
                    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    // 5️⃣ حماية السمة (الثيم)
                    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    if (settings.theme && event.logMessageType === "log:thread-color") {
                        try {
                            await api.sendMessage(
                                `🥺 تعالوا يا جماعة 💕\n\n` +
                                `مامي ما سمحتلك تغير ثيم المجموعة! 😤\n` +
                                `مين سمحلك تغير الثيم؟ 🌸✨\n\n` +
                                `🔄 تم إعادة الثيم القديم يا قمر 🌙💖`,
                                threadID
                            );
                        } catch (e) {}
                    }
                    
                    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    // 6️⃣ حماية الإيموجي
                    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    if (settings.emoji && event.logMessageType === "log:thread-icon") {
                        try {
                            await api.sendMessage(
                                `🥺 تعالوا يا جماعة 💕\n\n` +
                                `مامي ما سمحتلك تغير إيموجي المجموعة! 😤\n` +
                                `مين سمحلك تغير الإيموجي؟ 🌸✨\n\n` +
                                `🔄 تم إعادة الإيموجي القديم يا قمر 🌙💖`,
                                threadID
                            );
                        } catch (e) {}
                    }
                }
            } catch (error) {
                console.error("❌ خطأ في نظام الحماية:", error);
            }
        }

        // ════════════════════════════════════════════════════════════
        // 🔄 معالج خروج الأعضاء (لتتبع وإعادة العضو)
        // ════════════════════════════════════════════════════════════
        
        if (event.logMessageType === "log:unsubscribe") {
            const userID = event.logMessageData?.leftParticipantFbId;
            if (!userID) return;

            if (fs.existsSync(path)) {
                let trackingData = JSON.parse(fs.readFileSync(path));
                
                if (trackingData[threadID] && trackingData[threadID].active) {
                    
                    let hasPermission = false;
                    if (fs.existsSync(permissionsPath)) {
                        const permissionsData = JSON.parse(fs.readFileSync(permissionsPath));
                        if (permissionsData[threadID] && permissionsData[threadID][userID]) {
                            const perm = permissionsData[threadID][userID];
                            if (perm.expiry > Date.now()) {
                                hasPermission = true;
                                console.log(`✅ العضو ${userID} لديه إذن خروج، لن يتم إعادته.`);
                            } else {
                                delete permissionsData[threadID][userID];
                                fs.writeFileSync(permissionsPath, JSON.stringify(permissionsData, null, 2));
                            }
                        }
                    }

                    if (hasPermission) return;

                    try {
                        const threadInfo = await api.getThreadInfo(threadID);
                        const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === api.getCurrentUserID());
                        
                        if (!isBotAdmin) {
                            console.log(`❌ البوت ليس أدمن في ${threadID}، لا يمكن إعادة الأعضاء.`);
                            return;
                        }

                        await api.addUserToGroup(userID, threadID);
                        console.log(`✅ تم إعادة العضو ${userID} إلى المجموعة ${threadID}`);

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