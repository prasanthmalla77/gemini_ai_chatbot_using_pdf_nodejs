import { createRequire } from "module";
const require = createRequire(import.meta.url);

// const fs = require("fs");
const fs = require('fs').promises;

const pdfParse = require("pdf-parse");
console.log(process.cwd() + "\\User.pdf");
let dataBuffer;
try {
  dataBuffer = await fs.readFile(process.cwd() + "\\User.pdf");
} catch (error) {
  console.error("Error occurred while reading the file:", error);
}

// Function to parse the PDF
async function parsePdf() {
  try {
    const data = await pdfParse(dataBuffer);
    // Split the text into chunks (assuming each line is a chunk)
    return data.text.split('\n');
  } catch (error) {
    console.error("Error occurred while parsing the PDF:", error);
    return []; // Return an empty array in case of error
  }
}

// Call parsePdf and handle the result
parsePdf().then(function(text) {
  // console.log(text);
});

export default parsePdf;
