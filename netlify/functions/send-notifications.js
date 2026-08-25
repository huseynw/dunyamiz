const fetch = require("node-fetch");

// ========== ENV ==========
const GH_TOKEN = process.env.GH_TOKEN;
const REPO_OWNER = "huseynw";
const REPO_NAME = "dunyamiz";
const LOG_PATH = "notifications-log.json";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ONE_SIGNAL_APP_ID = process.env.ONE_SIGNAL_APP_ID;
const ONE_SIGNAL_API_KEY = process.env.ONE_SIGNAL_API_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

// ========== SUBSCRIPTION ID-LƏR (admin-proxy ilə eyni) ==========
const SUBSCRIPTION_IDS = [
  "5f14228d-24e3-4bd8-b219-1a317bce7a88",
  "32643469-8969-44f7-8ec7-222f2913ca44",
  "ad9633d9-6213-4618-96a6-258dc59ead61",
  "cd25bdd9-6622-463c-84d5-5974bdcb8a25",
];

const REMINDER_HOURS = [3, 2, 1];
const START_DATE = "2025-08-03T00:00:00Z";

// ========== GITHUB LOG YARDIMÇILARI ==========
async function getGitHubFile(path, retries = 3) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      headers: {
        Authorization: `token ${GH_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    if (res.status === 404) return null;
    if (res.ok) {
      const data = await res.json();
      const content = Buffer.from(data.content, "base64").toString("utf8");
      return { sha: data.sha, data: JSON.parse(content) };
    }
    // 502/503 kimi keçici xətalarda yenidən cəhd et
    if ((res.status === 502 || res.status === 503) && attempt < retries) {
      console.warn(`GitHub ${res.status} xətası, ${attempt}. cəhd. Yenidən sınayır...`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
      continue;
    }
    throw new Error(`GitHub oxuma xətası: ${res.status}`);
  }
}

async function saveGitHubFile(path, content, sha) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  const body = {
    message: `Update ${path}`,
    content: Buffer.from(JSON.stringify(content, null, 2)).toString("base64"),
    ...(sha ? { sha } : {}),
  };
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${GH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub yazma xətası: ${res.status} - ${err}`);
  }
  return res.json();
}

async function readLog() {
  // Xəta olduqda boş data qaytarma - bu dublikat göndərişə səbəb olur!
  // Əvəzinə xətanı yuxarı ötür ki, handler dayansın.
  const file = await getGitHubFile(LOG_PATH);
  return file
    ? { data: file.data, sha: file.sha }
    : { data: { reminders: {}, daily_love: {}, anniversary_countdown: {} }, sha: null };
}

async function markReminderSent(hours) {
  const { data, sha } = await readLog();
  data.reminders[hours] = Date.now();
  return saveGitHubFile(LOG_PATH, data, sha);
}

async function markDailyLoveSent() {
  const { data, sha } = await readLog();
  data.daily_love.lastSent = Date.now();
  return saveGitHubFile(LOG_PATH, data, sha);
}

async function markAnniversaryCountdownSent() {
  const { data, sha } = await readLog();
  data.anniversary_countdown = data.anniversary_countdown || {};
  data.anniversary_countdown.lastSent = Date.now();
  return saveGitHubFile(LOG_PATH, data, sha);
}

// ========== ONESIGNAL (Subscription ID-lərə göndər) ==========
async function sendOneSignalNotification(title, message) {
  if (!ONE_SIGNAL_APP_ID || !ONE_SIGNAL_API_KEY) {
    console.error("OneSignal mühit dəyişənləri yoxdur");
    return false;
  }
  if (!SUBSCRIPTION_IDS.length) {
    console.error("Subscription ID-lər boşdur");
    return false;
  }

  try {
    const payload = {
      app_id: ONE_SIGNAL_APP_ID,
      headings: { en: title },
      contents: { en: message },
      include_subscription_ids: SUBSCRIPTION_IDS,
    };
    const res = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ONE_SIGNAL_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    console.log("OneSignal cavabı:", JSON.stringify(data, null, 2));
    return res.ok;
  } catch (e) {
    console.error("OneSignal xətası:", e);
    return false;
  }
}

