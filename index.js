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
      bot.sendMessage(chatId, data);
    } catch (e) {
      console.log(e);
    }
  }
});

const analyzeImage = require("./utils/analyzeImage");
const fs = require("fs");
const express = require("express");
const formidable = require("express-formidable");
const app = express();
const port = 5000;

app.use(express.json());
app.use(formidable());
app.use(require("cors")());

// Check file type
function checkFileType(mimetype, extname) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png/;
  console.log("mimetype:", mimetype, "extname:", extname);
  console.log(filetypes.test(mimetype), filetypes.test(extname));
  return filetypes.test(mimetype) && filetypes.test(extname);
}

app.get("/", (req, res) => {
  console.log(req.url);
  res.send("this is an api for tg-bot");
});

// Route for file upload
app.post("/upload", async (req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    console.log(body);
    try {
      if (!body) {
        return res.status(400).send({
          message:
            "Файл не надано.",
          ok: false,
        });
      }

      const description = await analyzeImage(body);
      if (description !== undefined) {
        res.send({ message: description, ok: true });
      } else {
        res.send({
          message: `Щось пішло не так... Спробуйте ще.`,
          ok: false,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({
        message: "Під час обробки картинки виникла помилка...",
        ok: false,
      });
    }
  });
  // try {
  //   console.log(imageBuffer);
  //   const description = await analyzeImage(fileType, imageBuffer);
  //   if (description !== undefined) {
  //     res.send({ message: description, ok: true });
  //   } else {
  //     res.send({
  //       message: `Щось пішло не так... Спробуйте ще.`,
  //       ok: false,
  //     });
  //   }
  // } catch (error) {
  //   res.status(500).send({
  //     message: "Під час обробки картинки виникла помилка...",
  //     ok: false,
  //   });
  // }
});

app.listen(port, () => console.log(`Server started on port ${port}`));
