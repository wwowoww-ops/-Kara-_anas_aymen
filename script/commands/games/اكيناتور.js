const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "اكيناتور",
  version: "2.1.0",
  hasPermssion: 0,
  credits: "أبو هريرة",
  description: "لعبة اكيناتور يخمن الشخصية",
  commandCategory: "العاب",
  usages: "[اكيناتور]",
  cooldowns: 5
};

async function NewGame() {
  const firstRes = await fetch("https://ar.akinator.com/", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
  });

  const cookies =
    firstRes.headers.get("set-cookie") || "";

  const res = await fetch(
    "https://ar.akinator.com/game",
    {
      headers: {
        "content-type":
          "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "cookie": cookies,
        "Referer":
          "https://ar.akinator.com/"
      },
      body: "cm=false&sid=1",
      method: "POST"
    }
  );

  const text = await res.text();

  if (!text.includes("question-label")) {
    console.log(
      "AKI ERROR HTML:",
      text.slice(0, 1000)
    );

    throw new Error(
      "المارد محجوب من Cloudflare"
    );
  }

  const question =
    text.match(
      /<p class="question-text" id="question-label">(.+)<\/p>/
    )?.[1];

  const session =
    text.match(
      /session: '(.+)'/
    )?.[1];

  const signature =
    text.match(
      /signature: '(.+)'/
    )?.[1];

  if (!session || !signature) {
    throw new Error(
      "فشل جلب الجلسة"
    );
  }

  return {
    question,
    si: session,
    co: signature,
    progression: "0.0000",
    step: "0",
    cookie: cookies
  };
}

async function NextGame(
  si,
  co,
  answer,
  progression,
  step,
  cookie
) {
  const params =
    new URLSearchParams({
      step: step,
      progression: progression,
      sid: "NaN",
      cm: "false",
      answer: answer,
      step_last_proposition: "",
      session: si,
      signature: co
    });

  const res =
    await fetch(
      "https://ar.akinator.com/answer",
      {
        method: "POST",
        headers: {
          "content-type":
            "application/x-www-form-urlencoded",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "cookie":
            cookie || "",
          "Referer":
            "https://ar.akinator.com/"
        },
        body: params
      }
    );

  if (!res.ok) {
    throw new Error(
      `Akinator HTTP ${res.status}`
    );
  }

  return await res.json();
}

async function BackGame(
  si,
  co,
  progression,
  step,
  cookie
) {
  const params =
    new URLSearchParams({
      step: step,
      progression: progression,
      sid: "NaN",
      cm: "false",
      session: si,
      signature: co
    });

  const res =
    await fetch(
      "https://ar.akinator.com/cancel_answer",
      {
        method: "POST",
        headers: {
          "content-type":
            "application/x-www-form-urlencoded",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "cookie":
            cookie || "",
          "Referer":
            "https://ar.akinator.com/"
        },
        body: params
      }
    );

  if (!res.ok) {
    throw new Error(
      `Akinator HTTP ${res.status}`
    );
  }

  return await res.json();
}

module.exports.run = async function ({
  api,
  event
}) {
  const {
    threadID,
    messageID
  } = event;

  try {

    if (
      typeof api.setMessageReaction ===
      "function"
    ) {
      api.setMessageReaction(
        "🧞",
        messageID,
        () => {},
        true
      );
    }

    const GenGame =
      await NewGame();

    return api.sendMessage(
      `⌬ ━━ HINA GAMES ━━ ⌬

${GenGame.question} 👀

الرجاء الرد ب:
نعم | لا | لا اعلم | من الممكن | الظاهر لا | رجوع`,
      threadID,
      (err, info) => {

        if (err || !info) {
          return;
        }

        if (
          !global.client.handleReply
        ) {
          global.client.handleReply = [];
        }

        global.client.handleReply.push({
          name:
            module.exports.config.name,
          messageID:
            info.messageID,
          author:
            String(event.senderID),
          progression:
            GenGame.progression,
          si:
            GenGame.si,
          co:
            GenGame.co,
          step:
            GenGame.step,
          cookie:
            GenGame.cookie
        });
      },
      messageID
    );

  } catch (e) {

    console.log(
      "[AKINATOR ERROR]",
      e
    );

    return api.sendMessage(
      `⌬ ━━ HINA GAMES ━━ ⌬

❌ المارد دايخ شوية.. أعد المحاولة.

السبب: ${e.message}`,
      threadID,
      messageID
    );
  }
};

