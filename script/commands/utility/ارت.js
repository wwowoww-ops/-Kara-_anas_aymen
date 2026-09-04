// ╔══════════════════════════════════════════════════════════════════╗
// ║   🎨  أمر "ارت" — تحويل الصور إلى ستايلات أنمي v2.0           ║
// ║   مبني على AIMirror API                                         ║
// ║   المتطلبات (موجودة في معظم البوتات):                           ║
// ║     npm install form-data image-size axios fs-extra              ║
// ╚══════════════════════════════════════════════════════════════════╝

const FormData  = require("form-data");
const crypto    = require("crypto");
const axios     = require("axios");
const fs        = require("fs-extra");
const path      = require("path");

// image-size: اختياري — يُستخدم للحصول على أبعاد الصورة
let imageSize;
try { ({ imageSize } = require("image-size")); }
catch { imageSize = null; }

const CACHE_DIR = path.join(__dirname, "cache");

// ══════════════════════════════════════════════════════════════
module.exports = {
  config: {
    name:            "آرت",
    aliases:         ["art", "انمي", "تحويل"],
    version:         "2.0.0",
    hasPermssion:    0,
    credits:         "سينكو",
    description:     "تحويل صورك إلى ستايلات أنمي مذهلة 🎨",
    commandCategory: "ai",
    usages:          "[رقم] رد على صورة | موديلات | بحث [كلمة] | احصائيات",
    cooldowns:       8,
  },

  // ══════════════════════════════════════════════════════════
  //  run — نقطة الدخول الرئيسية
  // ══════════════════════════════════════════════════════════
  async run({ api, event, args }) {
    const { senderID, messageReply, threadID, messageID } = event;
    const cmd = (args[0] || "").toLowerCase();

    await fs.ensureDir(CACHE_DIR);

    // ── بدون أوامر: رسالة التعليمات ──
    if (!cmd) {
      return api.sendMessage(
        `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
        `✾ ┇\n` +
        `✾ ┇ ⏣ ⟬ أوامـر الـتـحـويـل ⟭\n` +
        `✾ ┇ ◍ ارت [رقم]: رد على صورة\n` +
        `✾ ┇ ◍ ارت موديلات: عرض الستايلات\n` +
        `✾ ┇ ◍ ارت بحث [كلمة]: البحث عن ستايل\n` +
        `✾ ┇ ◍ ارت احصائيات: حالة النظام\n` +
        `✾ ┇ ⸻⸻⸻⸻⸻\n` +
        `✾ ┇ ◍ مـثـال: ارت 29 (رد على صورة)\n` +
        `✾ ┇\n` +
        `⏣────── ✾ ⌬ ✾ ──────⏣`,
        threadID, messageID
      );
    }

    // ── الإحصائيات ──
    if (cmd === "احصائيات" || cmd === "stats") {
      const models = await fetchModels();
      return api.sendMessage(
        `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
        `✾ ┇\n` +
        `✾ ┇ ⏣ ⟬ إحـصـائـيـات الـنـظـام ⟭\n` +
        `✾ ┇ ◍ الـسـتـايـلات المتاحة: ${models.length}\n` +
        `✾ ┇ ◍ الـحـالـة: مـتـصـل ✅\n` +
        `✾ ┇ ⸻⸻⸻⸻⸻\n` +
        `✾ ┇ ◍ اكـتب "ارت موديلات" للعرض\n` +
        `✾ ┇\n` +
        `⏣────── ✾ ⌬ ✾ ──────⏣`,
        threadID, messageID
      );
    }

    // ── عرض قائمة الموديلات ──
    if (["موديلات", "models", "list", "قائمة"].includes(cmd)) {
      const page   = parseInt(args[1]) || 1;
      const models = await fetchModels();
      if (models.length === 0)
        return api.sendMessage("❌ فشل تحميل القائمة، حاول لاحقاً.", threadID, messageID);
      return sendModelPage(models, page, api, threadID, messageID, senderID, "⏣ ⟬ قـائـمـة الـسـتـايـلات ⟭");
    }

    // ── البحث ──
    if (["بحث", "search"].includes(cmd)) {
      const q = args.slice(1).join(" ").trim();
      if (!q)
        return api.sendMessage("🔍 اكتب كلمة بعد الأمر. مثال: ارت بحث anime", threadID, messageID);
      const models = await fetchModels(q);
      if (models.length === 0)
        return api.sendMessage(`😢 لم يتم العثور على نتائج لـ "${q}"`, threadID, messageID);
      return sendModelPage(models, 1, api, threadID, messageID, senderID, `⏣ ⟬ نـتـائـج: ${q} ⟭`);
    }

    // ── تحويل الصورة ──
    const photo = messageReply?.attachments?.find(a => a.type === "photo");
    if (!photo) {
      return api.sendMessage(
        `📸 | يرجى الرد على صورة!\n` +
        `مثال: ارت 29 (مع الرد على صورة)`,
        threadID, messageID
      );
    }

    // رقم الستايل
    let styleNum = 29;
    if (args[0] && !isNaN(args[0])) styleNum = parseInt(args[0]);

    const models = await fetchModels();
    if (models.length === 0)
      return api.sendMessage("❌ فشل تحميل الموديلات، حاول لاحقاً.", threadID, messageID);

    if (styleNum < 0 || styleNum >= models.length) {
      return api.sendMessage(
        `❌ | الرقم غير صالح!\n` +
        `اختر بين 0 و ${models.length - 1}\n` +
        `اكتب "ارت موديلات" لرؤية القائمة.`,
        threadID, messageID
      );
    }

    const selected = models[styleNum];

    // رسالة الانتظار
    api.sendMessage(
      `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
      `✾ ┇\n` +
      `✾ ┇ ⏣ ⟬ جـاري الـتـحـويـل ⟭\n` +
      `✾ ┇ ◍ الـسـتـايـل: ${selected.name}\n` +
      `✾ ┇ ◍ الـحـالـة: مـعـالـجـة... ⏳\n` +
      `✾ ┇ ◍ الـوقـت المتوقع: 10-20 ثانية\n` +
      `✾ ┇\n` +
      `⏣────── ✾ ⌬ ✾ ──────⏣`,
      threadID, messageID
    );

    const imgPath = path.join(CACHE_DIR, `art_${Date.now()}_${senderID}.png`);

    try {
      // تحميل الصورة الأصلية
      const imgRes = await axios.get(photo.url, { responseType: "arraybuffer", timeout: 30000 });
      await fs.writeFile(imgPath, Buffer.from(imgRes.data));

      // معالجة الصورة
      const resultUrl = await processImage(imgPath, selected.id);

      // تحميل الصورة الناتجة
      const resultRes = await axios.get(resultUrl, { responseType: "arraybuffer", timeout: 30000 });
      const outPath   = path.join(CACHE_DIR, `art_out_${Date.now()}.png`);
      await fs.writeFile(outPath, Buffer.from(resultRes.data));

      // إرسال النتيجة
      api.sendMessage(
        {
          body:
            `⏣────── ✾ ⌬ ✾ ──────⏣\n` +
            `✾ ┇ ✅ تـم الـتـحـويـل بـنـجـاح!\n` +
            `✾ ┇ ◍ الـسـتـايـل: ${selected.name}\n` +
            `✾ ┇ ◍ الـرقـم: ${styleNum}\n` +
            `⏣────── ✾ ⌬ ✾ ──────⏣`,
          attachment: fs.createReadStream(outPath),
        },
        threadID,
        () => {
          fs.remove(imgPath).catch(() => {});
          fs.remove(outPath).catch(() => {});
        },
        messageID
      );

    } catch (err) {
      fs.remove(imgPath).catch(() => {});
      console.error("[ارت]", err.message);
      return api.sendMessage(
        `❌ | فشل التحويل!\n` +
        `السبب: ${err.message}\n` +
        `جرب ستايلاً مختلفاً أو صورة أوضح.`,
        threadID, messageID
      );
    }
  },

  // ══════════════════════════════════════════════════════════
  //  handleReply — التنقل بين صفحات الموديلات
  // ══════════════════════════════════════════════════════════
  async handleReply({ api, event, handleReply: hr }) {
    const { threadID, messageID, senderID } = event;

    // فقط صاحب الطلب
    if (String(senderID) !== String(hr.author)) return;

    const page = parseInt((event.body || "").trim());
    if (isNaN(page) || page < 1) {
      return api.sendMessage("⚠️ | أرسل رقم الصفحة فقط.", threadID, messageID);
    }

    return sendModelPage(
      hr.models, page, api, threadID, messageID, senderID, hr.title
    );
  },
};

// ══════════════════════════════════════════════════════════════
//  sendModelPage — عرض صفحة من قائمة الموديلات
// ══════════════════════════════════════════════════════════════
function sendModelPage(models, page, api, threadID, messageID, author, title) {
  const PAGE_SIZE  = 20;
  const totalPages = Math.ceil(models.length / PAGE_SIZE);
  page = Math.max(1, Math.min(page, totalPages));

  const slice = models.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  let msg = `⏣────── ✾ ⌬ ✾ ──────⏣\n`;
  msg    += `✾ ┇ ${title}\n`;
  msg    += `✾ ┇ الـصـفـحـة: ${page} مـن ${totalPages}\n✾ ┇\n`;
  for (const m of slice) msg += `✾ ┇ ◍ ${m.originalIndex} - ${m.name}\n`;
  msg    += `✾ ┇\n✾ ┇ ◍ رد بـرقـم الـصـفـحـة للتنقل\n`;
  msg    += `⏣────── ✾ ⌬ ✾ ──────⏣`;

  api.sendMessage(msg, threadID, (err, info) => {
    if (err || !info) return;
    if (!global.client.handleReply) global.client.handleReply = [];
    global.client.handleReply.push({
      name:      "ارت",        // ✅ يطابق config.name
      messageID: info.messageID,
      author:    String(author),
      models,
      title,
      createdAt: Date.now(),
    });
  }, messageID);
}

// ══════════════════════════════════════════════════════════════
//  fetchModels — جلب قائمة الستايلات من AIMirror
// ══════════════════════════════════════════════════════════════
async function fetchModels(searchQuery = "") {
  try {
    const uid = genUID();
    const res = await axios.get(
      `https://be.aimirror.fun/filter_search?uid=${uid}`,
      {
        headers: {
          "User-Agent": "AIMirror/6.2.4+168 (android)",
          "uid":        uid,
        },
        timeout: 15000,
      }
    );

    let models = (res.data?.search_info || [])
      .filter(i => !i.key_words?.includes("video"))
      .map((i, index) => ({
        id:            i.model_id,
        name:          i.model,
        key_words:     i.key_words || [],
        originalIndex: index,
      }));

    // إزالة المكررات بالـ id
    models = [...new Map(models.map(m => [m.id, m])).values()];

    // تطبيق البحث
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      models = models.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.key_words.some(k => k.toLowerCase().includes(q))
      );
    }

    // إعادة ترقيم الـ originalIndex بعد الفلترة
    return models.map((m, i) => ({ ...m, originalIndex: i }));

  } catch (e) {
    console.error("[ارت/fetchModels]", e.message);
    return [];
  }
}

