const rateLimitMap = new Map();
function checkRateLimit(ip, maxRequests = 30, windowMs = 60000) {
  const now = Date.now();
  const key = `${ip}`;
  const entry = rateLimitMap.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    rateLimitMap.set(key, { windowStart: now, count: 1 });
    return { allowed: true };
  }
  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((windowMs - (now - entry.windowStart)) / 1000) };
  }
  return { allowed: true };
}

exports.handler = async (event) => {
  try {
    const clientIp = event.headers['client-ip'] || event.headers['x-forwarded-for']?.split(',')[0]?.trim() || event.headers['x-nf-client-connection-ip'] || 'unknown';
    const rateLimit = checkRateLimit(clientIp, 30, 60000);
    if (!rateLimit.allowed) {
      return {
        statusCode: 429,
        headers: { "Content-Type": "application/json", "Retry-After": String(rateLimit.retryAfter) },
        body: JSON.stringify({ success: false, error: "Çox sayda sorğu.", retryAfter: rateLimit.retryAfter })
      };
    }

    const { text, action, message_id } = JSON.parse(event.body || "{}");
    const temizMetn = String(text || "").trim();

    if (!temizMetn) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "Mesaj mətni boşdur"
        })
      };
    }

    const bot = process.env.TOKEN;
    const silgi = process.env.ID;

    // Edit mövcud mesajı
    if (action === "edit" && message_id) {
      const tgRes = await fetch(`https://api.telegram.org/bot${bot}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: silgi,
          message_id: message_id,
          text: temizMetn
        })
      });

      const tgData = await tgRes.json();

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: tgData.ok,
          message_id: tgData.result?.message_id || message_id,
          tgData
        })
      };
    }

    // Yeni mesaj göndər (default)
    const tgRes = await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: silgi,
        text: temizMetn
      })
    });

    const tgData = await tgRes.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: tgData.ok,
        message_id: tgData.result?.message_id || null,
        tgData
      })
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: e.message
      })
    };
  }
};
