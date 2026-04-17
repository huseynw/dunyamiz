exports.handler = async (event) => {
  try {
    const { text } = JSON.parse(event.body || "{}");

    const bot = process.env.TOKEN;
    const silgi = process.env.ID;

    const tgRes = await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: silgi,
        text
      })
    });

    const tgData = await tgRes.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, tgData })
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: e.message })
    };
  }
};
