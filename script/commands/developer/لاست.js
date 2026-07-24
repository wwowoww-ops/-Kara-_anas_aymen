module.exports.config = {
  name: "لاست",
  version: "1.1.2",
  credits: "أبو هريرة",
  hasPermssion: 2,
  description: "عرض المجموعات والتحكم بها",
  commandCategory: "developer",
  usages: "لاست",
  cooldowns: 5
};

module.exports.handleReply = async function({ api, event, Threads, handleReply }) {
  // التحقق من المطور (تم التعديل إلى معرفك)
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

  if (arg[0] === "خروج" || arg[0] === "غادري") {
    return api.removeUserFromGroup(api.getCurrentUserID(), idgr, (err) => {
      if (err) return api.sendMessage(`${header}\n❌ فـشل الـخروج.`, threadID, messageID);
      return api.sendMessage(`${header}\n✅ تـم الـخـروج مـن الـمـجـمـوعـة.`, threadID, messageID);
    });
  }
};

module.exports.run = async function({ api, event }) {
  // التحقق من المطور (تم التعديل إلى معرفك)
  if (String(event.senderID) !== "61578581225040") return;

  const header = `⌬ ━━━━━━━━━━━━ ⌬\n      ⚙️ قـائـمـة الـمـجـمـوعات\n⌬ ━━━━━━━━━━━━ ⌬`;
  
  try {
    const inbox = await api.getThreadList(50, null, ['INBOX']);
    const list = inbox.filter(g => g.isSubscribed && g.isGroup);
    
    let msg = `${header}\n`, groupid = [], i = 1;

    for (const g of list) {
      msg += `${i++}. ${g.name || "مجموعة بدون اسم"}\n⪼ عـدد: ${g.participantIDs.length} | ID: ${g.threadID}\n\n`;
      groupid.push(g.threadID);
    }

    msg += `⌬ ━━━━━━━━━━━━ ⌬\n💡 رد بـ (خروج أو حظر) + الـرقـم`;

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
    return api.sendMessage("❌ فـشل جـلـب الـمـجـمـوعات.", event.threadID);
  }
};
