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
          keyboard_button: [
            [{ text: "Перейти до застосунку", web_app: { url: webAppUrl } }],
          ],
        },
      }
    );
  }
  if (msg?.web_app_data?.data) {
    try {
      console.log("unparsed description from bot:", msg.web_app_data.data);
      const data = JSON.parse(msg.web_app_data.data);
      console.log("description from bot:", data);
      await bot.sendMessage(chatId, data);
    } catch (e) {
      console.log(e);
    }
  }
});

const analyzeImage = require("./utils/analyzeImage");
const express = require("express");
const formidable = require("express-formidable");
const bodyParser = require("body-parser");
const FileReader = require("filereader");
const multer = require("multer");
const upload = multer();
const app = express();
const port = 5000;

app.use(express.json());
app.use(formidable());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
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
app.post(
  "/upload",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "queryId", maxCount: 1 },
  ]),
  async (req, res) => {
    console.log(req.files);
    const { queryId } = req.body;
    console.log("queryId:", queryId, "req.body:", req.body);
    try {
      if (!req.files || !req.files.image) {
        console.log(req.files, req.files.image);
        return res.status(400).send({
          message: "No image file uploaded.",
          ok: false,
        });
      }

      const file = req.files.image;
      const mimetype = file.type.toLowerCase();
      const extname = file.name.split(".").pop();

      if (!checkFileType(mimetype, extname)) {
        return res.status(400).send({
          message:
            "Хибний формат файлу. Тільки JPEG, JPG, and PNG файли дозволені.",
          ok: false,
        });
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader
        .addEventListener("load", async () => {
          const promise = analyzeImage(reader.result);
          promise.then(async (description) => {
            if (description !== undefined) {
              console.log("description:", description);

              bot
                .answerWebAppQuery(queryId, {
                  type: "article",
                  id: queryId,
                  title: "Відповідь Vision",
                  input_message_content: { message_text: description },
                })
                .then((description) => {
                  console.log("succesful query: ");
                })
                .catch((error) => {
                  console.log(error);
                  bot
                    .answerWebAppQuery(queryId, {
                      type: "article",
                      id: queryId,
                      title: "Не вділося отримати відповідь Vision",
                      input_message_content: {
                        message_text: "Не вділося отримати відповідь Vision",
                      },
                    })
                    .then(() =>
                      res.status(500).send({
                        message: "Не вділося отримати відповідь Vision",
                        ok: false,
                      })
                    )
                    .catch(() =>
                      res.status(500).send({
                        message: "Не вділося отримати відповідь Vision",
                        ok: false,
                      })
                    );
                });
            } else {
              res.send({
                message: `Щось пішло не так... Спробуйте ще.`,
                ok: false,
              });
            }
          });
        })
        .catch((error) => {
          console.error(error);
          res.status(500).send({
            message: "Під час обробки картинки виникла помилка...",
            ok: false,
          });
        });
    } catch (error) {
      console.error(error);
      res.status(500).send({
        message: "Під час обробки картинки виникла помилка...",
        ok: false,
      });
    }
  }
);

app.listen(port, () => console.log(`Server started on port ${port}`));
