const TelegramBot = require("node-telegram-bot-api");

const token = "7405216330:AAEX_8F-HPIVBXYm9QbN6jjZKQ_iNyn4JSk";

const bot = new TelegramBot(token, { polling: true });
const webAppUrl = "https://telegrambot228.netlify.app/";

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === "/start") {
    await bot.sendMessage(chatId, "Привіт! Натискай на кнопку нижче:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Перейти до застосунку", web_app: { url: webAppUrl } }],
        ],
      },
    });
  }
});

const analyzeImage = require("./utils/analyzeImage");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const app = require("express")();
const port = 5000;

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
        res.status(400).send({ message: "No file selected!" });
      } else {
        // res.send({
        //   message: "File uploaded!",
        //   file: `uploads/${req.file.filename}`,
        // });

        try {
          const description = await analyzeImage(
            `uploads/${req.file.filename}`
          );
          description
            ? res.send({ message: `На зображенні: ${description}` })
            : res.send({ message: `Щось пішло не так... Спробуйте ще.` });
        } catch (error) {
          res
            .status(500)
            .send({ message: "Під час обробки картинки виникла помилка..." });
        }
      }
    }
  });
});

app.listen(port, () => console.log(`Server started on port ${port}`));
