require("dotenv").config();

const fs = require("fs");
const FileReader = require("filereader");
const { OpenAI } = require("openai");

async function convertToBase64(file) {
  let fileData = fs.readFileSync(filePath);
  return new Buffer.from(fileData).toString("base64");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const reader = new FileReader();

async function askVision () {
  let message = undefined;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Що на цьому зображені?" },
            {
              type: "image_url",
              image_url: reader.result,
            },
          ],
        },
      ],
      max_tokens: 20,
    });
    console.log(response.choices[0]);
    message = response.choices[0].message.content;
  } catch (error) {
    console.log(error);
  }
  return message;
};
async function analyzeImage(imageFile) {

  reader.readAsDataURL(imageFile);
  reader.addEventListener("load", askVision());
  reader.removeEventListener(askVision);
  return message;
}

module.exports = analyzeImage;
