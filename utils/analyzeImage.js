require('dotenv').config()

const fs = require("fs");
const { OpenAI } = require("openai");

function convertToBase64(filePath) {
  let fileData = fs.readFileSync(filePath);
  return new Buffer.from(fileData).toString("base64");
}

const openai = new OpenAI({
  
});
    
async function analyzeImage(imagePath) {
  let fileType = imagePath.match(/[^.]*$/)[0];

  if (fileType !== "png") {
    fileType = "jpeg";
  }

  console.log("file type:", fileType);

  let message = undefined
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: [
            { type: "text", text: "Що на цьому зображені?" },
            {
              type: "image_url",
              image_url: `data:image/${fileType};base64,${convertToBase64(
                imagePath
              )}`,
            },
          ],
        },
      ],
      
      max_tokens: 50
    });
    console.log(response.choices[0]);
    message = response.choices[0].message;
  } catch (error) {
    console.log(error);
    return undefined
  }
  return message
}

module.exports = analyzeImage;
