if (!global.guessGames) global.guessGames = {};

module.exports.run = async function({ api, event, args, Users, Threads, Currencies, models }) {
    const { threadID, messageID, senderID } = event;
    
    if (!global.guessGames[threadID]) {
        const randomNum = Math.floor(Math.random() * 100) + 1;
        global.guessGames[threadID] = {
            number: randomNum,
            attempts: 0,
            maxAttempts: 10
        };
        
        return api.sendMessage(
            `⌬ ━━ HINA GAMES ━━ ⌬\n\n🎮 بدأت لعبة التخمين!\n🔢 خمن رقم من 1 إلى 100\n📊 لديك 10 محاولات\n\n📝 اكتب: خمن [الرقم]`,
            threadID,
            messageID
        );
    }
    
    const guess = parseInt(args[0]);
    if (isNaN(guess) || guess < 1 || guess > 100) {
        return api.sendMessage(
            `⌬ ━━ HINA GAMES ━━ ⌬\n\n⚠️ اكتب رقم صحيح من 1 إلى 100`,
            threadID,
            messageID
        );
    }
    
    const game = global.guessGames[threadID];
    game.attempts++;
    
    if (guess === game.number) {
        delete global.guessGames[threadID];
        return api.sendMessage(
            `⌬ ━━ HINA GAMES ━━ ⌬\n\n🎉 مبروك! لقد خمنت الرقم الصحيح! 🎉\n\n🔢 الرقم الصحيح: ${game.number}\n📊 عدد المحاولات: ${game.attempts}\n\n🏆 أنت بطل! 🌟`,
            threadID,
            messageID
        );
    }
    
    if (game.attempts >= game.maxAttempts) {
        delete global.guessGames[threadID];
        return api.sendMessage(
            `⌬ ━━ HINA GAMES ━━ ⌬\n\n😅 انتهت المحاولات!\n🔢 الرقم الصحيح كان: ${game.number}\n\n💪 حاول مرة أخرى!`,
            threadID,
            messageID
        );
    }
    
    const hint = guess > game.number ? "🔻 الرقم أصغر" : "🔺 الرقم أكبر";
    const remaining = game.maxAttempts - game.attempts;
    
    return api.sendMessage(
        `⌬ ━━ HINA GAMES ━━ ⌬\n\n${hint}\n📊 المحاولات المتبقية: ${remaining}\n📝 خمن مرة أخرى!`,
        threadID,
        messageID
    );
};

module.exports.config = {
    name: "خمن",
    version: "2.0.0",
    hasPermssion: 0,
    credits: "أبو هريرة",
    description: "لعبة تخمين الرقم",
    commandCategory: "games",
    usages: "خمن [الرقم]",
    cooldowns: 3
};