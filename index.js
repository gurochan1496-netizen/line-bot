import express from "express";
import axios from "axios";
import line from "@line/bot-sdk";

const app = express();
app.use(express.json());

const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

app.post("/webhook", async (req, res) => {
  const events = req.body.events;

  await Promise.all(
    events.map(async (event) => {
      if (event.type !== "message" || event.message.type !== "text") return;

      // ① まず「考え中…」とすぐに返信（1秒以内）
      await client.replyMessage(event.replyToken, {
        type: "text",
        text: "考え中…ちょっと待ってね！",
      });

      // ② そのあと OpenAI に問い合わせる
      const userMessage = event.message.text;

      const aiResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: userMessage }],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );

      const replyText = aiResponse.data.choices[0].message.content;

      // ③ pushMessage で本当の返事を送る
      await client.pushMessage(event.source.userId, {
        type: "text",
        text: replyText,
      });
    })
  );

  res.status(200).end();
});


app.listen(3000, () => console.log("Server running"));
