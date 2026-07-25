const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "لاست",
  version: "2.0.0",
  credits: "أبو هريرة",
  hasPermssion: 2,
  description: "عرض المجموعات والتحكم بها (مع المحظورة)",
  commandCategory: "developer",
  usages: "لاست",
  cooldowns: 5
};

module.exports.handleReply = async function({ api, event, Threads, handleReply }) {
  if (String(event.senderID) !== "61578581225040") return;
  
  const { body, threadID, messageID } = event;
  const arg = body.split(" ");
  const index = parseInt(arg[1]) - 1;
  const idgr = handleReply.groupid[index];
  const header = `⌬ ━━━━━━━━━━━━ ⌬`;

  if (!idgr) return api.sendMessage(`${header}\n⚠️ رقـم الـمـجـمـوعـة غـيـر صـحـيـح.`, threadID, messageID);

  if (arg[0] === "حظر") {
    const threadData = (await Threads.getData(idgr)) || {};
    const data = threadData.data || {};
    data.banned = true;
    await Threads.setData(idgr, { data });
    global.data.threadBanned.set(idgr, true);
    return api.sendMessage(`${header}\n✅ تـم حـظـر الـمـجـمـوعـة:\n⪼ ${idgr}`, threadID, messageID);
  }

  if (arg[0] === "الغاء_حظر" || arg[0] === "الغاء") {
    const threadData = (await Threads.getData(idgr)) || {};
    const data = threadData.data || {};
    data.banned = false;
    await Threads.setData(idgr, { data });
    global.data.threadBanned.delete(idgr);
    return api.sendMessage(`${header}\n✅ تـم إلـغـاء حـظـر الـمـجـمـوعـة:\n⪼ ${idgr}`, threadID, messageID);
  }

  if (arg[0] === "خروج" || arg[0] === "غادري") {
    return api.removeUserFromGroup(api.getCurrentUserID(), idgr, (err) => {
      if (err) return api.sendMessage(`${header}\n❌ فـشل الـخروج.`, threadID, messageID);
      return api.sendMessage(`${header}\n✅ تـم الـخـروج مـن الـمـجـمـوعـة.`, threadID, messageID);
    });
  }
};

module.exports.run = async function({ api, event }) {
  if (String(event.senderID) !== "61578581225040") return;

  const header = `⌬ ━━━━━━━━━━━━ ⌬\n      ⚙️ قـائـمـة الـمـجـمـوعات\n⌬ ━━━━━━━━━━━━ ⌬`;
  
  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 📋 جلب المجموعات النشطة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const inbox = await api.getThreadList(100, null, ['INBOX']);
    const list = inbox.filter(g => g.isSubscribed && g.isGroup);
    
    let msg = `${header}\n`, groupid = [], i = 1;

    msg += `📊 المجموعات النشطة (${list.length}):\n\n`;
    for (const g of list) {
      msg += `${i++}. ${g.name || "مجموعة بدون اسم"}\n⪼ عـدد: ${g.participantIDs.length} | ID: ${g.threadID}\n\n`;
      groupid.push(g.threadID);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔒 جلب المجموعات المحظورة
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const bannedPath = "./data/banned.json";
    const restrictPath = "./data/restrict.json";
    const bannedGroups = [];

    // من banned.json
    if (fs.existsSync(bannedPath)) {
      const bannedData = JSON.parse(fs.readFileSync(bannedPath));
      for (const id in bannedData) {
        if (!groupid.includes(id)) {
          bannedGroups.push({ id, reason: bannedData[id].reason || "حظر عام" });
        }
      }
    }

    // من restrict.json
    if (fs.existsSync(restrictPath)) {
      const restrictData = JSON.parse(fs.readFileSync(restrictPath));
      for (const id in restrictData) {
        if (restrictData[id].active && !groupid.includes(id)) {
          // تجنب التكرار
          if (!bannedGroups.find(g => g.id === id)) {
            bannedGroups.push({ id, reason: "تقييد" });
          }
        }
      }
    }

    if (bannedGroups.length > 0) {
      msg += `\n🔒 المجموعات المحظورة (${bannedGroups.length}):\n\n`;
      bannedGroups.forEach((g, index) => {
        msg += `${index + 1}. ${g.id}\n⪼ السبب: ${g.reason}\n\n`;
        groupid.push(g.id);
      });
    }

    msg += `⌬ ━━━━━━━━━━━━ ⌬\n💡 رد بـ:\n• خروج [رقم] للخروج\n• حظر [رقم] للحظر\n• الغاء_حظر [رقم] لإلغاء الحظر`;

    return api.sendMessage(msg, event.threadID, (e, info) => {
      if (e) return console.log(e);
      global.client.handleReply.push({
        name: "لاست",
        messageID: info.messageID,
        groupid,
        type: 'reply'
      });
    }, event.messageID);
  } catch (err) {
    console.error("❌ خطأ في لاست:", err);
    return api.sendMessage(`❌ فـشل جـلـب الـمـجـمـوعات: ${err.message}`, event.threadID);
  }
};