// ========== ƏSAS FUNKSİYA ==========
exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    if (body.secret !== CRON_SECRET) {
      return { statusCode: 403, body: "Unauthorized" };
    }

    const now = new Date();
    const todayStartUTC = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const results = { reminders: false, daily: false, anniversary_countdown: false };

    // ---- Supabase-dən görüş tarixini al (uğursuz olsa yalnız xatırlatma atlanır) ----
    let meetingDate = null;
    try {
      const supabaseRes = await fetch(
        `${SUPABASE_URL}/rest/v1/site_settings?id=eq.1&select=next_meeting_date`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        },
      );
      const settings = await supabaseRes.json();
      if (supabaseRes.ok && Array.isArray(settings) && settings[0]?.next_meeting_date) {
        meetingDate = new Date(settings[0].next_meeting_date);
      } else {
        console.error(`Supabase-dən görüş tarixi alına bilmədi (status: ${supabaseRes.status})`);
      }
    } catch (e) {
      console.error("Supabase xətası — xatırlatma bloku atlanır:", e.message);
    }

    // ---- Görüş xatırlatmaları ----
    if (meetingDate && !isNaN(meetingDate.getTime())) {
      try {
        const hoursUntil = Math.floor((meetingDate - now) / (60 * 60 * 1000));
        console.log(`Görüşə qalan saat (UTC): ${hoursUntil}`);

        if (hoursUntil > 0 && REMINDER_HOURS.includes(hoursUntil)) {
          const { data: logData } = await readLog();
          const lastSent = logData.reminders[hoursUntil] || 0;
          const canSend = Date.now() - lastSent > 24 * 60 * 60 * 1000;
          if (canSend) {
            // Qalan tam vaxtı hesabla (saat, dəqiqə, saniyə)
            const diffMs = meetingDate - now;
            const h = Math.floor(diffMs / 3600000);
            const m = Math.floor((diffMs % 3600000) / 60000);
            const s = Math.floor((diffMs % 60000) / 1000);

            const reminderTitle = `💖 Görüşümüzə az qaldı!`;
            const reminderMsg = `Görüşümüzə ${h} saat ${m} dəqiqə ${s} saniyə qaldı!\nSəni görmək üçün saniyələr sayılır, Cəmaləm ❤️`;
            const success = await sendOneSignalNotification(
              reminderTitle,
              reminderMsg,
            );
            if (success) {
              await markReminderSent(hoursUntil);
              results.reminders = true;
            } else {
              console.error("Xatırlatma göndərilmədi");
            }
          } else {
            console.log(`Xatırlatma artıq göndərilib: ${hoursUntil}h`);
          }
        }
      } catch (e) {
        console.error("Xatırlatma bloku xətası:", e.message);
      }
    }

    // ---- Günlük sevgi mesajı (adi günlər AZT 13:00, il dönümü günü AZT 00:25) ----
    try {
      const startDate = new Date(START_DATE);
      const daysTogether = Math.floor((now - startDate) / (24 * 60 * 60 * 1000));
      const { data: logDataDaily } = await readLog();
      const lastDaily = logDataDaily.daily_love?.lastSent || 0;
      const lastDate = new Date(lastDaily);

      const bakuNow = new Date(now.getTime() + 4 * 60 * 60 * 1000); // AZT = UTC+4
      const isAnniversary = bakuNow.getUTCMonth() === 7 && bakuNow.getUTCDate() === 3;
      const bakuMinuteOfDay = bakuNow.getUTCHours() * 60 + bakuNow.getUTCMinutes();

      // İl dönümü günü AZT 00:25-dən, digər günlər AZT 13:00-dan etibarən göndər.
      const reachedSendTime = isAnniversary
        ? bakuMinuteOfDay >= 25
        : bakuMinuteOfDay >= 13 * 60;

      // "Bu gün göndərilibmi" yoxlaması AZT tarixinə görə aparılır.
      const lastBaku = new Date(lastDate.getTime() + 4 * 60 * 60 * 1000);
      const sentTodayAZT =
        lastBaku.getUTCFullYear() === bakuNow.getUTCFullYear() &&
        lastBaku.getUTCMonth() === bakuNow.getUTCMonth() &&
        lastBaku.getUTCDate() === bakuNow.getUTCDate();

      if (!sentTodayAZT && reachedSendTime) {
        let title, msg;
        if (isAnniversary) {
          const years =
            bakuNow.getUTCFullYear() -
            startDate.getUTCFullYear() -
            (bakuNow.getUTCMonth() < startDate.getUTCMonth() ||
            (bakuNow.getUTCMonth() === startDate.getUTCMonth() &&
              bakuNow.getUTCDate() < startDate.getUTCDate())
              ? 1
              : 0);
          title = `🎉 İl dönümümüz mübarək!`;
          msg = `${years} il əvvəl bu gün yolumuza birlikdə başladıq və o gündən hər səhərim səninlə mənalanır. ${years} il keçdi, amma ürəyim hələ də sənə ilk günki kimi atır. Bütün il dönümlərimizi, bütün ömrü səninlə keçirməyi arzulayıram. İl dönümümüz mübarək, Hərşeyim, səni sonsuza qədər sevirəm 🤍`;
        } else {
          title = `✨ ${daysTogether}. günümüz!`;
          msg = `Birlikdə olduğumuz ${daysTogether}. gün. Səni hər gün daha çox sevirəm, Cəmaləm 🤍`;
        }

        const success = await sendOneSignalNotification(title, msg);
        if (success) {
          await markDailyLoveSent();
          results.daily = true;
        } else {
          console.error("Günlük mesaj göndərilmədi");
        }
      } else {
        if (sentTodayAZT) {
          console.log("Günlük mesaj artıq göndərilib.");
        } else {
          console.log(
            `Gündəlik mesaj üçün hələ tezdir (Hazırkı AZT: ${bakuNow.getUTCHours()}:${String(bakuNow.getUTCMinutes()).padStart(2, "0")})`,
          );
        }
      }
    } catch (e) {
      console.error("Günlük mesaj bloku xətası:", e.message);
    }

    // ---- İl dönümünə geri sayım bildirişi (son 7 gün) ----
    try {
      const bakuNowC = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      const annivThisYearC = new Date(Date.UTC(bakuNowC.getUTCFullYear(), 7, 3));
      const annivEndThisYearC = new Date(Date.UTC(bakuNowC.getUTCFullYear(), 7, 4));
      let nextAnnivC = annivThisYearC;
      if (bakuNowC.getTime() >= annivEndThisYearC.getTime()) {
        nextAnnivC = new Date(Date.UTC(bakuNowC.getUTCFullYear() + 1, 7, 3));
      }
      const daysUntilC = Math.ceil((nextAnnivC - bakuNowC) / (24 * 60 * 60 * 1000));

      if (daysUntilC >= 1 && daysUntilC <= 7) {
        const { data: logDataC } = await readLog();
        const lastC = logDataC.anniversary_countdown?.lastSent || 0;
        const lastCDate = new Date(lastC);
        if (lastCDate < todayStartUTC) {
          const cdTitle =
            daysUntilC === 1
              ? `🎉 Sabah il dönümümüzdür!`
              : `🎉 İl dönümümüzə ${daysUntilC} gün qaldı!`;
          const cdMsg =
            daysUntilC === 1
              ? `Sabah bizim üçün ən xüsusi gündür! Gözlədiyim gün gəldi çatdı`
              : `İl dönümümüzə ${daysUntilC} gün qaldı! O günü səbrsizliklə gözləyirəm, Hərşeyim🤍`;
          const successC = await sendOneSignalNotification(cdTitle, cdMsg);
          if (successC) {
            await markAnniversaryCountdownSent();
            results.anniversary_countdown = true;
          } else {
            console.error("İl dönümü sayacı bildirişi göndərilmədi");
          }
        }
      }
    } catch (e) {
      console.error("İl dönümü sayacı bloku xətası:", e.message);
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, results }) };
  } catch (err) {
    console.error("Funksiya xətası:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
