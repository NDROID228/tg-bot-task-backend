require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TG_BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });
const webAppUrl = "https://telegrambot228.netlify.app/";

const chatIdMap = new Map();

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "/start") {
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
    chatIdMap.set(chatId, true);
  }
});

const analyzeImage = require("./utils/analyzeImage");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const express = require("express");
const app = express();
const port = 5000;

app.use(express.json());
app.use(cors());

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("image");

// Check file type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images Only!");
  }
}

// Route for file upload
app.post("/upload", (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.log("/upload err " + err);
      res.status(400).send({ message: err });
    } else {
      if (req.file == undefined) {
        res.status(400).send({ message: "No file selected!", ok: false });
      } else {
        try {
          const description = await analyzeImage(
            `uploads/${req.file.filename}`
          );
          if (description !== undefined) {
            const chatId = Array.from(chatIdMap.keys())[0];
            if (chatId) {
              bot.sendMessage(chatId, description);
              chatIdMap.delete(chatId);
            }
            res.send({ message: `Бот надає відповідь.`, ok: true });
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
      }
    }
  });
});

app.listen(port, () => console.log(`Server started on port ${port}`));