module.exports.handleReply =
async function ({
  api,
  event,
  handleReply
}) {

  const {
    threadID,
    messageID
  } = event;

  if (
    String(event.senderID) !==
    String(handleReply.author)
  ) {
    return;
  }

  const input =
    String(event.body || "")
      .trim()
      .replace(/\s+/g, " ");

  let answer;

  switch (input) {

    case "نعم":
      answer = "0";
      break;

    case "لا":
      answer = "1";
      break;

    case "لا اعلم":
    case "لا أعلم":
      answer = "2";
      break;

    case "من الممكن":
      answer = "3";
      break;

    case "الضاهر لا":
    case "الظاهر لا":
      answer = "4";
      break;

    case "رجوع":
      answer = "e";
      break;

    default:

      return api.sendMessage(
        `⌬ ━━ HINA GAMES ━━ ⌬

⚠️ الرد يكون:

نعم | لا | لا اعلم | من الممكن | الظاهر لا | رجوع`,
        threadID,
        messageID
      );
  }

  try {

    let result;

    if (answer === "e") {

      result =
        await BackGame(
          handleReply.si,
          handleReply.co,
          handleReply.progression,
          handleReply.step,
          handleReply.cookie
        );

    } else {

      result =
        await NextGame(
          handleReply.si,
          handleReply.co,
          answer,
          handleReply.progression,
          handleReply.step,
          handleReply.cookie
        );
    }

    if (
      result &&
      result.name_proposition
    ) {

      const cacheDir =
        path.join(
          __dirname,
          "cache"
        );

      await fs.ensureDir(
        cacheDir
      );

      const imgPath =
        path.join(
          cacheDir,
          `aki_${Date.now()}.jpg`
        );

      let hasImage = false;

      if (result.photo) {

        try {

          const imgRes =
            await axios.get(
              result.photo,
              {
                responseType:
                  "arraybuffer",
                timeout: 15000
              }
            );

          await fs.writeFile(
            imgPath,
            Buffer.from(
              imgRes.data
            )
          );

          hasImage =
            await fs.pathExists(
              imgPath
            );

        } catch (imageError) {

          console.log(
            "[AKINATOR IMAGE ERROR]",
            imageError.message
          );
        }
      }

      const msg =
        `⌬ ━━ HINA GAMES ━━ ⌬

🪄| إســـم الشـخصـية:
❨${result.name_proposition}❩

⌯↢ نبــــذة عنها:
${result.description_proposition || "لا توجد نبذة متاحة"}

اكتب اكيناتور للعب مرة اخرى`;

      if (hasImage) {

        return api.sendMessage(
          {
            body: msg,
            attachment:
              fs.createReadStream(
                imgPath
              )
          },
          threadID,
          () => {
            fs.remove(
              imgPath
            ).catch(() => {});
          },
          messageID
        );
      }

      return api.sendMessage(
        msg,
        threadID,
        messageID
      );
    }

    if (
      !result ||
      !result.question
    ) {

      throw new Error(
        "لم يتم الحصول على السؤال التالي من Akinator"
      );
    }

    return api.sendMessage(
      `⌬ ━━ HINA GAMES ━━ ⌬

${result.question} 🚶

الرجاء الرد ب:
نعم | لا | لا اعلم | من الممكن | الظاهر لا | رجوع`,
      threadID,
      (err, info) => {

        if (err || !info) {
          return;
        }

        if (
          !global.client.handleReply
        ) {
          global.client.handleReply = [];
        }

        global.client.handleReply.push({
          name:
            module.exports.config.name,
          messageID:
            info.messageID,
          author:
            String(event.senderID),
          progression:
            result.progression,
          si:
            handleReply.si,
          co:
            handleReply.co,
          step:
            result.step,
          cookie:
            handleReply.cookie
        });
      },
      messageID
    );

  } catch (e) {

    console.log(
      "[AKINATOR REPLY ERROR]",
      e
    );

    return api.sendMessage(
      `⌬ ━━ HINA GAMES ━━ ⌬

❌ المارد دايخ شوية.. أعد المحاولة.

${e.message}`,
      threadID,
      messageID
    );
  }
};