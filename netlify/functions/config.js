exports.handler = async () => {
  const bot = process.env.TOKEN;
  const silgi = process.env.ID;

  return {
    statusCode: 200,
    body: JSON.stringify({
      mesaj: "ok"
    })
  };
};
