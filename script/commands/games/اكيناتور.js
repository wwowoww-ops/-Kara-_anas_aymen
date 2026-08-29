const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
name: "اكيناتور",
version: "2.1.0",
hasPermssion: 0,
credits: "انس - Gry KJ",
description: "لعبة اكيناتور يخمن الشخصية",
commandCategory: "العاب",
usages: "[اكيناتور]",
cooldowns: 5
};

async function NewGame() {
const firstRes = await fetch("https://ar.akinator.com/", {
headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
});
const cookies = firstRes.headers.get("set-cookie") || "";

const res = await fetch("https://ar.akinator.com/game", {
headers: {
"content-type": "application/x-www-form-urlencoded",
"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
"cookie": cookies,
"Referer": "https://ar.akinator.com/"
},
body: "cm=false&sid=1",
method: "POST"
});
const text = await res.text();

if (!text.includes("question-label")) {
console.log("AKI ERROR HTML:", text.slice(0, 1000));
throw new Error("المارد محجوب من Cloudflare");
}

const question = text.match(/<p class="question-text" id="question-label">(.+)</p>/)?.[1];
const session = text.match(/session: '(.+)'/)?.[1];
const signature = text.match(/signature: '(.+)'/)?.[1];

if (!session ||!signature) throw new Error("فشل جلب الجلسة");

return { question, si: session, co: signature, progression: "0.0000", step: "0", cookie: cookies };
}

async function NextGame(si, co, answer, progression, step, cookie) {
const params = new URLSearchParams({
'step': step,
'progression': progression,
'sid': 'NaN',
'cm': 'false',
'answer': answer,
'step_last_proposition': '',
'session': si,
'signature': co
});
const res = await fetch('https://ar.akinator.com/answer', {
method: "POST",
headers: {
"content-type": "application/x-www-form-urlencoded",
"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
"cookie": cookie || "",
"Referer": "https://ar.akinator.com/"
},
body: params
});
return await res.json();
}

async function BackGame(si, co, progression, step, cookie) {
const params = new URLSearchParams({
'step': step,
'progression': progression,
'sid': 'NaN',
'cm': 'false',
'session': si,
'signature': co
});
const res = await fetch('https://ar.akinator.com/cancel_answer', {
method: "POST",
headers: {
"content-type": "application/x-www-form-urlencoded",
"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
"cookie": cookie || "",
"Referer": "https://ar.akinator.com/"
},
body: params
});
return await res.json();
}

module.exports.run = async function({ api, event, Users, Threads, Currencies, models }) {
const { threadID, messageID } = event;
try {
api.setMessageReaction("🧞", messageID, () => {}, true);
const GenGame = await NewGame();
return api.sendMessage(
⌬ ━━ SOMI ━━ ⌬\n\n${GenGame.question} 👀\n\nالرجاء الرد ب:\nنعم | لا | لا اعلم | من الممكن | الضاهر لا | رجوع,
threadID,
(err, info) => {
if (err) return;
global.client.handleReply.push({
name: this.config.name,
messageID: info.messageID,
author: event.senderID,
progression: GenGame.progression,
si: GenGame.si,
co: GenGame.co,
step: GenGame.step,
cookie: GenGame.cookie
});
},
messageID
);
} catch (e) {
console.log(e);
return api.sendMessage(⌬ ━━ HINA GAMES ━━ ⌬\n\n❌ المارد دايخ شوية.. أعد المحاولة.\nالسبب: ${e.message}, threadID, messageID);
}
};

module.exports.handleReply = async function({ api, event, handleReply, Users, Threads, Currencies, models }) {
const { threadID, messageID } = event;
if (event.senderID!= handleReply.author) return;

let answer;
switch (event.body.trim()) {
case "نعم": answer = "0"; break;
case "لا": answer = "1"; break;
case "لا اعلم": answer = "2"; break;
case "من الممكن": answer = "3"; break;
case "الضاهر لا": answer = "4"; break;
case "رجوع": answer = "e"; break;
default:
return api.sendMessage(⌬ ━━ SOMI ━━ ⌬\n\n⚠️ الرد يكون:\nنعم | لا | لا اعلم | من الممكن | الضاهر لا | رجوع, threadID, messageID);
}

try {
let result;
if (answer == "e") {
result = await BackGame(handleReply.si, handleReply.co, handleReply.progression, handleReply.step, handleReply.cookie);
} else {
result = await NextGame(handleReply.si, handleReply.co, answer, handleReply.progression, handleReply.step, handleReply.cookie);
}

if (result?.name_proposition) {  
  const imgPath = path.join(__dirname, "cache", `aki_${Date.now()}.jpg`);  
  fs.ensureDirSync(path.join(__dirname, "cache"));  
  try {  
    const imgRes = await axios.get(result.photo, { responseType: "arraybuffer" });  
    fs.writeFileSync(imgPath, Buffer.from(imgRes.data));  
  } catch {}  

  const msg = `⌬ ━━ SOMI ━━ ⌬\n\n🪄| إســـم الشـخصـية: ❨${result.name_proposition}❩\n⌯↢ نبــــذة عنها: ${result.description_proposition}\n\nاكتب اكيناتور للعب مرة اخرى`;  

  if (fs.existsSync(imgPath)) {  
    return api.sendMessage({ body: msg, attachment: fs.createReadStream(imgPath) }, threadID, () => fs.unlinkSync(imgPath), messageID);  
  } else {  
    return api.sendMessage(msg, threadID, messageID);  
  }  
}  

return api.sendMessage(  
  `⌬ ━━ SOMI ━━ ⌬\n\n${result.question} 🚶\n\nالرجاء الرد ب:\nنعم | لا | لا اعلم | من الممكن | الضاهر لا | رجوع`,  
  threadID,  
  (err, info) => {  
    if (err) return;  
    global.client.handleReply.push({  
      name: this.config.name,  
      messageID: info.messageID,  
      author: event.senderID,  
      progression: result.progression,  
      si: handleReply.si,  
      co: handleReply.co,  
      step: result.step,  
      cookie: handleReply.cookie  
    });  
  },  
  messageID  
);

} catch (e) {
console.log(e);
return api.sendMessage(⌬ ━━ HINA GAMES ━━ ⌬\n\n❌ المارد دايخ شوية.. أعد المحاولة.\n${e.message}, threadID, messageID);
}
};