// ══════════════════════════════════════════════════════════════
//  processImage — معالجة الصورة وإرجاع رابط النتيجة
// ══════════════════════════════════════════════════════════════
async function processImage(imagePath, modelId) {
  const uid   = genUID();
  const hash  = crypto.randomBytes(20).toString("hex");

  // 1. الحصول على token الرفع
  const tokenRes = await axios.get(
    `https://be.aimirror.fun/app_token/v2?cropped_image_hash=${hash}.jpeg&uid=${uid}`,
    {
      headers: {
        "User-Agent": "AIMirror/6.2.4+168 (android)",
        "uid":        uid,
      },
      timeout: 15000,
    }
  );
  const token = tokenRes.data;

  // 2. رفع الصورة إلى OSS
  const form = new FormData();
  Object.keys(token).forEach(key => form.append(key, String(token[key])));
  form.append("file", fs.createReadStream(imagePath));

  await axios.post(
    "https://aimirror-images-sg.oss-ap-southeast-1.aliyuncs.com",
    form,
    { headers: form.getHeaders(), timeout: 30000 }
  );

  // 3. الحصول على أبعاد الصورة
  let width = 512, height = 512;
  try {
    if (imageSize) {
      const buf    = fs.readFileSync(imagePath);
      const dims   = imageSize(buf);
      width  = dims.width  || 512;
      height = dims.height || 512;
    }
  } catch {}

  // 4. إرسال طلب التحويل
  const taskRes = await axios.post(
    `https://be.aimirror.fun/draw?uid=${uid}`,
    {
      model_id:           parseInt(modelId),
      cropped_image_key:  token.key,
      cropped_height:     height,
      cropped_width:      width,
      package_name:       "com.ai.polyverse.mirror",
      version:            "6.2.4",
      force_default_pose: true,
      is_free_trial:      true,
      free_size:          true,
    },
    {
      headers: {
        "User-Agent": "AIMirror/6.2.4+168 (android)",
        "uid":        uid,
      },
      timeout: 20000,
    }
  );
  const { draw_request_id } = taskRes.data;

  // 5. الانتظار حتى اكتمال المعالجة (max 60 ثانية)
  const MAX_ATTEMPTS = 30;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await sleep(2000);
    const pollRes = await axios.get(
      `https://be.aimirror.fun/draw/process?draw_request_id=${draw_request_id}&uid=${uid}`,
      {
        headers: {
          "User-Agent": "AIMirror/6.2.4+168 (android)",
          "uid":        uid,
        },
        timeout: 15000,
      }
    );
    const status = pollRes.data;

    if (status.draw_status === "SUCCEED") {
      const url = status.generated_image_addresses?.[0];
      if (!url) throw new Error("لم يُعثر على رابط الصورة الناتجة");
      return url;
    }
    if (status.draw_status === "FAILED") {
      throw new Error("فشل معالجة الصورة من الخادم");
    }
    // PENDING أو IN_PROGRESS → نكمل الانتظار
  }
  throw new Error("انتهت مهلة الانتظار (60 ثانية)");
}

// ══════════════════════════════════════════════════════════════
//  مساعدات
// ══════════════════════════════════════════════════════════════
function genUID() {
  const prefix = "fe20871";
  let r = "";
  for (let i = 0; i < 9; i++) r += "0123456789abcdef"[Math.floor(Math.random() * 16)];
  return prefix + r;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}