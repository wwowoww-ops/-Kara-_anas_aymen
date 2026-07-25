module.exports.run = async function({ api, event, args, Users, Threads, Currencies, models }) {
    const { threadID, messageID, senderID } = event;
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎰 إعدادات اللعبة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const slots = ["🍒", "🍋", "🍊", "🍇", "🍉", "⭐", "💎", "🔔", "🎰", "7️⃣"];
    
    const slot1 = slots[Math.floor(Math.random() * slots.length)];
    const slot2 = slots[Math.floor(Math.random() * slots.length)];
    const slot3 = slots[Math.floor(Math.random() * slots.length)];
    
    let result = "";
    let win = false;
    let winType = "";
    let emoji = "😅";
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🏆 تحديد الفوز
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (slot1 === slot2 && slot2 === slot3) {
        // ثلاث متطابقات (جاك بوت)
        result = "🎉 جاك بوت! فزت بالجائزة الكبرى! 🎉";
        win = true;
        winType = "جاك بوت";
        emoji = "🏆";
        
        // جائزة إضافية حسب الرمز
        const jackpotBonuses = {
            "💎": "💎 فزت بـ 1000 نقطة!",
            "7️⃣": "7️⃣ فزت بـ 500 نقطة!",
            "⭐": "⭐ فزت بـ 300 نقطة!",
            "🎰": "🎰 فزت بـ 200 نقطة!"
        };
        result += `\n${jackpotBonuses[slot1] || "🎉 فزت بـ 100 نقطة!"}`;
        
    } else if (slot1 === slot2 || slot2 === slot3 || slot1 === slot3) {
        // اثنان متطابقان
        const matched = slot1 === slot2 ? slot1 : slot2 === slot3 ? slot2 : slot1;
        result = `✨ زوجين! ${matched} ${matched} اقتربت من الفوز!`;
        win = true;
        winType = "زوجين";
        emoji = "😊";
        
        // جائزة صغيرة
        const bonus = {
            "🍒": "🍒 ربحت 20 نقطة!",
            "🍋": "🍋 ربحت 15 نقطة!",
            "🍊": "🍊 ربحت 15 نقطة!",
            "🍇": "🍇 ربحت 20 نقطة!",
            "🍉": "🍉 ربحت 15 نقطة!",
            "⭐": "⭐ ربحت 30 نقطة!",
            "💎": "💎 ربحت 50 نقطة!",
            "🔔": "🔔 ربحت 25 نقطة!",
            "🎰": "🎰 ربحت 40 نقطة!",
            "7️⃣": "7️⃣ ربحت 60 نقطة!"
        };
        result += `\n${bonus[matched] || "ربحت 10 نقاط!"}`;
        
    } else {
        // لا يوجد تطابق
        const loseMessages = [
            "😅 حظ أوفر المرة الجاية!",
            "😂 أوف! جرب حظك مرة ثانية",
            "😭 لا لا لا... حظ سيء",
            "🤣 كان قريب بس لا",
            "💔 للأسف، ما فزت",
            "😎 عادي، الجاي أحسن"
        ];
        result = loseMessages[Math.floor(Math.random() * loseMessages.length)];
        win = false;
        emoji = "😅";
    }
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📊 إحصائيات اللعبة (للمتعة)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (!global.slotStats) global.slotStats = {};
    if (!global.slotStats[threadID]) {
        global.slotStats[threadID] = { plays: 0, wins: 0, jackpots: 0 };
    }
    
    global.slotStats[threadID].plays++;
    if (win) global.slotStats[threadID].wins++;
    if (winType === "جاك بوت") global.slotStats[threadID].jackpots++;
    
    const stats = global.slotStats[threadID];
    const winRate = Math.round((stats.wins / stats.plays) * 100);
    
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📨 الرسالة النهائية
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const border = "🔲".repeat(5);
    
    const message = `⌬ ━━ HINA FUN ━━ ⌬\n\n` +
                    `🎰 ماكينة الحظ 🎰\n\n` +
                    `┌─────────────┐\n` +
                    `│  ${slot1} │ ${slot2} │ ${slot3}  │\n` +
                    `└─────────────┘\n\n` +
                    `${emoji} ${result}\n\n` +
                    `📊 إحصائياتك:\n` +
                    `🎮 العب: ${stats.plays}\n` +
                    `🏆 فوز: ${stats.wins}\n` +
                    `💎 جاك بوت: ${stats.jackpots}\n` +
                    `📈 نسبة الفوز: ${winRate}%\n\n` +
                    `💡 استخدم: سلوت`;

    return api.sendMessage(message, threadID, messageID);
};

module.exports.config = {
    name: "سلوت",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "لعبة ماكينة الحظ",
    commandCategory: "fun",
    usages: "سلوت",
    cooldowns: 5
};