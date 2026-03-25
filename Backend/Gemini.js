import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config({});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
function parseGeminiResponse(raw) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}
export const quizCreate = async (req) => {
  const { topic, quesNo,description } = req;
  // console.log(prompt);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        you are a quiz question creator so give me ${quesNo} important quiz questions on this topic ${topic} and 
        considering this ${description}
        along with 4 options and it's correct answer and make sure you are sending me the questions as an array
        of objects where each object is like {title:question name , options:4 options , correctOption:{quesionNo:the option no,answer:correct answer}}
        output format must be a json array ok
      `,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });
    const data = parseGeminiResponse(response.text);
    return data;
  } catch (e) {
    console.log(e);
  }
};
