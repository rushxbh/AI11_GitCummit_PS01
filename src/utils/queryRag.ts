import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
});
const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

async function getEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "models/embedding-001" });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export async function queryRAG(userQuery: string): Promise<string> {
  const queryEmbedding = await getEmbedding(userQuery);

  const queryResponse = await index.query({
    vector: queryEmbedding,
    topK: 5,
    includeMetadata: true,
  });

  const retrievedDocs = queryResponse.matches.map((match) => match.metadata?.text || "");
  let finalPrompt = userQuery;
  console.log(retrievedDocs)
  if (retrievedDocs.length > 0) {
    finalPrompt = `Use this full context to first understand then answer the query:\n\n${retrievedDocs.join("\n")}\n\nUser Query: ${userQuery}`;
  }

  // Send final prompt to Gemini
  console.log(finalPrompt)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(finalPrompt);
  console.log(result.response.text())
  return result.response.text();
}