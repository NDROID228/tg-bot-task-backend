require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TG_BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });
const webAppUrl = "https://telegrambot228.netlify.app/";

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "/start") {
    console.log("bot message: /start");
    await bot.sendMessage(
      chatId,
      "Привіт! Я - чат-бот, який використовує OpenAI API для опису картинок.\nНатискай кнопку нижче, щоб перейти до застосунку:",
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Перейти до застосунку", web_app: { url: webAppUrl } }],
          ],
        },
      }
    );
  }
  if (msg.web_app_data?.data) {
    try {
      const data = JSON.parse(msg.web_app_data?.data);

      console.log(data);
      // bot.sendMessage(chatId, data)
    } catch (e) {
      console.log(e);
    }
  }
});

const analyzeImage = require("./utils/analyzeImage");
const express = require("express");
const app = express();
const port = 5000;

app.use(express.json());
app.use(require("cors")());

// Check file type
function checkFileType(mimetype, extname) {
  // Allowed ext
  console.log("mimetype:", mimetype, "extname:", extname);
  console.log(filetypes.test(mimetype), filetypes.test(extname));
  const filetypes = /jpeg|jpg|png/;
  return filetypes.test(mimetype) && filetypes.test(extname);
}

app.get("/", (req, res) => {
  console.log(req.url);
  res.send("this is an api for tg-bot");
});

// Route for file upload
app.post("/upload", (req, res) => {
  const boundary = req.headers["content-type"].split("boundary=")[1];

  let body = "";
  req.on("data", (data) => {
    body += data;
  });

  req.on("end", async () => {
    const parts = body.split(`--${boundary}`);
    let imageBuffer = null;
    let mimetype = null;
    let extname = null;

    parts.forEach((part) => {
      if (part.includes('Content-Disposition: form-data; name="image"')) {
        const headers = part
          .split("\r\n")
          .filter(
            (line) =>
              line.includes("Content-Disposition") ||
              line.includes("Content-Type")
          );
        const contentTypeHeader = headers.find((header) =>
          header.includes("Content-Type")
        );
        if (contentTypeHeader) {
          mimetype = contentTypeHeader.split(": ")[1];
          extname = mimetype.split("/")[1];
        }

        const start = part.indexOf("\r\n\r\n") + 4;
        const end = part.lastIndexOf("\r\n");

        if (start !== -1 && end !== -1) {
          const imageData = part.substring(start, end);
          imageBuffer = Buffer.from(imageData, "binary");
        }
      }
    });

    if (!imageBuffer || !checkFileType(mimetype, extname)) {
      console.log("imageBuffer:", imageBuffer);
      console.log("checkFileType(mimetype, extname):", checkFileType(mimetype, extname));
      return res
        .status(400)
        .send({ message: "Error: Images Only!", ok: false });
    }

    try {
      console.log(imageBuffer);
      const description = await analyzeImage(imageBuffer);
      if (description !== undefined) {
        res.send({ message: description, ok: true });
      } else {
        res.send({
          message: `Щось пішло не так... Спробуйте ще.`,
          ok: false,
        });
      }
    } catch (error) {
      res.status(500).send({
        message: "Під час обробки картинки виникла помилка...",
        ok: false,
      });
    }
  });
});

app.listen(port, () => console.log(`Server started on port ${port}`));
