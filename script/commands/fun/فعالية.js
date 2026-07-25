const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "فعالية",
  version: "5.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "نظام فعاليات مع تحديات عشوائية للجميع",
  commandCategory: "fun",
  usages: "فعالية [create/start/end/join]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const fs = require("fs");
  const path = "./data/events.json";

  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, JSON.stringify({}));
  }

  let data = JSON.parse(fs.readFileSync(path));

  if (!data[threadID]) {
    data[threadID] = {
      active: false,
      participants: [],
      scores: {},
      started: false,
      gameType: null,
      currentChallenge: null,
      answered: [],
      questionCount: 0,
      rounds: 0,
      maxRounds: 5,
      creator: null,
      turn: 0
    };
  }

  const eventData = data[threadID];
  const subCommand = args[0]?.toLowerCase();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🆕 إنشاء فعالية (أي عضو)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (subCommand === "create") {
    if (eventData.active) {
      return api.sendMessage(
        `⛩️════════════『 🌸 الفعالية 🌸 』════════════⛩️\n\n⚠️ هناك فعالية نشطة بالفعل!`,
        threadID,
        messageID
      );
    }

    const games = ["تفكيك", "تجميع", "احضار ايموجي", "اسم ايموجي", "سؤال ديني", "سؤال ثقافي"];
    const randomGame = games[Math.floor(Math.random() * games.length)];

    data[threadID] = {
      active: true,
      participants: [],
      scores: {},
      started: false,
      gameType: randomGame,
      currentChallenge: null,
      answered: [],
      questionCount: 0,
      rounds: 0,
      maxRounds: 5,
      creator: senderID,
      turn: 0
    };

    fs.writeFileSync(path, JSON.stringify(data, null, 2));

    let creatorName = "أحد الأعضاء";
    try {
      const userInfo = await api.getUserInfo(senderID);
      creatorName = userInfo[senderID]?.name || "أحد الأعضاء";
    } catch (e) {}

    return api.sendMessage(
      `⛩️════════════『 🌸 الفعالية 🌸 』════════════⛩️\n\n✅ تم إنشاء فعالية جديدة!\n👤 المنشئ: ${creatorName}\n🎮 اللعبة: ${randomGame}\n\n📝 استخدم: فعالية join للانضمام\n🏁 استخدم: فعالية start لبدء الفعالية`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📥 الانضمام (أي عضو)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (subCommand === "join") {
    if (!eventData.active) {
      return api.sendMessage(
        `⛩️════════════『 🌸 الفعالية 🌸 』════════════⛩️\n\n❌ لا توجد فعالية نشطة.`,
        threadID,
        messageID
      );
    }

    if (eventData.started) {
      return api.sendMessage(
        `⛩️════════════『 🌸 الفعالية 🌸 』════════════⛩️\n\n⚠️ الفعالية بدأت بالفعل!`,
        threadID,
        messageID
      );
    }

    if (eventData.participants.includes(senderID)) {
      return api.sendMessage(
        `⛩️════════════『 🌸 الفعالية 🌸 』════════════⛩️\n\n🌸 أنت مشترك بالفعل!`,
        threadID,
        messageID
      );
    }

    eventData.participants.push(senderID);
    eventData.scores[senderID] = 0;
    fs.writeFileSync(path, JSON.stringify(data, null, 2));

    return api.sendMessage(
      `⛩️════════════『 🌸 الفعالية 🌸 』════════════⛩️\n\n✅ تم انضمامك للفعالية!\n👥 عدد المشاركين: ${eventData.participants.length}`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🏁 بدء الفعالية (أي عضو)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (subCommand === "start") {
    if (!eventData.active) {
      return api.sendMessage(
        `⛩️════════════『 🌸 الفعالية 🌸 』════════════⛩️\n\n❌ لا توجد فعالية.`,
        threadID,
        messageID
      );
    }

    if (eventData.started) {
      return api.sendMessage(
        `⛩️════════════『 🌸 الفعالية 🌸 』════════════⛩️\n\n⚠️ الفعالية بدأت بالفعل!`,
        threadID,
        messageID
      );
    }

    if (eventData.participants.length < 2) {
      return api.sendMessage(
        `⛩️════════════『 🌸 الفعالية 🌸 』════════════⛩️\n\n⚠️ لا يوجد مشاركين كافيين!\nيحتاج على الأقل 2 مشاركين.`,
        threadID,
        messageID
      );
    }

    eventData.started = true;
    eventData.rounds = 0;
    eventData.maxRounds = Math.min(5, eventData.participants.length * 2);
    fs.writeFileSync(path, JSON.stringify(data, null, 2));

    const challenge = getRandomChallenge(eventData.gameType);
    eventData.currentChallenge = challenge;
    eventData.answered = [];
    fs.writeFileSync(path, JSON.stringify(data, null, 2));

    return api.sendMessage(
      `⛩️════════════『 🌸 الفعالية 🌸 』════════════⛩️\n\n🏁 بدأت الفعالية!\n🎮 اللعبة: ${eventData.gameType}\n👥 عدد المشاركين: ${eventData.participants.length}\n📊 الجولة: 1/${eventData.maxRounds}\n\n📝 ${challenge}`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 عرض النتائج
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (subCommand === "end" || subCommand === "نتيجة") {
    if (!eventData.active) {
      return api.sendMessage(
        `⛩️════════════『 🌸 الفعالية 🌸 』════════════⛩️\n\n❌ لا توجد فعالية.`,
        threadID,
        messageID
      );
    }

    const sorted = Object.entries(eventData.scores).sort((a, b) => b[1] - a[1]);

    let top3List = "";
    const medals = ["🥇", "🥈", "🥉"];
    for (let i = 0; i < Math.min(3, sorted.length); i++) {
      const id = sorted[i][0];
      const score = sorted[i][1];
      let name = "عضو";
      try {
        const info = await api.getUserInfo(id);
        name = info[id]?.name || "عضو";
      } catch (e) {}
      top3List += `${medals[i]} ${name} (${score} نقطة)\n`;
    }

    let allParticipants = "";
    for (let i = 0; i < sorted.length; i++) {
      const id = sorted[i][0];
      const score = sorted[i][1];
      let name = "عضو";
      try {
        const info = await api.getUserInfo(id);
        name = info[id]?.name || "عضو";
      } catch (e) {}
      allParticipants += `${i+1} ${name} (${score} نقطة)\n`;
    }

    const resultMsg = `⛩️════════════『 🌸 الفعالية 🌸 』════════════⛩️

📊 النتائج النهائية:

🌸『 الترتيب 』
${allParticipants}

🏆『 الفائزون 』
${top3List}

🎮 اللعبة: ${eventData.gameType}
📊 عدد الجولات: ${eventData.rounds}

⛩️════════════════════════════════⛩️`;

    data[threadID] = {
      active: false,
      participants: [],
      scores: {},
      started: false,
      gameType: null,
      currentChallenge: null,
      answered: [],
      questionCount: 0,
      rounds: 0,
      maxRounds: 5,
      creator: null,
      turn: 0
    };
    fs.writeFileSync(path, JSON.stringify(data, null, 2));

    return api.sendMessage(resultMsg, threadID, messageID);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📊 حالة الفعالية
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (subCommand === "status") {
    if (!eventData.active) {
      return api.sendMessage(
        `⛩️════════════『 🌸 الفعالية 🌸 』════════════⛩️\n\n❌ لا توجد فعالية نشطة.`,
        threadID,
        messageID
      );
    }

    const status = eventData.started ? "🟢 جارية" : "🟡 في الانتظار";
    let participantsList = "";
    for (let i = 0; i < eventData.participants.length; i++) {
      const id = eventData.participants[i];
      let name = "عضو";
      try {
        const info = await api.getUserInfo(id);
        name = info[id]?.name || "عضو";
      } catch (e) {}
      const score = eventData.scores[id] || 0;
      participantsList += `${i+1} ${name} (${score} نقطة)\n`;
    }

    return api.sendMessage(
      `⛩️════════════『 🌸 الفعالية 🌸 』════════════⛩️

📊 حالة الفعالية: ${status}
🎮 اللعبة: ${eventData.gameType}
👥 عدد المشاركين: ${eventData.participants.length}
📊 الجولة: ${eventData.rounds}/${eventData.maxRounds}

🌸『 المشاركون 』
${participantsList}

📝 استخدم: فعالية end لإنهاء الفعالية`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⚠️ أمر غير معروف
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return api.sendMessage(
    `⛩️════════════『 🌸 الفعالية 🌸 』════════════⛩️

📝 الأوامر المتاحة:

• فعالية create - إنشاء فعالية جديدة
• فعالية join - الانضمام للفعالية
• فعالية start - بدء الفعالية
• فعالية status - عرض حالة الفعالية
• فعالية end - عرض النتائج النهائية

🎮 التحديات تظهر تلقائياً أثناء الفعالية!`,
    threadID,
    messageID
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 تحديات عشوائية (متنوعة وكثيرة)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getRandomChallenge(gameType) {
  const challenges = {
    "تفكيك": [
      // كلمات
      "🔹 فكّك كلمة 'مدرسة' إلى حروفها",
      "🔹 فكّك كلمة 'كتاب' إلى حروفها",
      "🔹 فكّك كلمة 'شمس' إلى حروفها",
      "🔹 فكّك كلمة 'قمر' إلى حروفها",
      "🔹 فكّك كلمة 'ورد' إلى حروفها",
      "🔹 فكّك كلمة 'بحر' إلى حروفها",
      "🔹 فكّك كلمة 'نجم' إلى حروفها",
      "🔹 فكّك كلمة 'سحاب' إلى حروفها",
      "🔹 فكّك كلمة 'مطر' إلى حروفها",
      "🔹 فكّك كلمة 'نور' إلى حروفها",
      "🔹 فكّك كلمة 'قلب' إلى حروفها",
      "🔹 فكّك كلمة 'عقل' إلى حروفها",
      "🔹 فكّك كلمة 'روح' إلى حروفها",
      "🔹 فكّك كلمة 'دنيا' إلى حروفها",
      "🔹 فكّك كلمة 'أمل' إلى حروفها",
      // جمل
      "🔹 فكّك جملة 'أنا أحب أمي' إلى كلماتها",
      "🔹 فكّك جملة 'السماء زرقاء' إلى كلماتها",
      "🔹 فكّك جملة 'الوردة حمراء' إلى كلماتها",
      "🔹 فكّك جملة 'الشمس مشرقة' إلى كلماتها",
      "🔹 فكّك جملة 'القمر جميل' إلى كلماتها",
      "🔹 فكّك جملة 'النجوم تتلألأ' إلى كلماتها",
      "🔹 فكّك جملة 'البحر هادئ' إلى كلماتها",
      "🔹 فكّك جملة 'الطيور تغرد' إلى كلماتها",
      "🔹 فكّك جملة 'الزهور تتفتح' إلى كلماتها",
      "🔹 فكّك جملة 'الأطفال يلعبون' إلى كلماتها",
      "🔹 فكّك جملة 'المعلم يشرح' إلى كلماتها",
      "🔹 فكّك جملة 'الطالب يذاكر' إلى كلماتها",
      "🔹 فكّك جملة 'الكتاب مفيد' إلى كلماتها",
      "🔹 فكّك جملة 'القصة ممتعة' إلى كلماتها",
      "🔹 فكّك جملة 'الرسم جميل' إلى كلماتها"
    ],
    "تجميع": [
      // كلمات
      "🔹 جمّع الحروف (م، د، ر، س، ة) لتكوين كلمة",
      "🔹 جمّع الحروف (ك، ت، ا، ب) لتكوين كلمة",
      "🔹 جمّع الحروف (ش، م، س) لتكوين كلمة",
      "🔹 جمّع الحروف (ق، م، ر) لتكوين كلمة",
      "🔹 جمّع الحروف (و، ر، د) لتكوين كلمة",
      "🔹 جمّع الحروف (ب، ح، ر) لتكوين كلمة",
      "🔹 جمّع الحروف (ن، ج، م) لتكوين كلمة",
      "🔹 جمّع الحروف (س، ح، ا، ب) لتكوين كلمة",
      "🔹 جمّع الحروف (م، ط، ر) لتكوين كلمة",
      "🔹 جمّع الحروف (ن، و، ر) لتكوين كلمة",
      "🔹 جمّع الحروف (ق، ل، ب) لتكوين كلمة",
      "🔹 جمّع الحروف (ع، ق، ل) لتكوين كلمة",
      "🔹 جمّع الحروف (ر، و، ح) لتكوين كلمة",
      "🔹 جمّع الحروف (د، ن، ي، ا) لتكوين كلمة",
      "🔹 جمّع الحروف (أ، م، ل) لتكوين كلمة",
      // جمل
      "🔹 جمّع الكلمات (أنا، أحب، أمي) لتكوين جملة",
      "🔹 جمّع الكلمات (السماء، زرقاء) لتكوين جملة",
      "🔹 جمّع الكلمات (الوردة، حمراء) لتكوين جملة",
      "🔹 جمّع الكلمات (الشمس، مشرقة) لتكوين جملة",
      "🔹 جمّع الكلمات (القمر، جميل) لتكوين جملة",
      "🔹 جمّع الكلمات (النجوم، تتلألأ) لتكوين جملة",
      "🔹 جمّع الكلمات (البحر، هادئ) لتكوين جملة",
      "🔹 جمّع الكلمات (الطيور، تغرد) لتكوين جملة",
      "🔹 جمّع الكلمات (الزهور، تتفتح) لتكوين جملة",
      "🔹 جمّع الكلمات (الأطفال، يلعبون) لتكوين جملة",
      "🔹 جمّع الكلمات (المعلم، يشرح) لتكوين جملة",
      "🔹 جمّع الكلمات (الطالب، يذاكر) لتكوين جملة",
      "🔹 جمّع الكلمات (الكتاب، مفيد) لتكوين جملة",
      "🔹 جمّع الكلمات (القصة، ممتعة) لتكوين جملة",
      "🔹 جمّع الكلمات (الرسم، جميل) لتكوين جملة"
    ],
    "احضار ايموجي": [
      "🔹 أحضر إيموجي يعبر عن السعادة",
      "🔹 أحضر إيموجي يعبر عن الحب",
      "🔹 أحضر إيموجي يعبر عن الغضب",
      "🔹 أحضر إيموجي يعبر عن المطر",
      "🔹 أحضر إيموجي يعبر عن النوم",
      "🔹 أحضر إيموجي يعبر عن الأكل",
      "🔹 أحضر إيموجي يعبر عن الرياضة",
      "🔹 أحضر إيموجي يعبر عن الموسيقى",
      "🔹 أحضر إيموجي يعبر عن الحيوانات",
      "🔹 أحضر إيموجي يعبر عن الطبيعة",
      "🔹 أحضر إيموجي يعبر عن الفرح",
      "🔹 أحضر إيموجي يعبر عن الحزن",
      "🔹 أحضر إيموجي يعبر عن الخوف",
      "🔹 أحضر إيموجي يعبر عن الدهشة",
      "🔹 أحضر إيموجي يعبر عن البرد"
    ],
    "اسم ايموجي": [
      "🔹 ما اسم هذا الإيموجي؟ 🌙",
      "🔹 ما اسم هذا الإيموجي؟ ☀️",
      "🔹 ما اسم هذا الإيموجي؟ 🌸",
      "🔹 ما اسم هذا الإيموجي؟ 🍎",
      "🔹 ما اسم هذا الإيموجي؟ 🚗",
      "🔹 ما اسم هذا الإيموجي؟ 🌊",
      "🔹 ما اسم هذا الإيموجي؟ 🌈",
      "🔹 ما اسم هذا الإيموجي؟ 🦋",
      "🔹 ما اسم هذا الإيموجي؟ 🌺",
      "🔹 ما اسم هذا الإيموجي؟ 🍉",
      "🔹 ما اسم هذا الإيموجي؟ 🏠",
      "🔹 ما اسم هذا الإيموجي؟ ⭐",
      "🔹 ما اسم هذا الإيموجي؟ 🌲",
      "🔹 ما اسم هذا الإيموجي؟ 🐱",
      "🔹 ما اسم هذا الإيموجي؟ 🐶"
    ],
    "سؤال ديني": [
      "🔹 كم عدد أركان الإسلام؟",
      "🔹 كم عدد أركان الإيمان؟",
      "🔹 ما هي أول سورة في القرآن؟",
      "🔹 ما هي آخر سورة في القرآن؟",
      "🔹 كم عدد سور القرآن؟",
      "🔹 من هو أول الأنبياء؟",
      "🔹 من هو آخر الأنبياء؟",
      "🔹 ما هي السورة التي تسمى قلب القرآن؟",
      "🔹 كم عدد آيات سورة الفاتحة؟",
      "🔹 ما هي أعظم آية في القرآن؟",
      "🔹 كم عدد الصلوات المفروضة؟",
      "🔹 ما هو شهر الصيام؟",
      "🔹 ما هي القبلة الأولى للمسلمين؟",
      "🔹 من هو الملقب بأمير المؤمنين؟",
      "🔹 كم عدد الرسل أولي العزم؟"
    ],
    "سؤال ثقافي": [
      "🔹 ما هي عاصمة مصر؟",
      "🔹 ما هي عاصمة السعودية؟",
      "🔹 ما هي عاصمة الإمارات؟",
      "🔹 كم عدد قارات العالم؟",
      "🔹 ما هي أكبر قارة في العالم؟",
      "🔹 ما هي أصغر قارة في العالم؟",
      "🔹 ما هي عاصمة فرنسا؟",
      "🔹 ما هي عاصمة ألمانيا؟",
      "🔹 ما هو أطول نهر في العالم؟",
      "🔹 ما هو أعلى جبل في العالم؟",
      "🔹 كم عدد ألوان قوس قزح؟",
      "🔹 ما هي أكبر محيط في العالم؟",
      "🔹 من هو مخترع المصباح الكهربائي؟",
      "🔹 من هو مخترع الهاتف؟",
      "🔹 ما هي لغة البرمجة الأكثر استخداماً؟"
    ]
  };

  const gameChallenges = challenges[gameType] || challenges["تفكيك"];
  return gameChallenges[Math.floor(Math.random() * gameChallenges.length)];
}