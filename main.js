import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { dot } from "mathjs";
import parsePdf from "./file.js";

dotenv.config();

const genAI = new GoogleGenerativeAI("AIzaSyArYpFlqfgcoh_3_pRt4nLHJvZ4sXeIa2I");

const generationConfig = {
  stopSequences: ["chup"],
  maxOutputTokens: 4096,
  temperature: 0.8,
  topP: 0.1,
  topK: 16,
};

const newModel = genAI.getGenerativeModel({
  model: "gemini-pro",
  generationConfig,
});

let contextEmbeddings = null;

async function generateContextEmbeddings(texts, model) {
  const passages = await Promise.all(
    texts.map(async (text) => {
      const { embedding } = await model.embedContent(text);
      return {
        text,
        embedding,
      };
    })
  );
  return passages;
}

async function loadStoredEmbeddings(storedFile) {
  return contextEmbeddings;
}

async function FindBestPassage(question, storedEmbeddings, model) {
  const questionResult = await model.embedContent(question, {
    taskType: "QUERY",
  });
  const questionEmbedding = questionResult.embedding;

  const dotProducts = storedEmbeddings.map((storedEmbedding) => {
    if (Array.isArray(storedEmbedding.embedding.values)) {
      return dot(questionEmbedding.values, storedEmbedding.embedding.values);
    } else {
      return -Infinity;
    }
  });

  const maxIndex = dotProducts.indexOf(Math.max(...dotProducts));

  var prompt = `QUESTION: ${question} PASSAGE: ${storedEmbeddings[maxIndex].text} ANSWER:`;
  const threshold = 0.5;

  if (dotProducts[maxIndex] > threshold) {
    const answer = await newModel.generateContent(prompt);
    if (
      answer.response &&
      answer.response.candidates &&
      answer.response.candidates.length > 0
    ) {
      return answer.response.candidates[0].content.parts[0].text;
    }
  } else {
    return "I'm sorry, I couldn't find a relevant answer to your question.";
  }
}

async function FindAnswer(passage, prompt) {
  const result = await newModel.generateContent("in this paragraph: " + passage + "  question: " + prompt);
  return result.response.text();
}

export async function run(question) {

  const model = genAI.getGenerativeModel({
    model: "embedding-001",
    generationConfig,
  });

  const texts = await parsePdf();
  contextEmbeddings = await generateContextEmbeddings(texts, model);

  let storedFile = "test";
  const storedEmbeddings = await loadStoredEmbeddings(storedFile);

  if (!Array.isArray(storedEmbeddings)) {
    return;
  }

  const bestPassage = await FindBestPassage(question, storedEmbeddings, model);
  const answer = await FindAnswer(bestPassage, question);
  // console.log("Best answer:", bestPassage);
  return answer
}

