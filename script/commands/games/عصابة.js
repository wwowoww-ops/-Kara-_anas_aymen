const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "عصابة",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "إنشاء وإدارة العصابات مع موافقة القائد",
  commandCategory: "fun",
  usages: "عصابة [انشاء/انضمام/خروج/معلومات/اعضاء/طرد/حل/موافقة]",
  cooldowns: 5
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, mentions, messageReply } = event;
  const gangsPath = "./data/gangs.json";
  const requestsPath = "./data/gang_requests.json";

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📁 التأكد من وجود ملفات العصابات والطلبات
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (!fs.existsSync(gangsPath)) {
    fs.writeFileSync(gangsPath, JSON.stringify({}));
  }
  if (!fs.existsSync(requestsPath)) {
    fs.writeFileSync(requestsPath, JSON.stringify({}));
  }

  let gangs = JSON.parse(fs.readFileSync(gangsPath));
  let requests = JSON.parse(fs.readFileSync(requestsPath));

  if (!gangs[threadID]) {
    gangs[threadID] = [];
  }
  if (!requests[threadID]) {
    requests[threadID] = {};
  }

  const subCommand = args[0]?.toLowerCase();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🏁 انشاء عصابة
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (subCommand === "انشاء" || subCommand === "create") {
    const gangName = args.slice(1).join(" ");

    if (!gangName) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n📝 الاستخدام:\nعصابة انشاء [اسم العصابة]\nمثال: عصابة انشاء الشياطين`,
        threadID,
        messageID
      );
    }

    const existingGang = gangs[threadID].find(g => g.name.toLowerCase() === gangName.toLowerCase());
    if (existingGang) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ هناك عصابة بنفس الاسم بالفعل!`,
        threadID,
        messageID
      );
    }

    const isInGang = gangs[threadID].some(g => g.members.includes(senderID));
    if (isInGang) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ أنت بالفعل في عصابة! اخرج منها أولاً.`,
        threadID,
        messageID
      );
    }

    const newGang = {
      name: gangName,
      leader: senderID,
      members: [senderID],
      pending: [],
      created: Date.now(),
      membersCount: 1
    };

    gangs[threadID].push(newGang);
    fs.writeFileSync(gangsPath, JSON.stringify(gangs, null, 2));

    let leaderName = "أنت";
    try {
      const userInfo = await api.getUserInfo(senderID);
      leaderName = userInfo[senderID]?.name || "أنت";
    } catch (e) {}

    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n✅ تم إنشاء العصابة!\n\n🏷️ اسم العصابة: ${gangName}\n👑 القائد: ${leaderName}\n👥 عدد الأعضاء: 1\n\n📝 الأوامر:\n• عصابة انضمام [اسم العصابة]\n• عصابة موافقة [@منشن] (للقائد)\n• عصابة خروج\n• عصابة معلومات\n• عصابة اعضاء\n• عصابة طرد [@منشن] (للقائد)\n• عصابة حل (للقائد)`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📥 طلب انضمام لعصابة
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (subCommand === "انضمام" || subCommand === "join") {
    const gangName = args.slice(1).join(" ");

    if (!gangName) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n📝 الاستخدام:\nعصابة انضمام [اسم العصابة]\nمثال: عصابة انضمام الشياطين`,
        threadID,
        messageID
      );
    }

    const gang = gangs[threadID].find(g => g.name.toLowerCase() === gangName.toLowerCase());
    if (!gang) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ لا توجد عصابة بهذا الاسم!`,
        threadID,
        messageID
      );
    }

    const isInGang = gangs[threadID].some(g => g.members.includes(senderID));
    if (isInGang) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ أنت بالفعل في عصابة!`,
        threadID,
        messageID
      );
    }

    // التحقق إذا كان العضو قد طلب بالفعل
    if (gang.pending && gang.pending.includes(senderID)) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n⏳ طلبك قيد الانتظار، انتظر موافقة القائد.`,
        threadID,
        messageID
      );
    }

    // إضافة طلب الانضمام
    if (!gang.pending) gang.pending = [];
    gang.pending.push(senderID);
    fs.writeFileSync(gangsPath, JSON.stringify(gangs, null, 2));

    // إرسال إشعار للقائد
    let leaderName = "القائد";
    let userName = "عضو";
    try {
      const userInfo = await api.getUserInfo(gang.leader);
      leaderName = userInfo[gang.leader]?.name || "القائد";
      const userInfo2 = await api.getUserInfo(senderID);
      userName = userInfo2[senderID]?.name || "عضو";
    } catch (e) {}

    await api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n📥 طلب انضمام جديد!\n\n👤 العضو: ${userName}\n🏷️ العصابة: ${gang.name}\n\n📝 استخدم: عصابة موافقة @${userName}`,
      gang.leader
    );

    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n✅ تم إرسال طلب الانضمام إلى القائد.\n⏳ انتظر موافقته.`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ✅ موافقة القائد على العضو (للقائد فقط)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (subCommand === "موافقة" || subCommand === "approve") {
    // البحث عن عصابة القائد
    const gang = gangs[threadID].find(g => g.leader === senderID);
    if (!gang) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ أنت لست قائد أي عصابة!`,
        threadID,
        messageID
      );
    }

    if (Object.keys(mentions).length === 0) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n📝 الاستخدام:\nعصابة موافقة @منشن\nمثال: عصابة موافقة @أحمد`,
        threadID,
        messageID
      );
    }

    const targetID = Object.keys(mentions)[0];
    const targetName = mentions[targetID].replace("@", "");

    // التحقق من أن العضو في قائمة الانتظار
    if (!gang.pending || !gang.pending.includes(targetID)) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ ${targetName} ليس لديه طلب انضمام!`,
        threadID,
        messageID
      );
    }

    // موافقة العضو
    gang.pending = gang.pending.filter(id => id !== targetID);
    gang.members.push(targetID);
    gang.membersCount = gang.members.length;
    fs.writeFileSync(gangsPath, JSON.stringify(gangs, null, 2));

    // إرسال إشعار للعضو
    await api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n✅ تم قبولك في عصابة ${gang.name}! 🎉`,
      targetID
    );

    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n✅ تم قبول ${targetName} في عصابة ${gang.name}! 🎉`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚪 خروج من العصابة
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (subCommand === "خروج" || subCommand === "leave") {
    const gangIndex = gangs[threadID].findIndex(g => g.members.includes(senderID));
    if (gangIndex === -1) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ أنت لست في أي عصابة!`,
        threadID,
        messageID
      );
    }

    const gang = gangs[threadID][gangIndex];

    if (gang.leader === senderID) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ أنت قائد العصابة! لا يمكنك الخروج.\nاستخدم: عصابة حل لحل العصابة.`,
        threadID,
        messageID
      );
    }

    gang.members = gang.members.filter(id => id !== senderID);
    gang.membersCount = gang.members.length;
    fs.writeFileSync(gangsPath, JSON.stringify(gangs, null, 2));

    let userName = "عضو";
    try {
      const userInfo = await api.getUserInfo(senderID);
      userName = userInfo[senderID]?.name || "عضو";
    } catch (e) {}

    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n✅ ${userName} خرج من عصابة ${gang.name}!`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📋 معلومات العصابة
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (subCommand === "معلومات" || subCommand === "info") {
    const gang = gangs[threadID].find(g => g.members.includes(senderID));
    if (!gang) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ أنت لست في أي عصابة!`,
        threadID,
        messageID
      );
    }

    let leaderName = "غير معروف";
    try {
      const userInfo = await api.getUserInfo(gang.leader);
      leaderName = userInfo[gang.leader]?.name || "غير معروف";
    } catch (e) {}

    const createdDate = new Date(gang.created).toLocaleDateString("ar");

    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n📋 معلومات العصابة:\n\n🏷️ الاسم: ${gang.name}\n👑 القائد: ${leaderName}\n👥 عدد الأعضاء: ${gang.membersCount}\n📅 تاريخ الإنشاء: ${createdDate}`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 👥 عرض الأعضاء
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (subCommand === "اعضاء" || subCommand === "members") {
    const gang = gangs[threadID].find(g => g.members.includes(senderID));
    if (!gang) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ أنت لست في أي عصابة!`,
        threadID,
        messageID
      );
    }

    let membersList = "";
    for (let i = 0; i < gang.members.length; i++) {
      const id = gang.members[i];
      let name = "عضو";
      try {
        const userInfo = await api.getUserInfo(id);
        name = userInfo[id]?.name || "عضو";
      } catch (e) {}
      const isLeader = id === gang.leader ? " 👑" : "";
      membersList += `${i+1}. ${name}${isLeader}\n`;
    }

    // عرض الطلبات المعلقة (للقائد فقط)
    let pendingList = "";
    if (gang.leader === senderID && gang.pending && gang.pending.length > 0) {
      pendingList = `\n⏳ طلبات انتظار (${gang.pending.length}):\n`;
      for (let i = 0; i < gang.pending.length; i++) {
        const id = gang.pending[i];
        let name = "عضو";
        try {
          const userInfo = await api.getUserInfo(id);
          name = userInfo[id]?.name || "عضو";
        } catch (e) {}
        pendingList += `${i+1}. ${name}\n`;
      }
      pendingList += `\n📝 استخدم: عصابة موافقة @منشن للموافقة`;
    }

    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n👥 أعضاء عصابة ${gang.name} (${gang.membersCount}):\n\n${membersList}${pendingList}`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🚫 طرد عضو (للقائد فقط) - بالرد أو المنشن
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (subCommand === "طرد" || subCommand === "kick") {
    const gang = gangs[threadID].find(g => g.leader === senderID);
    if (!gang) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ أنت لست قائد أي عصابة!`,
        threadID,
        messageID
      );
    }

    let targetID;
    let targetName = "عضو";

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🎯 تحديد المستهدف (منشن أو رد)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (messageReply) {
      targetID = messageReply.senderID;
      try {
        const userInfo = await api.getUserInfo(targetID);
        targetName = userInfo[targetID]?.name || "عضو";
      } catch (e) {}
    } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
      targetName = mentions[targetID].replace("@", "");
    } else {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n📝 الاستخدام:\n• عصابة طرد @منشن\n• أو رد على رسالة العضو ثم عصابة طرد`,
        threadID,
        messageID
      );
    }

    // منع طرد القائد نفسه
    if (targetID === senderID) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ لا يمكنك طرد نفسك!`,
        threadID,
        messageID
      );
    }

    // التحقق من أن العضو في العصابة
    if (!gang.members.includes(targetID)) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ ${targetName} ليس في عصابة ${gang.name}!`,
        threadID,
        messageID
      );
    }

    // طرد العضو
    gang.members = gang.members.filter(id => id !== targetID);
    gang.membersCount = gang.members.length;
    fs.writeFileSync(gangsPath, JSON.stringify(gangs, null, 2));

    // إرسال إشعار للعضو المطرود
    await api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n🚫 تم طردك من عصابة ${gang.name}!`,
      targetID
    );

    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n🚫 تم طرد ${targetName} من عصابة ${gang.name}!`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 💥 حل العصابة (للقائد فقط)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (subCommand === "حل" || subCommand === "disband") {
    const gangIndex = gangs[threadID].findIndex(g => g.leader === senderID);
    if (gangIndex === -1) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n❌ أنت لست قائد أي عصابة!`,
        threadID,
        messageID
      );
    }

    const gangName = gangs[threadID][gangIndex].name;
    gangs[threadID].splice(gangIndex, 1);
    fs.writeFileSync(gangsPath, JSON.stringify(gangs, null, 2));

    return api.sendMessage(
      `⌬ ━━ HINA FUN ━━ ⌬\n\n💥 تم حل عصابة ${gangName}!`,
      threadID,
      messageID
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 📝 عرض قائمة العصابات
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (!subCommand) {
    if (gangs[threadID].length === 0) {
      return api.sendMessage(
        `⌬ ━━ HINA FUN ━━ ⌬\n\n📭 لا توجد عصابات في هذه المجموعة.\n\n📝 استخدم: عصابة انشاء [اسم] لإنشاء عصابة`,
        threadID,
        messageID
      );
    }

    let list = `⌬ ━━ HINA FUN ━━ ⌬\n\n📋 قائمة العصابات (${gangs[threadID].length}):\n\n`;
    for (let i = 0; i < gangs[threadID].length; i++) {
      const g = gangs[threadID][i];
      list += `${i+1}. ${g.name} (${g.membersCount} عضو)\n`;
    }

    list += `\n📝 الأوامر:\n• عصابة انشاء [اسم]\n• عصابة انضمام [اسم]\n• عصابة موافقة [@منشن] (للقائد)\n• عصابة خروج\n• عصابة معلومات\n• عصابة اعضاء\n• عصابة طرد [@منشن] (للقائد)\n• عصابة حل (للقائد)`;

    return api.sendMessage(list, threadID, messageID);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ❌ أمر غير معروف
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return api.sendMessage(
    `⌬ ━━ HINA FUN ━━ ⌬\n\n📝 الأوامر المتاحة:\n\n• عصابة انشاء [اسم] - إنشاء عصابة جديدة\n• عصابة انضمام [اسم] - طلب الانضمام لعصابة\n• عصابة موافقة [@منشن] - قبول عضو (للقائد)\n• عصابة خروج - الخروج من العصابة\n• عصابة معلومات - عرض معلومات عصائبتك\n• عصابة اعضاء - عرض أعضاء عصائبتك\n• عصابة طرد [@منشن] - طرد عضو (للقائد)\n• عصابة حل - حل العصابة (للقائد)`,
    threadID,
    messageID
  );
};