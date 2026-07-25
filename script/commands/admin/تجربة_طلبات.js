module.exports.config = {
  name: "تجربة_طلبات",
  version: "1.0.0",
  hasPermssion: 1,
  credits: "أبو هريرة",
  description: "تجربة جلب طلبات الانضمام",
  commandCategory: "admin",
  usages: "تجربة_طلبات",
  cooldowns: 5
};

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;

  try {
    // جلب معلومات المجموعة
    const threadInfo = await api.getThreadInfo(threadID);
    
    let msg = `⌬ ━━ HINA ADMIN ━━ ⌬\n\n📊 تقرير فحص الطلبات:\n\n`;
    
    // التحقق من وجود pendingRequests
    if (threadInfo.pendingRequests) {
      msg += `📋 pendingRequests: ${threadInfo.pendingRequests.length}\n`;
    } else {
      msg += `❌ pendingRequests: غير موجود\n`;
    }
    
    // التحقق من وجود approvalQueue
    if (threadInfo.approvalQueue) {
      msg += `📋 approvalQueue: ${threadInfo.approvalQueue.length}\n`;
    } else {
      msg += `❌ approvalQueue: غير موجود\n`;
    }
    
    // عرض جميع المفاتيح الموجودة
    msg += `\n🔑 المفاتيح المتوفرة في threadInfo:\n`;
    const keys = Object.keys(threadInfo);
    msg += keys.join(", ");
    
    // إذا كان هناك pendingRequests، عرضها
    if (threadInfo.pendingRequests && threadInfo.pendingRequests.length > 0) {
      msg += `\n\n📋 أول 5 طلبات:\n`;
      for (let i = 0; i < Math.min(threadInfo.pendingRequests.length, 5); i++) {
        const req = threadInfo.pendingRequests[i];
        msg += `${i+1}. ${JSON.stringify(req)}\n`;
      }
    }
    
    return api.sendMessage(msg, threadID, messageID);
    
  } catch (error) {
    return api.sendMessage(
      `⌬ ━━ HINA ADMIN ━━ ⌬\n\n❌ خطأ: ${error.message}`,
      threadID,
      messageID
    );
  }
};