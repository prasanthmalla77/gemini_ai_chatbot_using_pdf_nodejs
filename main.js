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
  console.log("Context embeddings generated:", passages);
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
    console.log("Generated answer:", answer);
    if (
      answer.response &&
      answer.response.candidates &&
      answer.response.candidates.length > 0
    ) {
      return answer.response.candidates[0].content.parts[0].text;
    }
  } else {
    console.log("Threshold not met.");
    return "I'm sorry, I couldn't find a relevant answer to your question.";
  }
}

async function FindAnswer(passage, prompt) {
  const result = await newModel.generateContent("in this paragraph: " + passage + "  question: " + prompt);
  console.log("Answer generated:", result);
  return result.response.text();
}

export async function run(question) {

  const model = genAI.getGenerativeModel({
    model: "embedding-001",
    generationConfig,
  });

  console.log("Model initialized.");

  const texts = await parsePdf();
  console.log("PDF parsed. Texts:", texts);
  contextEmbeddings = await generateContextEmbeddings(texts, model);

  let storedFile = "test";
  const storedEmbeddings = await loadStoredEmbeddings(storedFile);
  console.log("Stored embeddings loaded.");

  if (!Array.isArray(storedEmbeddings)) {
    console.log("Stored embeddings not found.");
    return;
  }

  const bestPassage = await FindBestPassage(question, storedEmbeddings, model);
  console.log("Best passage:", bestPassage);
  const answer = await FindAnswer(bestPassage, question);
  console.log("Final answer:", answer);
  return answer;
}
