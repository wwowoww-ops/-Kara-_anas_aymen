// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛡️ نظام الحماية المتكامل (من أمر حماية)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
                        
                        // إعادة الاسم الأصلي
                        await api.changeNickname(originalName, threadID, changedUser);
                        
                        // رسالة مامي
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
                            
                            // طرد العضو المضاف
                            await api.removeUserFromGroup(user.userFbId, threadID);
                            
                            // رسالة مامي
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
                    // إعادة الاسم القديم (نحتفظ بالاسم الحالي مؤقتاً)
                    const currentInfo = await api.getThreadInfo(threadID);
                    const oldName = currentInfo.name || "المجموعة";
                    
                    // رسالة مامي
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
                    // رسالة مامي
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
                    // رسالة مامي
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
                    // رسالة مامي
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