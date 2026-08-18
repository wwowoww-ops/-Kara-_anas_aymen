/**
 * دالة ذكية لاستخراج المنشن من الرسالة
 * تضيف رقم وهمي بين الأمر والمنشن لضمان عمل المنشن دائماً
 * @param {Object} event - حدث الرسالة
 * @param {Array} args - معاملات الأمر
 * @returns {String|null} - معرف المستخدم المنشن أو null
 */
module.exports.extractMention = function(event, args) {
  const { mentions, type, messageReply } = event;
  
  // التحقق من المنشن أولاً
  if (Object.keys(mentions || {}).length > 0) {
    return Object.keys(mentions)[0];
  }
  
  // التحقق من الرد
  if (type === "message_reply" && messageReply) {
    return messageReply.senderID;
  }
  
  // التحقق من الأيدي المباشر
  if (args[0] && !isNaN(args[0])) {
    return args[0];
  }
  
  return null;
};

/**
 * تحويل النص إلى خط Bold Sans
 * @param {String} text - النص المراد تحويله
 * @returns {String} - النص بخط Bold Sans
 */
module.exports.toBoldSans = function(text) {
  const chars = {
    'a': '𝗔', 'b': '𝗕', 'c': '𝗖', 'd': '𝗗', 'e': '𝗘', 'f': '𝗙', 'g': '𝗚', 
    'h': '𝗛', 'i': '𝗜', 'j': '𝗝', 'k': '𝗞', 'l': '𝗟', 'm': '𝗠', 'n': '𝗡',
    'o': '𝗢', 'p': '𝗣', 'q': '𝗤', 'r': '𝗥', 's': '𝗦', 't': '𝗧', 'u': '𝗨',
    'v': '𝗩', 'w': '𝗪', 'x': '𝗫', 'y': '𝗬', 'z': '𝗭',
    'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 
    'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡',
    'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨',
    'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭'
  };
  return text.toUpperCase().split('').map(c => chars[c] || c).join('');
};
