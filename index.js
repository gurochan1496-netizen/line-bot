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

      return client.replyMessage(event.replyToken, {
        type: "text",
        text: replyText,
      });
    })
  );

  res.status(200).end();
});

app.listen(3000, () => console.log("Server running"));
